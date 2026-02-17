import { useState, useRef, useEffect, useCallback } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Eye, Copy, Pencil, Check, Columns2, AlertTriangle, X, LayoutTemplate, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CodeContent } from "@shared/schema";

interface CodeWidgetProps {
  content: CodeContent;
  onContentChange: (content: CodeContent) => void;
}

const CODE_TEMPLATES = [
  {
    name: "Metric Card",
    description: "Display a key number with label",
    code: `<div style="text-align:center; padding:20px;">
  <div style="font-size:36px; font-weight:bold; color:#3b82f6;">1,247</div>
  <div style="font-size:14px; color:#888; margin-top:4px;">Total Customers</div>
  <div style="font-size:12px; color:#22c55e; margin-top:8px;">+12% this month</div>
</div>`,
  },
  {
    name: "Progress Bar",
    description: "Visual progress toward a goal",
    code: `<div style="padding:16px;">
  <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
    <span style="font-size:14px; font-weight:600;">Q1 Revenue Goal</span>
    <span style="font-size:14px; color:#888;">$72k / $100k</span>
  </div>
  <div style="background:#e5e7eb; border-radius:999px; height:12px; overflow:hidden;">
    <div style="background:linear-gradient(90deg,#3b82f6,#8b5cf6); height:100%; width:72%; border-radius:999px; transition:width 1s;"></div>
  </div>
  <div style="font-size:12px; color:#22c55e; margin-top:6px;">72% complete</div>
</div>`,
  },
  {
    name: "Countdown",
    description: "Live countdown to a date",
    code: `<div id="countdown" style="text-align:center; padding:20px; font-family:system-ui;">
  <div style="font-size:13px; color:#888; margin-bottom:8px;">Product Launch In</div>
  <div id="timer" style="font-size:32px; font-weight:bold; letter-spacing:2px;">--:--:--:--</div>
</div>
<script>
  const target = new Date();
  target.setDate(target.getDate() + 14);
  function update() {
    const diff = target - new Date();
    if (diff <= 0) { document.getElementById('timer').textContent = 'LAUNCHED!'; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('timer').textContent = d + 'd ' + h + 'h ' + m + 'm ' + s + 's';
  }
  update();
  setInterval(update, 1000);
</script>`,
  },
  {
    name: "Quote Rotator",
    description: "Rotating motivational quotes",
    code: `<div id="quote-box" style="padding:24px; text-align:center; font-family:system-ui;">
  <div id="quote" style="font-size:16px; font-style:italic; line-height:1.5; color:#555;"></div>
  <div id="author" style="font-size:13px; color:#999; margin-top:12px;"></div>
</div>
<script>
  const quotes = [
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
    { text: "Success is not final, failure is not fatal.", author: "Winston Churchill" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  ];
  let i = 0;
  function show() {
    document.getElementById('quote').textContent = '"' + quotes[i].text + '"';
    document.getElementById('author').textContent = '— ' + quotes[i].author;
    i = (i + 1) % quotes.length;
  }
  show();
  setInterval(show, 8000);
</script>`,
  },
  {
    name: "Status List",
    description: "Checklist with colored status dots",
    code: `<div style="padding:12px; font-family:system-ui;">
  <div style="font-size:14px; font-weight:600; margin-bottom:12px;">System Status</div>
  <div style="display:flex; flex-direction:column; gap:8px;">
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="width:8px; height:8px; border-radius:50%; background:#22c55e; display:inline-block;"></span>
      <span style="font-size:13px;">Website — Operational</span>
    </div>
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="width:8px; height:8px; border-radius:50%; background:#22c55e; display:inline-block;"></span>
      <span style="font-size:13px;">API — Operational</span>
    </div>
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="width:8px; height:8px; border-radius:50%; background:#f59e0b; display:inline-block;"></span>
      <span style="font-size:13px;">Email Service — Degraded</span>
    </div>
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="width:8px; height:8px; border-radius:50%; background:#22c55e; display:inline-block;"></span>
      <span style="font-size:13px;">Database — Operational</span>
    </div>
  </div>
</div>`,
  },
  {
    name: "Mini Chart",
    description: "Simple bar chart with CSS",
    code: `<div style="padding:16px; font-family:system-ui;">
  <div style="font-size:14px; font-weight:600; margin-bottom:12px;">Weekly Revenue</div>
  <div style="display:flex; align-items:flex-end; gap:6px; height:100px;">
    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;">
      <div style="width:100%; background:#3b82f6; border-radius:4px 4px 0 0; height:60%;"></div>
      <span style="font-size:10px; color:#888;">Mon</span>
    </div>
    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;">
      <div style="width:100%; background:#3b82f6; border-radius:4px 4px 0 0; height:80%;"></div>
      <span style="font-size:10px; color:#888;">Tue</span>
    </div>
    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;">
      <div style="width:100%; background:#3b82f6; border-radius:4px 4px 0 0; height:45%;"></div>
      <span style="font-size:10px; color:#888;">Wed</span>
    </div>
    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;">
      <div style="width:100%; background:#3b82f6; border-radius:4px 4px 0 0; height:90%;"></div>
      <span style="font-size:10px; color:#888;">Thu</span>
    </div>
    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;">
      <div style="width:100%; background:#8b5cf6; border-radius:4px 4px 0 0; height:100%;"></div>
      <span style="font-size:10px; color:#888;">Fri</span>
    </div>
  </div>
</div>`,
  },
];

export function CodeWidget({ content, onContentChange }: CodeWidgetProps) {
  const [isEditing, setIsEditing] = useState(!content?.code);
  const [viewMode, setViewMode] = useState<"split" | "preview" | "code">("split");
  const [localCode, setLocalCode] = useState(content?.code || "");
  const [iframeErrors, setIframeErrors] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(!content?.code);
  const [templatePage, setTemplatePage] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLocalCode(content?.code || "");
  }, [content?.code]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "code-widget-error" && iframeRef.current) {
        try {
          if (e.source === iframeRef.current.contentWindow) {
            setIframeErrors(prev => {
              const msg = e.data.message;
              if (prev.includes(msg)) return prev;
              return [...prev.slice(-2), msg];
            });
          }
        } catch {
          // cross-origin check failed, ignore
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleSave = () => {
    onContentChange({ code: localCode, language: "html" });
    setIsEditing(false);
    setIframeErrors([]);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localCode);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleSelectTemplate = (code: string) => {
    setLocalCode(code);
    onContentChange({ code, language: "html" });
    setShowTemplates(false);
    setIsEditing(false);
    setIframeErrors([]);
  };

  const wrapCodeInHtml = useCallback((code: string): string => {
    const trimmed = code.trim();
    if (trimmed.toLowerCase().startsWith("<!doctype") || trimmed.toLowerCase().startsWith("<html")) {
      return code + `
<script>
window.onerror = function(msg, src, line) {
  parent.postMessage({ type: 'code-widget-error', message: 'Line ' + line + ': ' + msg }, '*');
  return true;
};
</script>`;
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
<script>
window.onerror = function(msg, src, line) {
  parent.postMessage({ type: 'code-widget-error', message: 'Line ' + line + ': ' + msg }, '*');
  return true;
};
</script>
</body>
</html>`;
  }, []);

  const templatesPerPage = 3;
  const totalPages = Math.ceil(CODE_TEMPLATES.length / templatesPerPage);
  const visibleTemplates = CODE_TEMPLATES.slice(templatePage * templatesPerPage, (templatePage + 1) * templatesPerPage);

  if (showTemplates && !localCode) {
    return (
      <div className="h-full flex flex-col" data-testid="code-widget-templates">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <LayoutTemplate className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">Start with a template</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setShowTemplates(false); setIsEditing(true); }}
            data-testid="button-code-blank-start"
          >
            <Code className="h-3 w-3 mr-1" />
            Blank
          </Button>
        </div>
        <div className="flex-1 space-y-2 overflow-auto">
          {visibleTemplates.map((t, i) => (
            <button
              key={templatePage * templatesPerPage + i}
              onClick={() => handleSelectTemplate(t.code)}
              className="w-full text-left p-2.5 rounded-md border border-border hover-elevate transition-colors"
              data-testid={`button-code-template-${templatePage * templatesPerPage + i}`}
            >
              <div className="text-sm font-medium">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.description}</div>
            </button>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={templatePage === 0}
              onClick={() => setTemplatePage(p => p - 1)}
              data-testid="button-template-prev"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground">{templatePage + 1}/{totalPages}</span>
            <Button
              variant="ghost"
              size="icon"
              disabled={templatePage >= totalPages - 1}
              onClick={() => setTemplatePage(p => p + 1)}
              data-testid="button-template-next"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  const renderEditor = () => (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
      {isEditing ? (
        <Textarea
          ref={textareaRef}
          value={localCode}
          onChange={(e) => setLocalCode(e.target.value)}
          onBlur={() => {
            onContentChange({ code: localCode, language: "html" });
          }}
          placeholder="Paste your HTML/JavaScript code here..."
          className="flex-1 font-mono text-xs resize-none leading-5 bg-zinc-900 text-zinc-200 border-0 rounded-md focus-visible:ring-1"
          spellCheck={false}
          data-testid="textarea-code"
        />
      ) : (
        <div className="flex-1 overflow-auto rounded-md bg-zinc-900 p-2 min-h-0" onClick={() => setIsEditing(true)} data-testid="code-highlight-view">
          <Highlight theme={themes.nightOwl} code={localCode || ""} language="markup">
            {({ tokens, getLineProps, getTokenProps }) => (
              <pre className="text-xs font-mono leading-5 m-0 cursor-text">
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })} className="flex">
                    <span className="text-zinc-600 select-none w-8 text-right pr-3 shrink-0">{i + 1}</span>
                    <span className="flex-1">
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </span>
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </div>
      )}
    </div>
  );

  const renderPreview = () => (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
      {localCode ? (
        <div className="flex-1 overflow-hidden rounded-md border bg-white min-h-0">
          <iframe
            ref={iframeRef}
            srcDoc={wrapCodeInHtml(localCode)}
            className="w-full h-full border-0"
            sandbox="allow-scripts"
            title="Code Preview"
            data-testid="iframe-code-preview"
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm rounded-md border border-dashed">
          No code to preview
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col" data-testid="code-widget">
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        <div className="flex items-center gap-0.5 border rounded-md p-0.5">
          <Button
            variant={viewMode === "split" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setViewMode("split")}
            data-testid="button-view-split"
          >
            <Columns2 className="h-3 w-3 mr-1" />
            Split
          </Button>
          <Button
            variant={viewMode === "preview" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setViewMode("preview")}
            data-testid="button-view-preview"
          >
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
          <Button
            variant={viewMode === "code" ? "secondary" : "ghost"}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setViewMode("code")}
            data-testid="button-view-code"
          >
            <Code className="h-3 w-3 mr-1" />
            Code
          </Button>
        </div>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { setShowTemplates(true); setLocalCode(""); }}
          title="Browse templates"
          data-testid="button-show-templates"
        >
          <LayoutTemplate className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          data-testid="button-copy-code"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={isEditing ? "default" : "ghost"}
          size="icon"
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          data-testid="button-edit-code"
        >
          {isEditing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {iframeErrors.length > 0 && (
        <div className="flex items-start gap-2 p-2 mb-2 rounded-md bg-destructive/10 border border-destructive/20 text-xs" data-testid="code-error-banner">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-0.5">
            {iframeErrors.map((err, i) => (
              <div key={i} className="text-destructive truncate">{err}</div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setIframeErrors([])}
            data-testid="button-dismiss-errors"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className={`flex-1 min-h-0 ${viewMode === "split" ? "flex gap-2" : "flex flex-col"}`}>
        {(viewMode === "split" || viewMode === "code") && renderEditor()}
        {(viewMode === "split" || viewMode === "preview") && renderPreview()}
      </div>
    </div>
  );
}
