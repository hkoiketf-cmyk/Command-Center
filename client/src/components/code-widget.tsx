import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Code, Eye, Copy, Pencil, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CodeContent } from "@shared/schema";

interface CodeWidgetProps {
  content: CodeContent;
  onContentChange: (content: CodeContent) => void;
}

export function CodeWidget({ content, onContentChange }: CodeWidgetProps) {
  const [isEditing, setIsEditing] = useState(!content?.code);
  const [showCode, setShowCode] = useState(false);
  const [localCode, setLocalCode] = useState(content?.code || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLocalCode(content?.code || "");
  }, [content?.code]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onContentChange({ code: localCode, language: "html" });
    setIsEditing(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localCode);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const wrapCodeInHtml = (code: string): string => {
    const trimmed = code.trim();
    if (trimmed.toLowerCase().startsWith("<!doctype") || trimmed.toLowerCase().startsWith("<html")) {
      return code;
    }
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body { 
      margin: 0; 
      padding: 16px; 
      font-family: system-ui, -apple-system, sans-serif;
      background: transparent;
    }
  </style>
</head>
<body>
${code}
</body>
</html>`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1 mb-2">
        {!isEditing && localCode && (
          <>
            <Button
              variant={showCode ? "ghost" : "secondary"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowCode(false)}
              data-testid="button-view-preview"
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
            <Button
              variant={showCode ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowCode(true)}
              data-testid="button-view-code"
            >
              <Code className="h-3 w-3 mr-1" />
              Code
            </Button>
          </>
        )}
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleCopy}
          data-testid="button-copy-code"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={isEditing ? "default" : "ghost"}
          size="icon"
          className="h-7 w-7"
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          data-testid="button-edit-code"
        >
          {isEditing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {isEditing ? (
        <Textarea
          ref={textareaRef}
          value={localCode}
          onChange={(e) => setLocalCode(e.target.value)}
          onBlur={() => {
            onContentChange({ code: localCode, language: "html" });
          }}
          placeholder="Paste your HTML/JavaScript code here..."
          className="flex-1 font-mono text-sm resize-none min-h-[200px]"
          data-testid="textarea-code"
        />
      ) : showCode ? (
        <div className="flex-1 overflow-auto rounded-md bg-zinc-900 p-3">
          <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap break-all">
            {localCode}
          </pre>
        </div>
      ) : localCode ? (
        <div className="flex-1 overflow-hidden rounded-md border bg-white">
          <iframe
            srcDoc={wrapCodeInHtml(localCode)}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            title="Code Preview"
            data-testid="iframe-code-preview"
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Click edit to add HTML/JavaScript code
        </div>
      )}
    </div>
  );
}
