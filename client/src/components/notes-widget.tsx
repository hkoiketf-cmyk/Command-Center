import { useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette, Bold, Italic, Heading1, Heading2, List, ListOrdered, Minus } from "lucide-react";
import type { NotesContent } from "@shared/schema";

interface NotesWidgetProps {
  content: NotesContent;
  onContentChange: (content: NotesContent) => void;
}

const NOTE_COLORS = [
  { name: "Default", value: "", textColor: "" },
  { name: "Yellow", value: "#FEF3C7", textColor: "#713F12" },
  { name: "Green", value: "#D1FAE5", textColor: "#14532D" },
  { name: "Blue", value: "#DBEAFE", textColor: "#1E3A5F" },
  { name: "Pink", value: "#FCE7F3", textColor: "#831843" },
  { name: "Purple", value: "#EDE9FE", textColor: "#4C1D95" },
  { name: "Orange", value: "#FFEDD5", textColor: "#7C2D12" },
  { name: "Red", value: "#FEE2E2", textColor: "#7F1D1D" },
  { name: "Teal", value: "#CCFBF1", textColor: "#134E4A" },
];

function getTextColorForBackground(bgColor: string): string {
  const color = NOTE_COLORS.find(c => c.value === bgColor);
  return color?.textColor || "";
}

export function NotesWidget({ content, onContentChange }: NotesWidgetProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const backgroundColor = content?.backgroundColor || "";
  const textColor = getTextColorForBackground(backgroundColor);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = content?.markdown || "";
      isInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (editorRef.current && content?.markdown !== undefined) {
      const currentHtml = editorRef.current.innerHTML;
      if (currentHtml !== content.markdown && !document.activeElement?.isSameNode(editorRef.current)) {
        editorRef.current.innerHTML = content.markdown;
      }
    }
  }, [content?.markdown]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onContentChange({ markdown: html, backgroundColor });
    }
  }, [onContentChange, backgroundColor]);

  const handleColorChange = (color: string) => {
    onContentChange({ markdown: content?.markdown || "", backgroundColor: color });
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const formatHeading = (tag: string) => {
    document.execCommand("formatBlock", false, tag);
    editorRef.current?.focus();
    handleInput();
  };

  const containerStyle = {
    ...(backgroundColor ? { backgroundColor } : {}),
    ...(textColor ? { color: textColor } : {}),
  };

  return (
    <div className="h-full flex flex-col rounded-md" style={containerStyle}>
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => execCommand("bold")}
          title="Bold"
          data-testid="button-format-bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => execCommand("italic")}
          title="Italic"
          data-testid="button-format-italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => formatHeading("h1")}
          title="Heading 1"
          data-testid="button-format-h1"
        >
          <Heading1 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => formatHeading("h2")}
          title="Heading 2"
          data-testid="button-format-h2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => execCommand("insertUnorderedList")}
          title="Bullet List"
          data-testid="button-format-ul"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => execCommand("insertOrderedList")}
          title="Numbered List"
          data-testid="button-format-ol"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => execCommand("insertHorizontalRule")}
          title="Divider"
          data-testid="button-format-hr"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <div className="flex-1" />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              data-testid="button-note-color"
            >
              <Palette className="h-3.5 w-3.5" />
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

      <div
        ref={editorRef}
        contentEditable
        className="flex-1 overflow-auto p-2 rounded-md border border-current/20 focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[150px] prose prose-sm dark:prose-invert max-w-none"
        style={{ color: textColor || "inherit" }}
        onInput={handleInput}
        onBlur={handleInput}
        data-testid="editor-notes"
        suppressContentEditableWarning
      />
    </div>
  );
}
