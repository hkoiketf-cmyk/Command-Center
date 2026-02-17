import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { CustomWidgetContent, WidgetTemplate } from "@shared/schema";

interface CustomWidgetProps {
  content: CustomWidgetContent;
}

export function CustomWidget({ content }: CustomWidgetProps) {
  const templateId = content?.templateId;

  const { data: template, isLoading } = useQuery<WidgetTemplate>({
    queryKey: [`/api/widget-templates/${templateId}`],
    enabled: !!templateId,
    refetchInterval: 30000,
  });

  const code = template?.code || content?.code || "";

  const wrappedCode = useMemo(() => {
    if (!code) return "";
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
  }, [code]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground" data-testid="text-custom-widget-loading">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!code) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm" data-testid="text-custom-widget-empty">
        No template code loaded
      </div>
    );
  }

  return (
    <div className="h-full" data-testid="custom-widget-container">
      <iframe
        srcDoc={wrappedCode}
        sandbox="allow-scripts"
        className="w-full h-full border-0 rounded"
        title={template?.name || content?.templateName || "Custom Widget"}
        data-testid="iframe-custom-widget"
      />
    </div>
  );
}
