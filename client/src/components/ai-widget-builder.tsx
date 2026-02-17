import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Wand2, Send, Eye, Code, Loader2, RotateCcw, Check, Key, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AiWidgetBuilderProps {
  onAddWidget: (code: string, title: string) => void;
  onClose: () => void;
}

const PROMPT_SUGGESTIONS = [
  "A motivational quote rotator with smooth fade animations",
  "A Pomodoro timer with a visual progress ring",
  "A goal progress tracker with animated bars",
  "A digital clock with date and weather-style theme",
  "A sticky note board with draggable colorful cards",
  "A mini habit streak counter with fire animations",
];

export function AiWidgetBuilder({ onAddWidget, onClose }: AiWidgetBuilderProps) {
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [widgetTitle, setWidgetTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<{ role: string; text: string }[]>([]);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const { data: userSettings } = useQuery<{ hasOpenaiKey: boolean; openaiApiKey: string | null }>({
    queryKey: ["/api/user-settings"],
  });

  const hasKey = !!userSettings?.hasOpenaiKey;

  const saveApiKey = useMutation({
    mutationFn: (key: string) => apiRequest("PATCH", "/api/user-settings", { openaiApiKey: key }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-settings"] });
      toast({ title: "API key saved successfully" });
      setApiKeyInput("");
      setShowApiKeyForm(false);
    },
    onError: () => {
      toast({ title: "Failed to save API key", variant: "destructive" });
    },
  });

  const removeApiKey = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/user-settings", { openaiApiKey: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-settings"] });
      toast({ title: "API key removed" });
    },
  });

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const generateWidget = useCallback(async (userPrompt: string) => {
    if (!userPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError("");
    setShowPreview(false);

    setHistory(prev => [...prev, { role: "user", text: userPrompt }]);

    try {
      abortRef.current = new AbortController();

      const response = await fetch("/api/ai/generate-widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          currentCode: generatedCode || undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.error || "Failed to generate widget");
        setIsGenerating(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setError("Failed to read response");
        setIsGenerating(false);
        return;
      }

      let fullCode = "";
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullCode += parsed.content;
                setGeneratedCode(fullCode);
              }
              if (parsed.error) {
                setError(parsed.error);
              }
            } catch {}
          }
        }
      }

      let cleanedCode = fullCode.trim();
      const fenceMatch = cleanedCode.match(/```(?:html)?\s*\n?([\s\S]*?)```/);
      if (fenceMatch) {
        cleanedCode = fenceMatch[1].trim();
      }
      setGeneratedCode(cleanedCode);

      if (!widgetTitle && cleanedCode) {
        const titleMatch = cleanedCode.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) {
          setWidgetTitle(titleMatch[1]);
        } else {
          const words = userPrompt.split(" ").slice(0, 4).join(" ");
          setWidgetTitle(words.charAt(0).toUpperCase() + words.slice(1));
        }
      }

      setHistory(prev => [...prev, { role: "ai", text: "Widget generated successfully!" }]);
      setShowPreview(true);
      setPrompt("");
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Generation failed");
      }
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, generatedCode, widgetTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateWidget(prompt);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    generateWidget(suggestion);
  };

  const handleAddToBoard = () => {
    if (!generatedCode.trim()) {
      toast({ title: "No code to add", variant: "destructive" });
      return;
    }
    const title = widgetTitle.trim() || "AI Widget";
    onAddWidget(generatedCode, title);
    toast({ title: `"${title}" added to your dashboard` });
  };

  const handleStartOver = () => {
    setGeneratedCode("");
    setWidgetTitle("");
    setShowPreview(false);
    setHistory([]);
    setPrompt("");
    setError("");
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const key = apiKeyInput.trim();
    if (!key) return;
    saveApiKey.mutate(key);
  };

  const wrapCode = (rawCode: string): string => {
    const trimmed = rawCode.trim();
    if (trimmed.toLowerCase().startsWith("<!doctype") || trimmed.toLowerCase().startsWith("<html")) {
      return rawCode;
    }
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; background: transparent; }
  </style>
</head>
<body>
${rawCode}
</body>
</html>`;
  };

  return (
    <div className="flex flex-col h-full gap-4" data-testid="ai-widget-builder">
      <div className="rounded-lg border p-3" data-testid="api-key-section">
        {hasKey ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <span className="text-muted-foreground">
                OpenAI key connected
                {userSettings?.openaiApiKey && (
                  <span className="ml-1 font-mono text-xs">({userSettings.openaiApiKey})</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowApiKeyForm(!showApiKeyForm)}
                className="text-xs h-7"
                data-testid="button-change-api-key"
              >
                Change
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeApiKey.mutate()}
                className="text-xs h-7 text-destructive"
                disabled={removeApiKey.isPending}
                data-testid="button-remove-api-key"
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <Key className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              Connect your OpenAI API key to start building
            </span>
          </div>
        )}

        {(!hasKey || showApiKeyForm) && (
          <form onSubmit={handleSaveApiKey} className="flex items-center gap-2 mt-2" data-testid="form-api-key">
            <Input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="sk-..."
              className="text-sm flex-1 font-mono"
              data-testid="input-openai-api-key"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!apiKeyInput.trim() || saveApiKey.isPending}
              data-testid="button-save-api-key"
            >
              {saveApiKey.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
            </Button>
            {showApiKeyForm && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => { setShowApiKeyForm(false); setApiKeyInput(""); }}
                data-testid="button-cancel-api-key"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </form>
        )}
      </div>

      {!generatedCode ? (
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Describe the widget you want and AI will build it for you.
            You can iterate and refine until it's perfect.
          </p>

          {error && (
            <div className="w-full max-w-md rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="w-full max-w-md space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Try a suggestion:</p>
            <div className="grid grid-cols-1 gap-1.5">
              {PROMPT_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  disabled={isGenerating || !hasKey}
                  className="text-left text-xs px-3 py-2 rounded-md border border-border hover-elevate transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid={`button-suggestion-${s.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-2">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={hasKey ? "Describe your widget... e.g. 'A beautiful countdown timer to New Year's Eve with fireworks animation'" : "Add your OpenAI API key above to get started..."}
              className="resize-none text-sm min-h-[80px]"
              disabled={isGenerating || !hasKey}
              data-testid="textarea-widget-prompt"
            />
            <Button
              type="submit"
              className="w-full"
              disabled={!prompt.trim() || isGenerating || !hasKey}
              data-testid="button-generate-widget"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Widget
                </>
              )}
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <input
                value={widgetTitle}
                onChange={(e) => setWidgetTitle(e.target.value)}
                className="text-sm font-medium bg-transparent border-b border-dashed border-muted-foreground/30 focus:border-primary outline-none px-1 py-0.5 min-w-[120px]"
                placeholder="Widget title..."
                data-testid="input-ai-widget-title"
              />
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant={showPreview ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                data-testid="button-toggle-ai-preview"
              >
                {showPreview ? <Code className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                {showPreview ? "Code" : "Preview"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartOver}
                data-testid="button-start-over"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Start Over
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {showPreview ? (
            <div className="flex-1 min-h-[250px] border rounded-lg overflow-hidden">
              <iframe
                srcDoc={wrapCode(generatedCode)}
                sandbox="allow-scripts"
                className="w-full h-full border-0"
                title="AI Widget Preview"
                data-testid="iframe-ai-widget-preview"
              />
            </div>
          ) : (
            <div className="flex-1 min-h-[250px]">
              <Textarea
                value={generatedCode}
                onChange={(e) => setGeneratedCode(e.target.value)}
                className="font-mono text-xs h-full resize-none"
                data-testid="textarea-ai-widget-code"
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask for changes... e.g. 'Make it blue' or 'Add a reset button'"
              className="resize-none text-sm min-h-[44px] max-h-[80px] flex-1"
              disabled={isGenerating}
              data-testid="textarea-widget-refine"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!prompt.trim() || isGenerating}
              data-testid="button-refine-widget"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>

          <Button
            className="w-full"
            onClick={handleAddToBoard}
            data-testid="button-add-ai-widget"
          >
            <Check className="h-4 w-4 mr-2" />
            Add to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
