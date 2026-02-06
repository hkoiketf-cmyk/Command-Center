import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, X, GripVertical, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";

const CARD_COLORS = [
  { label: "Default", value: "" },
  { label: "Slate", value: "#1e293b" },
  { label: "Zinc", value: "#27272a" },
  { label: "Stone", value: "#292524" },
  { label: "Red", value: "#7f1d1d" },
  { label: "Orange", value: "#7c2d12" },
  { label: "Amber", value: "#78350f" },
  { label: "Green", value: "#14532d" },
  { label: "Teal", value: "#134e4a" },
  { label: "Blue", value: "#1e3a5f" },
  { label: "Indigo", value: "#312e81" },
  { label: "Purple", value: "#3b0764" },
  { label: "Pink", value: "#831843" },
];

interface WidgetWrapperProps {
  title: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onRemove: () => void;
  onTitleChange?: (newTitle: string) => void;
  onCardColorChange?: (color: string) => void;
  cardColor?: string | null;
  children: React.ReactNode;
  className?: string;
}

export function WidgetWrapper({
  title,
  collapsed,
  onToggleCollapse,
  onRemove,
  onTitleChange,
  onCardColorChange,
  cardColor,
  children,
  className,
}: WidgetWrapperProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTitleChange) {
      setIsEditingTitle(true);
    }
  };

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== title && onTitleChange) {
      onTitleChange(editedTitle.trim());
    } else {
      setEditedTitle(title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setEditedTitle(title);
      setIsEditingTitle(false);
    }
  };

  const handleRemove = () => {
    setShowDeleteConfirm(true);
  };

  const confirmRemove = () => {
    setShowDeleteConfirm(false);
    onRemove();
  };

  const cardStyle = cardColor ? { backgroundColor: cardColor, borderColor: `${cardColor}cc` } : {};
  const hasCustomColor = !!cardColor;

  return (
    <>
      <Card
        className={cn("h-full flex flex-col overflow-hidden", className)}
        style={cardStyle}
      >
        <CardHeader className="flex flex-row items-center justify-between gap-2 py-3 px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="cursor-grab active:cursor-grabbing widget-drag-handle p-1 -m-1">
              <GripVertical className={cn("h-4 w-4 shrink-0", hasCustomColor ? "text-white/60" : "text-muted-foreground")} />
            </div>
            {isEditingTitle ? (
              <Input
                ref={inputRef}
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="h-6 text-sm font-medium px-1 py-0 flex-1"
                data-testid="input-widget-title"
              />
            ) : (
              <CardTitle 
                className={cn(
                  "text-sm font-medium truncate",
                  onTitleChange && "cursor-text hover:bg-muted/50 px-1 rounded",
                  hasCustomColor && "text-white"
                )}
                onClick={handleTitleClick}
                onMouseDown={(e) => e.stopPropagation()}
                data-testid="text-widget-title"
              >
                {title}
              </CardTitle>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onCardColorChange && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    data-testid="button-widget-color"
                  >
                    <Palette className={cn("h-4 w-4", hasCustomColor ? "text-white/70" : "")} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="end">
                  <div className="grid grid-cols-4 gap-1.5">
                    {CARD_COLORS.map((c) => (
                      <button
                        key={c.value || "default"}
                        className={cn(
                          "w-8 h-8 rounded-md border-2 transition-all",
                          (cardColor || "") === c.value
                            ? "border-primary ring-1 ring-primary"
                            : "border-transparent hover:border-muted-foreground/30"
                        )}
                        style={{
                          backgroundColor: c.value || "hsl(var(--card))",
                        }}
                        title={c.label}
                        onClick={(e) => {
                          e.stopPropagation();
                          onCardColorChange(c.value);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        data-testid={`button-card-color-${c.label.toLowerCase()}`}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onToggleCollapse}
              data-testid={`button-widget-collapse-${title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {collapsed ? (
                <ChevronDown className={cn("h-4 w-4", hasCustomColor && "text-white/70")} />
              ) : (
                <ChevronUp className={cn("h-4 w-4", hasCustomColor && "text-white/70")} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7", hasCustomColor ? "text-white/60 hover:text-red-400" : "text-muted-foreground hover:text-destructive")}
              onClick={handleRemove}
              data-testid={`button-widget-remove-${title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        {!collapsed && (
          <CardContent className={cn("flex-1 p-4 overflow-auto", hasCustomColor && "text-white/90")}>
            {children}
          </CardContent>
        )}
      </Card>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Widget"
        description={`Are you sure you want to delete "${title}"? This action cannot be undone.`}
        onConfirm={confirmRemove}
        confirmText="Delete"
      />
    </>
  );
}
