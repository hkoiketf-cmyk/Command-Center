import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Send, Search, Settings, Eye, EyeOff, Crosshair, HelpCircle, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const HUNT_PHRASES = [
  "Tracking down your data...",
  "On the hunt for your info...",
  "Sniffing out those numbers...",
  "Stalking your dashboard data...",
  "Following the trail...",
  "Gathering intel for you...",
];

function getRandomPhrase() {
  return HUNT_PHRASES[Math.floor(Math.random() * HUNT_PHRASES.length)];
}

interface HunterAIProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HunterAI({ open, onOpenChange }: HunterAIProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [huntPhrase, setHuntPhrase] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [baseUrlInput, setBaseUrlInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: userSettings } = useQuery<any>({
    queryKey: ["/api/user-settings"],
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: any) => {
      const res = await apiRequest("PATCH", "/api/user-settings", updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-settings"] });
      toast({ title: "Settings saved" });
      setApiKeyInput("");
      setShowSettings(false);
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (showSettings && userSettings) {
      setBaseUrlInput(userSettings.openaiApiBaseUrl ?? "");
    }
  }, [showSettings, userSettings?.openaiApiBaseUrl]);

  const CAPABILITIES_PROMPT =
    "What can you help me with? List all the things you can do with my dashboard data so I can get the most out of HunterAI.";

  const sendMessage = useCallback(async (overrideMessage?: string) => {
    const userMsg = (overrideMessage ?? input.trim()).trim();
    if (!userMsg || isStreaming) return;
    if (!overrideMessage) setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsStreaming(true);
    setHuntPhrase(getRandomPhrase());

    try {
      const response = await fetch("/api/hunter-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
        credentials: "include",
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
    } catch (error: any) {
      const errorMsg = error.message || "Something went wrong";
      if (errorMsg.includes("API key")) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "Looks like I need an API key to start hunting! Click the gear icon above to add your OpenAI API key.",
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `The hunt hit a snag: ${errorMsg}`,
        }]);
      }
    } finally {
      setIsStreaming(false);
      setHuntPhrase("");
    }
  }, [input, isStreaming]);

  const hasKey = userSettings?.hasOpenaiKey;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:w-[400px] md:w-[440px] p-0 flex flex-col"
          data-testid="hunter-ai-panel"
        >
          <SheetHeader className="px-4 py-3 border-b bg-primary/5 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <SheetTitle className="flex items-center gap-2 text-sm">
                <Crosshair className="h-5 w-5 text-primary" />
                HunterAI
              </SheetTitle>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowSettings(true)}
                data-testid="button-hunter-ai-settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="hunter-ai-messages">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Crosshair className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-sm">Ready to hunt!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ask me anything about your dashboard data. I'll track it down for you!
                  </p>
                </div>
                {!hasKey && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    data-testid="button-setup-key"
                  >
                    <Settings className="h-3 w-3 mr-1" /> Set up API key
                  </Button>
                )}
                {hasKey && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => sendMessage(CAPABILITIES_PROMPT)}
                    disabled={isStreaming}
                    data-testid="button-see-all-capabilities"
                  >
                    See all the things I can do
                  </Button>
                )}
                <div className="w-full space-y-1.5 mt-2">
                  <p className="text-xs text-muted-foreground font-medium">Try asking:</p>
                  {[
                    "What are my current KPIs?",
                    "What are my habit streaks?",
                    "What's my focus today?",
                    "Show me my revenue this month",
                    "What deals are in my pipeline?",
                    "What's on my waiting list?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                      className="w-full text-left text-xs px-3 py-2 rounded-md border border-border hover-elevate transition-colors"
                      data-testid={`button-suggestion-${q.slice(0, 10).replace(/\s/g, "-").toLowerCase()}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                  data-testid={`message-${msg.role}-${i}`}
                >
                  {msg.role === "assistant" ? (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5"
                      dangerouslySetInnerHTML={{
                        __html: formatMarkdown(msg.content || "..."),
                      }}
                    />
                  ) : (
                    <span>{msg.content}</span>
                  )}
                </div>
              </div>
            ))}

            {isStreaming && huntPhrase && messages[messages.length - 1]?.content === "" && (
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="relative flex items-center justify-center">
                  <Search className="h-4 w-4 text-primary animate-pulse" />
                  <div className="absolute inset-0 h-4 w-4 border-2 border-primary/30 rounded-full animate-ping" />
                </div>
                <span className="text-xs text-muted-foreground italic">{huntPhrase}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-3 shrink-0">
            {messages.length > 0 && hasKey && (
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => sendMessage(CAPABILITIES_PROMPT)}
                  disabled={isStreaming}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                  data-testid="link-see-all-capabilities"
                >
                  See all the things I can do
                </button>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask HunterAI anything..."
                disabled={isStreaming}
                data-testid="input-hunter-ai"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isStreaming}
                data-testid="button-hunter-ai-send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-sm" data-testid="hunter-ai-settings-dialog">
          <DialogHeader>
            <DialogTitle>HunterAI Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  data-testid="button-how-to-get-key"
                >
                  {helpOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <HelpCircle className="h-4 w-4" />
                  How do I get an API key?
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-2">
                <p className="text-xs text-muted-foreground">
                  HunterAI needs an API key to answer questions. Without one, the assistant cannot run.
                </p>
                <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1.5">
                  <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">platform.openai.com/api-keys</a> (or your preferred provider).</li>
                  <li>Sign in or create an account.</li>
                  <li>Click &quot;Create new secret key&quot;, name it (e.g. &quot;Command Center&quot;), and copy the key.</li>
                  <li>Paste the key below and click Save. Your key is stored only on your instance and never shared.</li>
                </ol>
                <p className="text-xs text-muted-foreground">
                  You can also use any OpenAI-compatible API (e.g. OpenRouter, Together, local models). Set the optional base URL below and use that provider&apos;s API key.
                </p>
              </CollapsibleContent>
            </Collapsible>

            <div className="space-y-2">
              <Label className="text-sm">API Key (OpenAI or compatible)</Label>
              <p className="text-xs text-muted-foreground">
                Stored securely on your instance. Each user provides their own key.
              </p>
              {hasKey && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Key configured: {userSettings?.openaiApiKey}
                </p>
              )}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={hasKey ? "Enter new key to update" : "sk-..."}
                    data-testid="input-openai-key"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    data-testid="button-toggle-key-visibility"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">API base URL (optional)</Label>
              <p className="text-xs text-muted-foreground">
                Leave blank for OpenAI. Set for OpenRouter, Together, or other OpenAI-compatible endpoints.
              </p>
              <Input
                type="url"
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
                placeholder="https://api.openai.com/v1"
                data-testid="input-openai-base-url"
              />
            </div>

            <Button
              size="sm"
              onClick={() => {
                const payload: Record<string, string | null> = {};
                if (apiKeyInput.trim()) payload.openaiApiKey = apiKeyInput.trim();
                payload.openaiApiBaseUrl = baseUrlInput.trim() || null;
                updateSettings.mutate(payload);
              }}
              disabled={(!apiKeyInput.trim() && baseUrlInput === (userSettings?.openaiApiBaseUrl ?? "")) || updateSettings.isPending}
              data-testid="button-save-key"
            >
              {updateSettings.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold text-sm mt-2 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-semibold mt-2 mb-1">$1</h2>')
    .replace(/^- (.+)$/gm, '<li class="ml-3">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul class="list-disc">$&</ul>')
    .replace(/\n/g, "<br/>");
}
