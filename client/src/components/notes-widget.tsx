import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { NotesContent } from "@shared/schema";

interface NotesWidgetProps {
  content: NotesContent;
  onContentChange: (content: NotesContent) => void;
}

const NOTE_COLORS = [
  { name: "Default", value: "" },
  { name: "Yellow", value: "#FEF3C7" },
  { name: "Green", value: "#D1FAE5" },
  { name: "Blue", value: "#DBEAFE" },
  { name: "Pink", value: "#FCE7F3" },
  { name: "Purple", value: "#EDE9FE" },
  { name: "Orange", value: "#FFEDD5" },
  { name: "Red", value: "#FEE2E2" },
  { name: "Teal", value: "#CCFBF1" },
];

export function NotesWidget({ content, onContentChange }: NotesWidgetProps) {
  const [markdown, setMarkdown] = useState(content?.markdown || "");
  const [backgroundColor, setBackgroundColor] = useState(content?.backgroundColor || "");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    setMarkdown(content?.markdown || "");
    setBackgroundColor(content?.backgroundColor || "");
  }, [content?.markdown, content?.backgroundColor]);

  const handleChange = (value: string) => {
    setMarkdown(value);
    onContentChange({ markdown: value, backgroundColor });
  };

  const handleColorChange = (color: string) => {
    setBackgroundColor(color);
    onContentChange({ markdown, backgroundColor: color });
  };

  const bgStyle = backgroundColor ? { backgroundColor } : {};

  return (
    <div className="h-full flex flex-col rounded-md" style={bgStyle}>
      <div className="flex items-center justify-between mb-2">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "edit" | "preview")}
          className="flex-1"
        >
          <div className="flex items-center justify-between gap-2">
            <TabsList className="h-8">
              <TabsTrigger value="edit" className="text-xs px-3" data-testid="tab-notes-edit">
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs px-3" data-testid="tab-notes-preview">
                Preview
              </TabsTrigger>
            </TabsList>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  data-testid="button-note-color"
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <div className="grid grid-cols-3 gap-1">
                  {NOTE_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => handleColorChange(color.value)}
                      className={`h-8 rounded-md border-2 transition-all ${
                        backgroundColor === color.value 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/50"
                      }`}
                      style={{ 
                        backgroundColor: color.value || "var(--background)",
                      }}
                      title={color.name}
                      data-testid={`button-color-${color.name.toLowerCase()}`}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <TabsContent value="edit" className="flex-1 mt-2">
            <Textarea
              value={markdown}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Write notes in Markdown...&#10;&#10;Tip: Use ```html for HTML code blocks&#10;Use ```javascript for JS code blocks"
              className="h-full min-h-[180px] font-mono text-sm resize-none bg-transparent"
              data-testid="textarea-notes"
            />
          </TabsContent>

          <TabsContent value="preview" className="flex-1 mt-2 overflow-auto">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const language = match?.[1] || "";
                    const isInline = !match && !className;
                    
                    if (isInline) {
                      return (
                        <code
                          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    
                    return (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={language || "text"}
                        PreTag="div"
                        className="rounded-md text-sm"
                        showLineNumbers={language !== ""}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    );
                  },
                }}
              >
                {markdown || "*No content yet...*"}
              </ReactMarkdown>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
