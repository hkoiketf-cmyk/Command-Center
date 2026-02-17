import { useRef, useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette, Bold, Italic, Heading1, Heading2, List, ListOrdered, Minus, Link2, Type } from "lucide-react";
import type { NotesContent } from "@shared/schema";

interface NotesWidgetProps {
  content: NotesContent;
  onContentChange: (content: NotesContent) => void;
}

const TEXT_COLORS = [
  { name: "Default", value: "" },
  { name: "White", value: "#FFFFFF" },
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Lime", value: "#84CC16" },
  { name: "Green", value: "#22C55E" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Purple", value: "#A855F7" },
  { name: "Pink", value: "#EC4899" },
  { name: "Rose", value: "#F43F5E" },
];

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
  { name: "Lavender", value: "#E8E0F0", textColor: "#4A3560" },
  { name: "Mint", value: "#C6F6D5", textColor: "#22543D" },
  { name: "Peach", value: "#FFF1E6", textColor: "#7C4A1E" },
  { name: "Sky", value: "#BAE6FD", textColor: "#0C4A6E" },
  { name: "Rose", value: "#FFE4E6", textColor: "#881337" },
  { name: "Cream", value: "#FAF5EF", textColor: "#57534E" },
  { name: "Coral", value: "#FECDD3", textColor: "#9F1239" },
  { name: "Lime", value: "#D9F99D", textColor: "#365314" },
  { name: "Lilac", value: "#DDD6FE", textColor: "#5B21B6" },
];

function getTextColorForBackground(bgColor: string): string {
  const color = NOTE_COLORS.find(c => c.value === bgColor);
  return color?.textColor || "";
}

function LinkInsertPopover({ onInsertLink }: { onInsertLink: (url: string, text: string) => void }) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [open, setOpen] = useState(false);

  const handleInsert = () => {
    let url = linkUrl.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    onInsertLink(url, linkText.trim());
    setLinkUrl("");
    setLinkText("");
    setOpen(false);
  };

  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Insert Link"
          data-testid="button-format-link"
        >
          <Link2 className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-2" align="start">
        <p className="text-xs font-medium">Insert Link</p>
        <Input
          placeholder="Display text (optional)"
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
          className="text-xs"
          data-testid="input-link-text"
        />
        <Input
          placeholder="https://example.com"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          className="text-xs"
          onKeyDown={(e) => { if (e.key === "Enter") handleInsert(); }}
          data-testid="input-link-url"
        />
        <Button
          size="sm"
          className="w-full"
          onClick={handleInsert}
          disabled={!linkUrl.trim()}
          data-testid="button-insert-link"
        >
          Insert
        </Button>
      </PopoverContent>
    </Popover>
  );
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
    const currentContent = editorRef.current?.innerHTML || content?.markdown || "";
    onContentChange({ markdown: currentContent, backgroundColor: color });
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
        <LinkInsertPopover
          onInsertLink={(url, text) => {
            if (editorRef.current) {
              const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; cursor: pointer;">${text || url}</a>&nbsp;`;
              editorRef.current.innerHTML += linkHtml;
              handleInput();
              setTimeout(() => {
                if (editorRef.current) {
                  editorRef.current.focus();
                  const selection = window.getSelection();
                  if (selection) {
                    const range = document.createRange();
                    range.selectNodeContents(editorRef.current);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                  }
                }
              }, 0);
            }
          }}
        />
        <Popover modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              title="Text Color"
              data-testid="button-text-color"
            >
              <Type className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2 touch-manipulation" align="end">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Text Color</p>
            <div className="grid grid-cols-4 gap-1">
              {TEXT_COLORS.map((tc) => (
                <button
                  key={tc.name}
                  onClick={() => {
                    if (tc.value) {
                      execCommand("foreColor", tc.value);
                    } else {
                      const selection = window.getSelection();
                      if (selection && selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        const container = range.commonAncestorContainer;
                        const root = editorRef.current;
                        if (root && root.contains(container)) {
                          const walker = document.createTreeWalker(
                            range.cloneContents(),
                            NodeFilter.SHOW_ELEMENT,
                          );
                          const removeColor = (el: Element) => {
                            if (el instanceof HTMLElement) {
                              el.style.removeProperty("color");
                              if (!el.style.length && el.getAttribute("style") === "") {
                                el.removeAttribute("style");
                              }
                            }
                            if (el.tagName === "FONT" && el.hasAttribute("color")) {
                              el.removeAttribute("color");
                            }
                          };
                          let node = walker.nextNode();
                          while (node) {
                            removeColor(node as Element);
                            node = walker.nextNode();
                          }
                          const selectedNodes: Element[] = [];
                          const liveWalker = document.createTreeWalker(
                            root,
                            NodeFilter.SHOW_ELEMENT,
                          );
                          let liveNode = liveWalker.nextNode();
                          while (liveNode) {
                            if (selection.containsNode(liveNode, true)) {
                              selectedNodes.push(liveNode as Element);
                            }
                            liveNode = liveWalker.nextNode();
                          }
                          selectedNodes.forEach(removeColor);
                          handleInput();
                        }
                      }
                    }
                  }}
                  className="h-7 rounded-md border border-border flex items-center justify-center hover-elevate"
                  style={{ backgroundColor: tc.value || "var(--background)" }}
                  title={tc.name}
                  data-testid={`button-text-color-${tc.name.toLowerCase()}`}
                >
                  {tc.name === "Default" && (
                    <span className="text-[10px] text-muted-foreground">A</span>
                  )}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex-1" />
        <Popover modal={true}>
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
          <PopoverContent className="w-56 p-2 touch-manipulation" align="end">
            <div className="grid grid-cols-4 gap-1">
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
