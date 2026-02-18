import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AiWidgetBuilder } from "@/components/ai-widget-builder";
import type { CustomWidgetContent, WidgetTemplate } from "@shared/schema";

interface CustomWidgetProps {
  content: CustomWidgetContent;
  onContentChange?: (content: CustomWidgetContent) => void;
}

export function CustomWidget({ content, onContentChange }: CustomWidgetProps) {
  const templateId = content?.templateId;
  const [showEditor, setShowEditor] = useState(false);

  const { data: template, isLoading } = useQuery<WidgetTemplate>({
    queryKey: [`/api/widget-templates/${templateId}`],
    enabled: !!templateId,
    refetchInterval: 30000,
  });

  const code = template?.code || content?.code || "";

  const wrappedCode = useMemo(() => {
    if (!code) return "";
    const errorBridge = `<script>
window.onerror = function(msg, src, line) {
  try { parent.postMessage({ type: "iframe-error", source: "custom-widget", message: msg + (line ? " (line " + line + ")" : "") }, "*"); } catch(e) {}
  return true;
};
</script>`;
    const trimmed = code.trim();
    const lower = trimmed.toLowerCase();
    const isFullDoc = lower.startsWith("<!doctype") || lower.startsWith("<html");
    if (isFullDoc) {
      if (/<head[\s>]/i.test(trimmed)) {
        return trimmed.replace(/<head([^>]*)>/i, `<head$1>${errorBridge}`);
      }
      if (/<body[\s>]/i.test(trimmed)) {
        return trimmed.replace(/<body([^>]*)>/i, `<body$1>${errorBridge}`);
      }
      return trimmed;
    }
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${errorBridge}
  <style>*{box-sizing:border-box;}body{margin:0;padding:16px;font-family:system-ui,-apple-system,sans-serif;background:transparent;}</style>
</head>
<body>
${trimmed}
</body>
</html>`;
  }, [code]);

  const handleEditSave = (newCode: string, newTitle: string) => {
    if (onContentChange) {
      onContentChange({
        ...content,
        code: newCode,
        templateName: newTitle || content?.templateName,
        templateId: undefined,
      });
    }
    setShowEditor(false);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground" data-testid="text-custom-widget-loading">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!code) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-3" data-testid="text-custom-widget-empty">
        <span>No template code loaded</span>
        {onContentChange && (
          <Button variant="outline" size="sm" onClick={() => setShowEditor(true)} data-testid="button-edit-empty-widget">
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Build with AI
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full relative group" data-testid="custom-widget-container">
      <iframe
        srcDoc={wrappedCode}
        sandbox="allow-scripts"
        className="w-full h-full border-0 rounded"
        title={template?.name || content?.templateName || "Custom Widget"}
        data-testid="iframe-custom-widget"
      />

      {onContentChange && (
        <div className="absolute top-2 right-2 z-50 invisible group-hover:visible pointer-events-auto" data-testid="custom-widget-edit-overlay">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowEditor(true)}
            className="h-7 text-xs shadow-md"
            data-testid="button-edit-custom-widget"
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>
      )}

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Edit Widget
            </DialogTitle>
          </DialogHeader>
          <AiWidgetBuilder
            onAddWidget={handleEditSave}
            onClose={() => setShowEditor(false)}
            initialCode={code}
            initialTitle={content?.templateName || ""}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
