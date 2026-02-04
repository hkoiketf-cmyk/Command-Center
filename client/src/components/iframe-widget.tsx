import { useState, useEffect } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { IframeContent } from "@shared/schema";

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
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Enter a URL to embed external content
          </div>
        )}
      </div>
    </div>
  );
}
