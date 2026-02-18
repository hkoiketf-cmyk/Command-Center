import { useState, useEffect } from "react";
import { ExternalLink, RefreshCw, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import type { IframeContent } from "@shared/schema";

const QUICK_EMBEDS = [
  { name: "Notion", url: "https://notion.so" },
  { name: "Trello", url: "https://trello.com" },
  { name: "Figma", url: "https://figma.com" },
  { name: "Google Docs", url: "https://docs.google.com" },
  { name: "Airtable", url: "https://airtable.com" },
  { name: "Miro", url: "https://miro.com" },
];

interface IframeWidgetProps {
  content: IframeContent;
  onContentChange: (content: IframeContent) => void;
}

export function IframeWidget({ content, onContentChange }: IframeWidgetProps) {
  const [url, setUrl] = useState(content?.url || "");
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    setUrl(content?.url || "");
  }, [content?.url]);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
  };

  const handleSubmit = () => {
    let finalUrl = url.trim();
    if (finalUrl && !finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }
    onContentChange({ url: finalUrl });
  };

  const handleRefresh = () => {
    setIframeKey((k) => k + 1);
  };

  const displayUrl = content?.url || "";

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="Enter URL (e.g., https://example.com)"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="text-sm"
          data-testid="input-iframe-url"
        />
        <Button
          size="icon"
          variant="outline"
          onClick={handleSubmit}
          data-testid="button-load-iframe"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        {displayUrl && (
          <Button
            size="icon"
            variant="outline"
            onClick={handleRefresh}
            data-testid="button-refresh-iframe"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-[200px] rounded-md border border-border overflow-hidden bg-background">
        {displayUrl ? (
          <iframe
            key={iframeKey}
            src={displayUrl}
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="Embedded content"
            data-testid="iframe-embedded"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 p-4" data-testid="iframe-empty-state">
            <Globe className="h-8 w-8 text-muted-foreground/40" />
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Enter a web address to embed</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Paste a URL above, or try one of these:</p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {QUICK_EMBEDS.map((embed) => (
                <Button
                  key={embed.name}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUrl(embed.url);
                    onContentChange({ url: embed.url });
                  }}
                  data-testid={`button-quick-embed-${embed.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {embed.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
