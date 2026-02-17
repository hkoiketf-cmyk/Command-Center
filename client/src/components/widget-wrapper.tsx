import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, X, GripVertical, Palette, Pin, MoreVertical, ArrowUp, ArrowDown, GripHorizontal, Info, Copy } from "lucide-react";
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
import type { WidgetType } from "@shared/schema";

const WIDGET_INFO: Record<WidgetType, { description: string; tips: string[] }> = {
  notes: {
    description: "A sticky note for free-form text. Supports formatting like bold, italic, headings, and lists.",
    tips: [
      "Use the formatting toolbar to style your text",
      "Pick a background color to visually categorize notes",
      "Text color adjusts automatically for readability",
    ],
  },
  code: {
    description: "Write and preview HTML/JavaScript code, like a mini embedded app.",
    tips: [
      "Toggle between code editing and live preview",
      "Great for embedding small tools or calculators",
      "HTML, CSS, and JavaScript all work together",
    ],
  },
  priorities: {
    description: "Track your top 3 priorities for a specific business venture.",
    tips: [
      "Select a venture from the dropdown to assign priorities",
      "Limit of 3 forces you to focus on what matters most",
      "Check off priorities as you complete them",
    ],
  },
  revenue: {
    description: "Track customer payments and revenue per month with visual charts.",
    tips: [
      "Select a venture to track its revenue",
      "Add entries with descriptions (invoices, payments, etc.)",
      "Toggle between bar and line chart views",
    ],
  },
  iframe: {
    description: "Embed any external website or tool directly in your dashboard.",
    tips: [
      "Paste any URL to embed it",
      "Works with tools like Notion, Google Docs, Trello, etc.",
      "Some sites may block embedding for security reasons",
    ],
  },
  context_mode: {
    description: "A focus contract for intentional work sessions. Define what you're working on, what to ignore, and when to stop.",
    tips: [
      "Set an objective before diving into deep work",
      "List your top 3 actions to stay focused",
      "Use the ignore list to block distractions",
      "Set a timebox to prevent overworking",
    ],
  },
  quick_capture: {
    description: "A fast inbox for capturing fleeting ideas, tasks, and thoughts before they slip away.",
    tips: [
      "Dump anything into the inbox quickly",
      "Process items later by marking them as done",
      "Use the filter to see unprocessed items only",
    ],
  },
  habit_tracker: {
    description: "Track daily habits with a visual streak grid inspired by GitHub's contribution chart.",
    tips: [
      "Add habits you want to build consistency on",
      "Click cells to mark days as completed",
      "Each habit gets its own color for easy scanning",
      "Watch your streak counter grow over time",
    ],
  },
  daily_journal: {
    description: "A simple daily journal with one entry per day. Navigate between days and write freely.",
    tips: [
      "Use the arrow buttons to move between days",
      "Your entries auto-save as you type",
      "Great for daily reflections or end-of-day reviews",
    ],
  },
  weekly_scorecard: {
    description: "Define measurable activities and track them against weekly targets with trend indicators.",
    tips: [
      "Add metrics like 'Calls Made' or 'Articles Written'",
      "Set a target number for each metric",
      "Enter your actual numbers each week",
      "Arrows show if you're trending up or down vs last week",
    ],
  },
  kpi_dashboard: {
    description: "Track your most important numbers with color-coded progress bars showing how close you are to your targets.",
    tips: [
      "Green means 80%+ of target (on track)",
      "Yellow means 50-80% (needs attention)",
      "Red means below 50% (falling behind)",
      "Click the pencil icon to update current values",
    ],
  },
  waiting_for: {
    description: "Track things you're waiting on from other people, with automatic overdue warnings.",
    tips: [
      "Add an expected date to get overdue alerts",
      "Yellow means past due, red means 7+ days overdue",
      "Mark items complete when you get what you need",
    ],
  },
  crm_pipeline: {
    description: "A mini sales pipeline with 5 stages. Drag deals between columns to track their progress.",
    tips: [
      "Drag and drop deal cards between stages",
      "Yellow border means no contact in 7+ days",
      "Red border means no contact in 14+ days",
      "Pipeline and closed totals show at the top",
    ],
  },
  time_blocks: {
    description: "Plan your day with a visual timeline. Create color-coded blocks for different activities.",
    tips: [
      "Use the arrows to navigate between days",
      "Pick a color for each block to categorize activities",
      "The timeline auto-adjusts to show your scheduled hours",
    ],
  },
  expense_tracker: {
    description: "Track recurring monthly costs and one-off variable expenses. See your total monthly burn rate at a glance.",
    tips: [
      "Add recurring expenses like subscriptions and rent",
      "Log variable expenses as they come up",
      "The burn rate total updates automatically",
    ],
  },
  meeting_prep: {
    description: "Prepare for meetings with structured agendas, then capture notes and action items during or after.",
    tips: [
      "Add talking points before the meeting",
      "Set an objective and desired outcome",
      "Capture notes and action items during the meeting",
      "Mark meetings complete when done",
    ],
  },
  google_calendar: {
    description: "Embed your Google Calendar directly in the dashboard. See your day, week, month, or agenda view.",
    tips: [
      "Go to Google Calendar Settings to get your embed code",
      "Switch between day, week, month, and agenda views",
      "Anyone can connect their own calendar",
      "Click 'Open' to jump to Google Calendar in a new tab",
    ],
  },
  ai_chat: {
    description: "Embed your favorite AI assistant (ChatGPT, Claude, Gemini, etc.) directly into your dashboard.",
    tips: [
      "Pick from popular AI tools or paste any custom URL",
      "Click 'Open' to use the AI tool in a full browser tab",
      "Click 'Change' to switch to a different AI tool anytime",
      "Works with any web-based AI assistant",
    ],
  },
  timer: {
    description: "A customizable timer for focused work sessions, breaks, or tracking elapsed time.",
    tips: [
      "Switch between countdown and count-up (stopwatch) modes",
      "Set custom hours, minutes, and seconds for countdown",
      "Choose from multiple alert sounds and preview them",
      "Mute/unmute the alert sound with the speaker button",
      "Click the gear icon to change timer settings",
    ],
  },
  custom: {
    description: "A custom widget built from HTML/CSS/JavaScript code. Can be created by admins or generated using the AI Widget Builder.",
    tips: [
      "Click the edit button to modify the widget code",
      "Custom widgets run in a sandboxed iframe for security",
      "Use the AI Widget Builder to generate widgets from a description",
    ],
  },
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const c = hex.replace("#", "");
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  };
}

function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function isLightColor(hex: string): boolean {
  if (!hex) return false;
  const { r, g, b } = hexToRgb(hex);
  return getLuminance(r, g, b) > 0.6;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getCardColorOverrides(hex: string): Record<string, string> {
  const { r, g, b } = hexToRgb(hex);
  const { h, s } = rgbToHsl(r, g, b);
  const light = isLightColor(hex);

  if (light) {
    return {
      "--foreground": `${h} ${Math.min(s, 10)}% 10%`,
      "--card-foreground": `${h} ${Math.min(s, 10)}% 10%`,
      "--muted-foreground": `${h} ${Math.min(s, 10)}% 35%`,
      "--muted": `${h} ${Math.min(s, 15)}% 85%`,
      "--border": `${h} ${Math.min(s, 15)}% 75%`,
      "--input": `${h} ${Math.min(s, 15)}% 70%`,
      "--accent": `${h} ${Math.min(s, 15)}% 88%`,
      "--accent-foreground": `${h} ${Math.min(s, 10)}% 10%`,
      "--secondary": `${h} ${Math.min(s, 15)}% 82%`,
      "--secondary-foreground": `${h} ${Math.min(s, 10)}% 10%`,
    };
  } else {
    return {
      "--foreground": "0 0% 95%",
      "--card-foreground": "0 0% 95%",
      "--muted-foreground": "0 0% 65%",
      "--muted": `${h} ${Math.min(s, 20)}% 20%`,
      "--border": `${h} ${Math.min(s, 20)}% 28%`,
      "--input": `${h} ${Math.min(s, 20)}% 25%`,
      "--accent": `${h} ${Math.min(s, 20)}% 22%`,
      "--accent-foreground": "0 0% 95%",
      "--secondary": `${h} ${Math.min(s, 20)}% 25%`,
      "--secondary-foreground": "0 0% 95%",
    };
  }
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
  widgetType?: WidgetType;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onRemove: () => void;
  onTitleChange?: (newTitle: string) => void;
  onCardColorChange?: (color: string) => void;
  cardColor?: string | null;
  pinnedAllDesktops?: boolean;
  onTogglePin?: (pinned: boolean) => void;
  showPinOption?: boolean;
  onDuplicate?: () => void;
  children: React.ReactNode;
  className?: string;
  isMobile?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  mobileHeight?: number | null;
  onMobileHeightChange?: (height: number) => void;
}

export function WidgetWrapper({
  title,
  widgetType,
  collapsed,
  onToggleCollapse,
  onRemove,
  onTitleChange,
  onCardColorChange,
  cardColor,
  pinnedAllDesktops,
  onTogglePin,
  showPinOption,
  onDuplicate,
  children,
  className,
  isMobile,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  mobileHeight,
  onMobileHeightChange,
}: WidgetWrapperProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [isNarrow, setIsNarrow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resizeRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [resizingHeight, setResizingHeight] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const latestResizeHeight = useRef<number>(0);
  const onMobileHeightChangeRef = useRef(onMobileHeightChange);
  onMobileHeightChangeRef.current = onMobileHeightChange;

  const handleResizeStart = useCallback((clientY: number) => {
    if (!cardRef.current) return;
    const currentHeight = cardRef.current.getBoundingClientRect().height;
    resizeRef.current = { startY: clientY, startHeight: currentHeight };
    setResizingHeight(currentHeight);
    latestResizeHeight.current = currentHeight;
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (clientY: number) => {
      if (!resizeRef.current) return;
      const delta = clientY - resizeRef.current.startY;
      const newHeight = Math.max(80, resizeRef.current.startHeight + delta);
      setResizingHeight(newHeight);
      latestResizeHeight.current = newHeight;
    };

    const handleEnd = () => {
      const finalHeight = latestResizeHeight.current;
      setIsResizing(false);
      setResizingHeight(null);
      resizeRef.current = null;
      if (finalHeight > 0 && onMobileHeightChangeRef.current) {
        onMobileHeightChangeRef.current(Math.round(finalHeight));
      }
      latestResizeHeight.current = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientY);
    };
    const onTouchEnd = () => handleEnd();
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const onMouseUp = () => handleEnd();

    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (!cardRef.current || isMobile) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsNarrow(entry.contentRect.width < 280);
      }
    });
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [isMobile]);

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
  const [showCompactColorPicker, setShowCompactColorPicker] = useState(false);
  const [showCompactInfo, setShowCompactInfo] = useState(false);

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

  const hasCustomColor = !!cardColor;
  const colorOverrides = hasCustomColor ? getCardColorOverrides(cardColor!) : {};
  const cardStyle = hasCustomColor
    ? { backgroundColor: cardColor, borderColor: `${cardColor}cc`, ...colorOverrides }
    : {};
  const isLight = hasCustomColor && isLightColor(cardColor!);
  const customTextClass = hasCustomColor ? (isLight ? "text-gray-800/60" : "text-white/60") : "text-muted-foreground";
  const customTextBoldClass = hasCustomColor ? (isLight ? "text-gray-900" : "text-white") : "";
  const customIconClass = hasCustomColor ? (isLight ? "text-gray-700/70" : "text-white/70") : "";

  const displayHeight = resizingHeight ?? mobileHeight ?? undefined;
  const mobileCardStyle = isMobile && displayHeight && !collapsed ? { height: `${displayHeight}px` } : {};

  return (
    <>
      <Card
        ref={cardRef}
        className={cn("flex flex-col overflow-hidden", isMobile ? "" : "h-full", className)}
        style={{ ...cardStyle, ...mobileCardStyle } as React.CSSProperties}
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
          <div className={cn("flex items-center", isMobile ? "gap-1" : "gap-1")}>
            {!isNarrow && widgetType && WIDGET_INFO[widgetType] && (
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={isMobile ? undefined : "h-7 w-7"}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    data-testid="button-widget-info"
                  >
                    <Info className={cn("h-3.5 w-3.5", customIconClass)} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4 touch-manipulation" align="end">
                  <div className="space-y-3">
                    <p className="text-sm leading-relaxed">{WIDGET_INFO[widgetType].description}</p>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Tips</p>
                      <ul className="space-y-1">
                        {WIDGET_INFO[widgetType].tips.map((tip, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-2">
                            <span className="shrink-0 mt-0.5">&#8226;</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {isMobile && onMoveUp && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMoveUp}
                disabled={isFirst}
                className={cn(isFirst && "opacity-30")}
                data-testid="button-widget-move-up"
              >
                <ArrowUp className={cn("h-4 w-4", customIconClass)} />
              </Button>
            )}
            {isMobile && onMoveDown && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMoveDown}
                disabled={isLast}
                className={cn(isLast && "opacity-30")}
                data-testid="button-widget-move-down"
              >
                <ArrowDown className={cn("h-4 w-4", customIconClass)} />
              </Button>
            )}
            {!isNarrow && (showPinOption || onDuplicate) && (
              <DropdownMenu modal={true}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={isMobile ? undefined : "h-7 w-7"}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    data-testid="button-widget-menu"
                  >
                    <MoreVertical className={cn("h-4 w-4", customIconClass)} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="touch-manipulation">
                  {onDuplicate && (
                    <DropdownMenuItem
                      onClick={onDuplicate}
                      data-testid="button-duplicate-widget"
                      className="touch-manipulation"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate widget
                    </DropdownMenuItem>
                  )}
                  {showPinOption && onTogglePin && (
                    <DropdownMenuItem
                      onClick={() => onTogglePin(!pinnedAllDesktops)}
                      data-testid="button-toggle-pin"
                      className="touch-manipulation"
                    >
                      <Pin className={cn("h-4 w-4 mr-2", pinnedAllDesktops && "text-primary")} />
                      {pinnedAllDesktops ? "Unpin from all desktops" : "Pin to all desktops"}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!isNarrow && onCardColorChange && (
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={isMobile ? undefined : "h-7 w-7"}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    data-testid="button-widget-color"
                  >
                    <Palette className={cn("h-4 w-4", customIconClass)} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 touch-manipulation" align="end">
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
            {isNarrow && (
              <DropdownMenu modal={true}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    data-testid="button-widget-compact-menu"
                  >
                    <MoreVertical className={cn("h-4 w-4", customIconClass)} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {widgetType && WIDGET_INFO[widgetType] && (
                    <DropdownMenuItem
                      onClick={() => setShowCompactInfo(true)}
                      data-testid="button-widget-info-compact"
                    >
                      <Info className="h-4 w-4 mr-2" />
                      Widget info
                    </DropdownMenuItem>
                  )}
                  {onCardColorChange && (
                    <DropdownMenuItem
                      onClick={() => setShowCompactColorPicker(true)}
                      data-testid="button-widget-color-compact"
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      Change color
                    </DropdownMenuItem>
                  )}
                  {onDuplicate && (
                    <DropdownMenuItem
                      onClick={onDuplicate}
                      data-testid="button-duplicate-widget-compact"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                  )}
                  {showPinOption && onTogglePin && (
                    <DropdownMenuItem
                      onClick={() => onTogglePin(!pinnedAllDesktops)}
                      data-testid="button-toggle-pin-compact"
                    >
                      <Pin className={cn("h-4 w-4 mr-2", pinnedAllDesktops && "text-primary")} />
                      {pinnedAllDesktops ? "Unpin" : "Pin to all"}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
        {isMobile && !collapsed && onMobileHeightChange && (
          <div
            className={cn(
              "flex items-center justify-center py-1.5 cursor-ns-resize border-t border-border select-none touch-none",
              hasCustomColor ? (isLight ? "text-gray-500" : "text-white/40") : "text-muted-foreground"
            )}
            onTouchStart={(e) => handleResizeStart(e.touches[0].clientY)}
            onMouseDown={(e) => handleResizeStart(e.clientY)}
            data-testid="handle-widget-resize"
          >
            <GripHorizontal className="h-4 w-4" />
          </div>
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

      {showCompactInfo && widgetType && WIDGET_INFO[widgetType] && (
        <AlertDialog open={showCompactInfo} onOpenChange={setShowCompactInfo}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm">{title}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed">{WIDGET_INFO[widgetType].description}</p>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Tips</p>
                    <ul className="space-y-1">
                      {WIDGET_INFO[widgetType].tips.map((tip, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                          <span className="shrink-0 mt-0.5">&#8226;</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-close-compact-info">Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {showCompactColorPicker && onCardColorChange && (
        <AlertDialog open={showCompactColorPicker} onOpenChange={setShowCompactColorPicker}>
          <AlertDialogContent className="max-w-xs">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm">Change Color</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="grid grid-cols-5 gap-1.5 py-2">
              {CARD_COLORS.map((c) => (
                <button
                  key={c.value || "default"}
                  className={cn(
                    "w-8 h-8 rounded-md border-2 transition-all",
                    (cardColor || "") === c.value
                      ? "border-primary ring-1 ring-primary"
                      : "border-transparent hover:border-muted-foreground/30"
                  )}
                  style={{ backgroundColor: c.value || "hsl(var(--card))" }}
                  title={c.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCardColorChange(c.value);
                    setShowCompactColorPicker(false);
                  }}
                  data-testid={`button-card-color-compact-${c.label.toLowerCase()}`}
                />
              ))}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-close-compact-color">Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

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
