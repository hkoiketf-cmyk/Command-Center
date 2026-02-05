import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Check, Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useToast } from "@/hooks/use-toast";
import type { CodeContent } from "@shared/schema";

interface CodeWidgetProps {
  content: CodeContent;
  onContentChange: (content: CodeContent) => void;
}

const LANGUAGES = [
  { value: "html", label: "HTML" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "css", label: "CSS" },
  { value: "python", label: "Python" },
  { value: "json", label: "JSON" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "text", label: "Plain Text" },
];

export function CodeWidget({ content, onContentChange }: CodeWidgetProps) {
  const [isEditing, setIsEditing] = useState(!content?.code);
  const [localCode, setLocalCode] = useState(content?.code || "");
  const [language, setLanguage] = useState(content?.language || "html");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLocalCode(content?.code || "");
    setLanguage(content?.language || "html");
  }, [content?.code, content?.language]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onContentChange({ code: localCode, language });
    setIsEditing(false);
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    onContentChange({ code: localCode, language: newLang });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localCode);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-32 h-8" data-testid="select-code-language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleCopy}
          data-testid="button-copy-code"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant={isEditing ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          data-testid="button-edit-code"
        >
          {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
        </Button>
      </div>

      {isEditing ? (
        <Textarea
          ref={textareaRef}
          value={localCode}
          onChange={(e) => setLocalCode(e.target.value)}
          placeholder="Paste your code here..."
          className="flex-1 font-mono text-sm resize-none min-h-[200px]"
          data-testid="textarea-code"
        />
      ) : (
        <div className="flex-1 overflow-auto rounded-md">
          {localCode ? (
            <SyntaxHighlighter
              style={oneDark}
              language={language}
              showLineNumbers
              customStyle={{
                margin: 0,
                borderRadius: "0.375rem",
                fontSize: "0.75rem",
                height: "100%",
              }}
            >
              {localCode}
            </SyntaxHighlighter>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Click edit to add code
            </div>
          )}
        </div>
      )}
    </div>
  );
}
