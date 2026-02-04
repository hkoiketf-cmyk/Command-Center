import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";

interface WidgetWrapperProps {
  title: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onRemove: () => void;
  onTitleChange?: (newTitle: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function WidgetWrapper({
  title,
  collapsed,
  onToggleCollapse,
  onRemove,
  onTitleChange,
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

  return (
    <>
      <Card className={cn("h-full flex flex-col overflow-hidden", className)}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 py-3 px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="cursor-grab active:cursor-grabbing widget-drag-handle p-1 -m-1">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
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
                  onTitleChange && "cursor-text hover:bg-muted/50 px-1 rounded"
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
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onToggleCollapse}
              data-testid={`button-widget-collapse-${title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {collapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
              data-testid={`button-widget-remove-${title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        {!collapsed && (
          <CardContent className="flex-1 p-4 overflow-auto">
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
