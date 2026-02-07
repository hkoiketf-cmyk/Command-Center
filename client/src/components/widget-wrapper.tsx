import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, X, GripVertical, Palette, Pin, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";

function isLightColor(hex: string): boolean {
  if (!hex) return false;
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

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
  { label: "Soft Blue", value: "#bfdbfe" },
  { label: "Soft Green", value: "#bbf7d0" },
  { label: "Soft Pink", value: "#fbcfe8" },
  { label: "Soft Purple", value: "#ddd6fe" },
  { label: "Soft Yellow", value: "#fef08a" },
  { label: "Soft Peach", value: "#fed7aa" },
  { label: "Soft Mint", value: "#a7f3d0" },
  { label: "Soft Lavender", value: "#c4b5fd" },
  { label: "Soft Rose", value: "#fecdd3" },
  { label: "Soft Sky", value: "#bae6fd" },
  { label: "Soft Coral", value: "#fda4af" },
  { label: "Soft Lime", value: "#d9f99d" },
];

interface WidgetWrapperProps {
  title: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onRemove: () => void;
  onTitleChange?: (newTitle: string) => void;
  onCardColorChange?: (color: string) => void;
  cardColor?: string | null;
  pinnedAllDesktops?: boolean;
  onTogglePin?: (pinned: boolean) => void;
  showPinOption?: boolean;
  children: React.ReactNode;
  className?: string;
  isMobile?: boolean;
}

export function WidgetWrapper({
  title,
  collapsed,
  onToggleCollapse,
  onRemove,
  onTitleChange,
  onCardColorChange,
  cardColor,
  pinnedAllDesktops,
  onTogglePin,
  showPinOption,
  children,
  className,
  isMobile,
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

  const [showPinnedDeletePrompt, setShowPinnedDeletePrompt] = useState(false);

  const handleRemove = () => {
    if (pinnedAllDesktops && onTogglePin) {
      setShowPinnedDeletePrompt(true);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const confirmRemove = () => {
    setShowDeleteConfirm(false);
    onRemove();
  };

  const cardStyle = cardColor ? { backgroundColor: cardColor, borderColor: `${cardColor}cc` } : {};
  const hasCustomColor = !!cardColor;
  const isLight = hasCustomColor && isLightColor(cardColor!);
  const customTextClass = hasCustomColor ? (isLight ? "text-gray-800/60" : "text-white/60") : "text-muted-foreground";
  const customTextBoldClass = hasCustomColor ? (isLight ? "text-gray-900" : "text-white") : "";
  const customIconClass = hasCustomColor ? (isLight ? "text-gray-700/70" : "text-white/70") : "";

  return (
    <>
      <Card
        className={cn("h-full flex flex-col overflow-hidden", className)}
        style={cardStyle}
      >
        <CardHeader className={cn("flex flex-row items-center justify-between gap-2 border-b border-border shrink-0", isMobile ? "py-3 px-3" : "py-3 px-4")}>
          <div className={cn("flex items-center flex-1 min-w-0", isMobile ? "gap-2" : "gap-2")}>
            {!isMobile && (
              <div className="cursor-grab active:cursor-grabbing widget-drag-handle p-1 -m-1">
                <GripVertical className={cn("h-4 w-4 shrink-0", customTextClass)} />
              </div>
            )}
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
                  customTextBoldClass
                )}
                onClick={handleTitleClick}
                onMouseDown={(e) => e.stopPropagation()}
                data-testid="text-widget-title"
              >
                {title}
              </CardTitle>
            )}
          </div>
          <div className={cn("flex items-center", isMobile ? "gap-1.5" : "gap-1")}>
            {showPinOption && onTogglePin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={isMobile ? undefined : "h-7 w-7"}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    data-testid="button-widget-menu"
                  >
                    <MoreVertical className={cn("h-4 w-4", customIconClass)} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onTogglePin(!pinnedAllDesktops)}
                    data-testid="button-toggle-pin"
                  >
                    <Pin className={cn("h-4 w-4 mr-2", pinnedAllDesktops && "text-primary")} />
                    {pinnedAllDesktops ? "Unpin from all desktops" : "Pin to all desktops"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {onCardColorChange && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={isMobile ? undefined : "h-7 w-7"}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    data-testid="button-widget-color"
                  >
                    <Palette className={cn("h-4 w-4", customIconClass)} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="grid grid-cols-5 gap-1.5">
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
              className={isMobile ? undefined : "h-7 w-7"}
              onClick={onToggleCollapse}
              data-testid={`button-widget-collapse-${title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {collapsed ? (
                <ChevronDown className={cn("h-4 w-4", customIconClass)} />
              ) : (
                <ChevronUp className={cn("h-4 w-4", customIconClass)} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(isMobile ? undefined : "h-7 w-7", hasCustomColor ? "text-white/60 hover:text-red-400" : "text-muted-foreground hover:text-destructive")}
              onClick={handleRemove}
              data-testid={`button-widget-remove-${title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        {!collapsed && (
          <CardContent className={cn("flex-1 p-4 overflow-auto", hasCustomColor && (isLight ? "text-gray-800" : "text-white/90"))}>
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

      {showPinnedDeletePrompt && (
        <AlertDialog open={showPinnedDeletePrompt} onOpenChange={setShowPinnedDeletePrompt}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Pinned Widget</AlertDialogTitle>
              <AlertDialogDescription>
                This widget is pinned to all desktops. What would you like to do?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel data-testid="button-pinned-cancel">Cancel</AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPinnedDeletePrompt(false);
                  onTogglePin?.(false);
                }}
                data-testid="button-pinned-unpin"
              >
                Unpin only
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowPinnedDeletePrompt(false);
                  onRemove();
                }}
                data-testid="button-pinned-remove-all"
              >
                Remove everywhere
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
