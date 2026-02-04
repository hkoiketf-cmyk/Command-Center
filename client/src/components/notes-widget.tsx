import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { NotesContent } from "@shared/schema";

interface NotesWidgetProps {
  content: NotesContent;
  onContentChange: (content: NotesContent) => void;
}

export function NotesWidget({ content, onContentChange }: NotesWidgetProps) {
  const [markdown, setMarkdown] = useState(content?.markdown || "");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    setMarkdown(content?.markdown || "");
  }, [content?.markdown]);

  const handleChange = (value: string) => {
    setMarkdown(value);
    onContentChange({ markdown: value });
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "edit" | "preview")}
        className="flex-1 flex flex-col"
      >
        <TabsList className="w-full justify-start h-9 mb-3">
          <TabsTrigger value="edit" className="text-xs" data-testid="tab-notes-edit">
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-xs" data-testid="tab-notes-preview">
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="flex-1 mt-0">
          <Textarea
            value={markdown}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Write your notes in Markdown..."
            className="h-full min-h-[200px] font-mono text-sm resize-none"
            data-testid="textarea-notes"
          />
        </TabsContent>

        <TabsContent value="preview" className="flex-1 mt-0 overflow-auto">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match && !className;
                  return isInline ? (
                    <code
                      className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match?.[1] || "text"}
                      PreTag="div"
                      className="rounded-md text-sm"
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
  );
}
