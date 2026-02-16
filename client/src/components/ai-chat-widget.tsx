import { useState } from "react";
import { Bot, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AiChatContent } from "@shared/schema";

const AI_TOOLS = [
  { name: "ChatGPT", url: "https://chatgpt.com", icon: "chatgpt" },
  { name: "Claude", url: "https://claude.ai", icon: "claude" },
  { name: "Gemini", url: "https://gemini.google.com", icon: "gemini" },
  { name: "Perplexity", url: "https://www.perplexity.ai", icon: "perplexity" },
  { name: "Poe", url: "https://poe.com", icon: "poe" },
  { name: "HuggingChat", url: "https://huggingface.co/chat", icon: "huggingchat" },
];

function extractUrl(input: string): string | null {
  if (!input.trim()) return null;
  const srcMatch = input.match(/src="([^"]+)"/);
  if (srcMatch) return srcMatch[1];
  let url = input.trim();
  if (!url.startsWith("http")) url = "https://" + url;
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

export function AiChatWidget({
  content,
  onContentChange,
}: {
  content: AiChatContent;
  onContentChange: (content: AiChatContent) => void;
}) {
  const safeContent = content || {};
  const [inputValue, setInputValue] = useState("");
  const [showSetup, setShowSetup] = useState(!safeContent.embedUrl);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = extractUrl(inputValue);
    if (url) {
      onContentChange({ embedUrl: url });
      setShowSetup(false);
      setError("");
    } else {
      setError("Please enter a valid URL for your AI tool.");
    }
  };

  const handleQuickSelect = (url: string) => {
    onContentChange({ embedUrl: url });
    setShowSetup(false);
    setError("");
  };

  if (showSetup || !safeContent.embedUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4" data-testid="ai-chat-setup">
        <Bot className="h-10 w-10 text-muted-foreground" />
        <div className="text-center space-y-1">
          <div className="text-sm font-medium">Embed Your AI Tool</div>
          <div className="text-xs text-muted-foreground max-w-[300px] leading-relaxed">
            Pick a popular AI assistant below or paste any URL to embed your preferred AI tool.
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full max-w-[320px]">
          {AI_TOOLS.map((tool) => (
            <button
              key={tool.name}
              onClick={() => handleQuickSelect(tool.url)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-md border border-border text-center hover-elevate"
              data-testid={`button-ai-tool-${tool.icon}`}
            >
              <Bot className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs font-medium">{tool.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full max-w-[320px]">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-muted-foreground">or paste a custom URL</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-2 max-w-[320px]">
          <Input
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setError(""); }}
            placeholder="https://your-ai-tool.com"
            className="text-sm"
            data-testid="input-ai-embed-url"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" size="sm" className="w-full" disabled={!inputValue.trim()} data-testid="button-connect-ai">
            Embed AI Tool
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="ai-chat-widget">
      <div className="flex items-center justify-end gap-1 px-3 py-2 border-b border-border shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => window.open(safeContent.embedUrl, "_blank")}
          data-testid="button-open-ai-external"
        >
          <ExternalLink className="h-3 w-3 mr-1" /> Open
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setShowSetup(true)}
          data-testid="button-change-ai-tool"
        >
          Change
        </Button>
      </div>
      <div className="flex-1 min-h-0">
        <iframe
          src={safeContent.embedUrl}
          className="w-full h-full border-0"
          title="AI Chat"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          data-testid="iframe-ai-chat"
        />
      </div>
    </div>
  );
}
