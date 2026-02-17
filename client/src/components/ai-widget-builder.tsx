import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Wand2, Send, Eye, Code, Loader2, RotateCcw, Check, Key, CheckCircle2, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AiWidgetBuilderProps {
  onAddWidget: (code: string, title: string) => void;
  onClose: () => void;
  initialCode?: string;
  initialTitle?: string;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  summary?: string;
}

const PROMPT_SUGGESTIONS = [
  "A motivational quote rotator with smooth fade animations",
  "A Pomodoro timer with a visual progress ring",
  "A goal progress tracker with animated bars",
  "A digital clock with date and weather-style theme",
  "A sticky note board with draggable colorful cards",
  "A mini habit streak counter with fire animations",
];

export function AiWidgetBuilder({ onAddWidget, onClose, initialCode, initialTitle }: AiWidgetBuilderProps) {
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState(initialCode || "");
  const [widgetTitle, setWidgetTitle] = useState(initialTitle || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(!!initialCode);
  const [error, setError] = useState("");
  const [generationPhase, setGenerationPhase] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>(() => {
    if (initialCode) {
      return [{ role: "assistant", content: initialCode, summary: "Existing widget code loaded" }];
    }
    return [];
  });
  const [originalPrompt, setOriginalPrompt] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const chatLogRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [conversation]);

  const streamFromEndpoint = async (body: Record<string, unknown>, signal: AbortSignal, onChunk?: (text: string) => void): Promise<string> => {
    const response = await fetch("/api/ai/generate-widget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to generate widget");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to read response");

    let fullText = "";
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
              fullText += parsed.content;
              if (onChunk) onChunk(fullText);
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e: any) {
            if (e.message && !e.message.includes("JSON")) throw e;
          }
        }
      }
    }

    return fullText;
  };

  const cleanCode = (raw: string): string => {
    let code = raw.trim();
    const fenceMatch = code.match(/```(?:html)?\s*\n?([\s\S]*?)```/);
    if (fenceMatch) {
      code = fenceMatch[1].trim();
    }
    if (code.includes("<!DOCTYPE") || code.includes("<html") || code.includes("<div") || code.includes("<style")) {
      const htmlStart = code.indexOf("<!DOCTYPE");
      const htmlStart2 = code.indexOf("<html");
      const start = htmlStart >= 0 ? htmlStart : htmlStart2;
      if (start > 0) {
        code = code.substring(start);
      }
    }
    return code;
  };

  const buildConversationHistory = (): { role: string; content: string }[] => {
    const messages: { role: string; content: string }[] = [];
    for (const msg of conversation) {
      if (msg.role === "user") {
        messages.push({ role: "user", content: msg.content });
      }
    }
    return messages;
  };

  const generateWidget = useCallback(async (userPrompt: string) => {
    if (!userPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError("");

    const isFirstGeneration = conversation.length === 0;
    const hasExistingCode = !!generatedCode;

    if (isFirstGeneration) {
      setOriginalPrompt(userPrompt);
    }

    setConversation(prev => [...prev, { role: "user", content: userPrompt, summary: userPrompt }]);

    try {
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      if (isFirstGeneration && !hasExistingCode) {
        setGenerationPhase("Building your widget...");
        setGeneratedCode("");
        setShowPreview(false);

        const rawCode = await streamFromEndpoint({
          prompt: userPrompt,
          mode: "generate",
          conversationHistory: [],
        }, signal, (text) => setGeneratedCode(text));

        let firstPassCode = cleanCode(rawCode);

        setGenerationPhase("AI is reviewing and polishing...");
        setGeneratedCode("");

        const reviewedCode = await streamFromEndpoint({
          prompt: `You are reviewing your own output. The user asked for: "${userPrompt}". Here is the code you generated. Review it thoroughly. Fix ALL bugs. Improve the visual design. Ensure all interactive elements work. Ensure it's responsive for 300-600px containers. Return the complete improved HTML code - output ONLY the code, no explanations.`,
          currentCode: firstPassCode,
          mode: "review",
          conversationHistory: [],
        }, signal, (text) => setGeneratedCode(text));

        const finalCode = cleanCode(reviewedCode);
        setGeneratedCode(finalCode);

        setConversation(prev => [...prev, { role: "assistant", content: finalCode, summary: "Generated and reviewed widget" }]);

        if (!widgetTitle) {
          const titleMatch = finalCode.match(/<title>(.*?)<\/title>/i);
          if (titleMatch && titleMatch[1] && titleMatch[1].length < 50) {
            setWidgetTitle(titleMatch[1]);
          } else {
            const words = userPrompt.split(" ").slice(0, 5).join(" ");
            setWidgetTitle(words.charAt(0).toUpperCase() + words.slice(1));
          }
        }
      } else {
        setGenerationPhase("Applying your changes...");

        const history = buildConversationHistory();

        const refinedCode = await streamFromEndpoint({
          prompt: userPrompt,
          currentCode: generatedCode,
          mode: "refine",
          conversationHistory: history,
          originalPrompt: originalPrompt || undefined,
        }, signal, (text) => setGeneratedCode(text));

        const finalCode = cleanCode(refinedCode);
        setGeneratedCode(finalCode);

        setConversation(prev => [...prev, { role: "assistant", content: finalCode, summary: "Applied changes" }]);
      }

      setShowPreview(true);
      setPrompt("");
      setGenerationPhase("");
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Generation failed");
        setConversation(prev => prev.slice(0, -1));
      }
      setGenerationPhase("");
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, generatedCode, widgetTitle, conversation, originalPrompt]);

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
    setPrompt("");
    setError("");
    setGenerationPhase("");
    setConversation([]);
    setOriginalPrompt("");
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

  const isEditMode = !!initialCode;
  const hasConversation = conversation.length > 0;
  const userMessages = conversation.filter(m => m.role === "user");

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

      {!generatedCode && !isGenerating && !hasConversation ? (
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {isEditMode 
              ? "Describe the changes you want to make to your widget."
              : "Describe the widget you want and AI will build it. It generates, then self-reviews and polishes the code automatically."
            }
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
              placeholder={hasKey ? "Describe your widget in detail... e.g. 'A Pomodoro timer with 25min work / 5min break cycles, a visual ring that fills up, start/pause/reset buttons, and a session counter'" : "Add your OpenAI API key above to get started..."}
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
              <Wand2 className="h-4 w-4 mr-2" />
              Build Widget
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

          {isGenerating && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-primary/5 border border-primary/10">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
              <span className="text-xs text-primary font-medium">{generationPhase || "Working..."}</span>
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

          {userMessages.length > 0 && (
            <div ref={chatLogRef} className="max-h-[80px] overflow-y-auto rounded-md border px-3 py-2 space-y-1">
              {userMessages.map((msg, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <MessageSquare className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{msg.summary || msg.content}</span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask for changes... e.g. 'Make the colors more vibrant' or 'Add a reset button at the bottom'"
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
            disabled={isGenerating || !generatedCode.trim()}
            data-testid="button-add-ai-widget"
          >
            <Check className="h-4 w-4 mr-2" />
            {isEditMode ? "Save Changes" : "Add to Dashboard"}
          </Button>
        </div>
      )}
    </div>
  );
}
