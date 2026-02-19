import { useCallback, useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Zap, Plus, Monitor, Trash2, Pencil, Check, X as XIcon, Settings, Menu, Palette, Moon, Sun, LogOut, User, CreditCard, KeyRound, Library, Crosshair, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { AdminCodesDialog } from "@/components/admin-codes-dialog";
import { AdminAnnouncementsDialog } from "@/components/admin-announcements";
import { AdminWidgetTemplates } from "@/components/admin-widget-templates";
import { NotificationsBell } from "@/components/notifications-bell";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WidgetWrapper } from "@/components/widget-wrapper";
import { NotesWidget } from "@/components/notes-widget";
import { PrioritiesWidget } from "@/components/priorities-widget";
import { RevenueWidget } from "@/components/revenue-widget";
import { IframeWidget } from "@/components/iframe-widget";
import { CodeWidget } from "@/components/code-widget";
import { ContextModeWidget } from "@/components/context-mode-widget";
import { QuickCaptureWidget } from "@/components/quick-capture-widget";
import { HabitTrackerWidget } from "@/components/habit-tracker-widget";
import { DailyJournalWidget } from "@/components/daily-journal-widget";
import { WeeklyScorecardWidget } from "@/components/weekly-scorecard-widget";
import { KpiDashboardWidget } from "@/components/kpi-dashboard-widget";
import { WaitingForWidget } from "@/components/waiting-for-widget";
import { CrmPipelineWidget } from "@/components/crm-pipeline-widget";
import { TimeBlocksWidget } from "@/components/time-blocks-widget";
import { ExpenseTrackerWidget } from "@/components/expense-tracker-widget";
import { MeetingPrepWidget } from "@/components/meeting-prep-widget";
import { AiChatWidget } from "@/components/ai-chat-widget";
import { TimerWidget } from "@/components/timer-widget";
import { CustomWidget } from "@/components/custom-widget";
import { AdBoardWidget } from "@/components/ad-board-widget";
import { HunterAI } from "@/components/hunter-ai";
import { AddWidgetDialog } from "@/components/add-widget-dialog";
import { PresetLibrary } from "@/components/preset-library";
import { VentureManager } from "@/components/venture-manager";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Widget, WidgetType, LayoutItem, NotesContent, PrioritiesContent, RevenueContent, IframeContent, CodeContent, AiChatContent, TimerContent, CustomWidgetContent, AdBoardContent, Desktop, FocusContract, AppSettings, ExitGuardMode } from "@shared/schema";

type GridLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  isResizable?: boolean;
};

const ROW_HEIGHT = 50;

const defaultWidgetSizes: Record<WidgetType, { w: number; h: number; minW: number; minH: number }> = {
  notes: { w: 4, h: 6, minW: 1, minH: 3 },
  priorities: { w: 4, h: 6, minW: 1, minH: 4 },
  revenue: { w: 6, h: 7, minW: 2, minH: 4 },
  iframe: { w: 6, h: 8, minW: 1, minH: 3 },
  code: { w: 6, h: 8, minW: 2, minH: 4 },
  context_mode: { w: 5, h: 10, minW: 3, minH: 6 },
  quick_capture: { w: 3, h: 6, minW: 2, minH: 4 },
  habit_tracker: { w: 6, h: 7, minW: 3, minH: 4 },
  daily_journal: { w: 4, h: 8, minW: 2, minH: 4 },
  weekly_scorecard: { w: 6, h: 7, minW: 3, minH: 4 },
  kpi_dashboard: { w: 4, h: 6, minW: 2, minH: 3 },
  waiting_for: { w: 4, h: 6, minW: 2, minH: 4 },
  crm_pipeline: { w: 12, h: 8, minW: 6, minH: 5 },
  time_blocks: { w: 4, h: 10, minW: 2, minH: 6 },
  expense_tracker: { w: 4, h: 7, minW: 2, minH: 4 },
  meeting_prep: { w: 5, h: 8, minW: 3, minH: 5 },
  google_calendar: { w: 6, h: 8, minW: 3, minH: 5 },
  ai_chat: { w: 4, h: 8, minW: 2, minH: 5 },
  timer: { w: 3, h: 6, minW: 2, minH: 4 },
  custom: { w: 4, h: 6, minW: 2, minH: 3 },
  ad_board: { w: 6, h: 8, minW: 3, minH: 4 },
};

const BG_COLORS = [
  { label: "Default Dark", value: "#09090b" },
  { label: "Charcoal", value: "#1a1a2e" },
  { label: "Navy", value: "#0d1b2a" },
  { label: "Deep Purple", value: "#1a0a2e" },
  { label: "Forest", value: "#0a1a0a" },
  { label: "Midnight", value: "#0f0f23" },
  { label: "Warm Dark", value: "#1c1917" },
  { label: "Slate", value: "#0f172a" },
  { label: "Neutral", value: "#171717" },
  { label: "Deep Red", value: "#1a0a0a" },
  { label: "Ocean", value: "#0a192f" },
  { label: "Dark Teal", value: "#0d2b2b" },
  { label: "Pastel Blue", value: "#dbeafe" },
  { label: "Pastel Green", value: "#dcfce7" },
  { label: "Pastel Pink", value: "#fce7f3" },
  { label: "Pastel Purple", value: "#ede9fe" },
  { label: "Pastel Yellow", value: "#fef9c3" },
  { label: "Pastel Peach", value: "#fff1e6" },
  { label: "Pastel Mint", value: "#d1fae5" },
  { label: "Pastel Lavender", value: "#e8e0f0" },
  { label: "Soft Gray", value: "#e5e7eb" },
  { label: "Warm Cream", value: "#faf5ef" },
  { label: "Soft Rose", value: "#ffe4e6" },
  { label: "Light", value: "#f8fafc" },
];

export default function Dashboard() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isMobile, setIsMobile] = useState(false);
  const [activeDesktopId, setActiveDesktopId] = useState<string | null>(null);
  const [editingDesktopId, setEditingDesktopId] = useState<string | null>(null);
  const [editingDesktopName, setEditingDesktopName] = useState("");
  const [deleteDesktopId, setDeleteDesktopId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [showContextModal, setShowContextModal] = useState(false);
  const [pendingDesktopId, setPendingDesktopId] = useState<string | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [exitReason, setExitReason] = useState("");
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showPresetLibrary, setShowPresetLibrary] = useState(false);
  const [showHunterAI, setShowHunterAI] = useState(false);
  const [editingAppName, setEditingAppName] = useState(false);
  const [appNameValue, setAppNameValue] = useState("");
  const appNameInputRef = useRef<HTMLInputElement>(null);

  const { data: userSettings } = useQuery<{ id: string; userId: string; appName: string; isAdmin?: boolean }>({
    queryKey: ["/api/user-settings"],
  });

  const updateUserSettings = useMutation({
    mutationFn: async (updates: { appName: string }) => {
      const res = await apiRequest("PATCH", "/api/user-settings", updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-settings"] });
    },
  });

  const appName = userSettings?.appName || "MallenniumDash";

  const { data: desktopList = [], isLoading: desktopsLoading } = useQuery<Desktop[]>({
    queryKey: ["/api/desktops"],
  });

  const { data: appSettingsData } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });

  const todayDate = new Date().toISOString().split("T")[0];

  const { data: currentContract } = useQuery<FocusContract | null>({
    queryKey: ["/api/focus-contracts", activeDesktopId, todayDate],
    queryFn: async () => {
      if (!activeDesktopId) return null;
      const res = await fetch(`/api/focus-contracts?desktopId=${activeDesktopId}&date=${todayDate}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!activeDesktopId,
  });

  const { data: pendingContract } = useQuery<FocusContract | null>({
    queryKey: ["/api/focus-contracts", pendingDesktopId, todayDate],
    queryFn: async () => {
      if (!pendingDesktopId) return null;
      const res = await fetch(`/api/focus-contracts?desktopId=${pendingDesktopId}&date=${todayDate}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!pendingDesktopId,
  });

  const { data: pinnedWidgets = [] } = useQuery<Widget[]>({
    queryKey: ["/api/widgets/pinned"],
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<AppSettings>) => {
      return apiRequest("PATCH", "/api/settings", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });

  useEffect(() => {
    if (desktopList.length > 0 && !activeDesktopId) {
      setActiveDesktopId(desktopList[0].id);
    }
    if (activeDesktopId && desktopList.length > 0 && !desktopList.find(d => d.id === activeDesktopId)) {
      setActiveDesktopId(desktopList[0].id);
    }
  }, [desktopList, activeDesktopId]);

  const activeDesktop = desktopList.find(d => d.id === activeDesktopId);

  const { data: desktopWidgets = [], isLoading: widgetsLoading } = useQuery<Widget[]>({
    queryKey: ["/api/widgets", activeDesktopId],
    queryFn: async () => {
      if (!activeDesktopId) return [];
      const res = await fetch(`/api/widgets?desktopId=${activeDesktopId}`);
      if (!res.ok) throw new Error("Failed to fetch widgets");
      return res.json();
    },
    enabled: !!activeDesktopId,
  });

  const widgets = [
    ...desktopWidgets,
    ...pinnedWidgets.filter(pw => pw.desktopId !== activeDesktopId && !desktopWidgets.some(dw => dw.id === pw.id)),
  ];

  const hasContextModeWidget = widgets.some(w => w.type === "context_mode");

  const handleDesktopSwitch = useCallback(async (targetDesktopId: string) => {
    if (targetDesktopId === activeDesktopId) return;

    const exitGuardMode = appSettingsData?.exitGuardMode || "soft_warn";
    const showModal = appSettingsData?.showContextModal !== false;

    if (hasContextModeWidget && exitGuardMode !== "off" && currentContract) {
      const top3 = (currentContract.top3 as { text: string; done: boolean }[]) || [];
      const hasIncomplete = top3.some(item => item.text && !item.done);
      if (hasIncomplete) {
        setPendingDesktopId(targetDesktopId);
        setShowExitWarning(true);
        setExitReason("");
        return;
      }
    }

    const targetHasPinnedContextMode = pinnedWidgets.some(w => w.type === "context_mode");

    let targetHasOwnContextMode = false;
    if (!targetHasPinnedContextMode) {
      try {
        const res = await fetch(`/api/widgets?desktopId=${targetDesktopId}`);
        if (res.ok) {
          const targetWidgets: Widget[] = await res.json();
          targetHasOwnContextMode = targetWidgets.some(w => w.type === "context_mode");
        }
      } catch {}
    }

    if (showModal && (targetHasPinnedContextMode || targetHasOwnContextMode)) {
      setPendingDesktopId(targetDesktopId);
      setShowContextModal(true);
    } else {
      setActiveDesktopId(targetDesktopId);
    }
  }, [activeDesktopId, appSettingsData, hasContextModeWidget, currentContract, pinnedWidgets]);

  const confirmDesktopSwitch = () => {
    if (pendingDesktopId) {
      setActiveDesktopId(pendingDesktopId);
    }
    setShowContextModal(false);
    setShowExitWarning(false);
    setPendingDesktopId(null);
    setExitReason("");
  };

  const isLoading = desktopsLoading || widgetsLoading;

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (editingDesktopId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingDesktopId]);

  const gridCols = isMobile ? 1 : 12;

  // Desktop mutations
  const createDesktop = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/desktops", {
        name: `Desktop ${desktopList.length + 1}`,
        backgroundColor: "#09090b",
        order: desktopList.length,
      });
    },
    onSuccess: async (res) => {
      const newDesktop = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/desktops"] });
      setActiveDesktopId(newDesktop.id);
      toast({ title: "Desktop created" });
    },
  });

  const updateDesktop = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Desktop> }) => {
      return apiRequest("PATCH", `/api/desktops/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/desktops"] });
    },
  });

  const removeDesktop = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/desktops/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/desktops"] });
      queryClient.removeQueries({ queryKey: ["/api/widgets", deletedId] });
      toast({ title: "Desktop deleted" });
    },
  });

  const reorderDesktops = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      return apiRequest("PUT", "/api/desktops/reorder", { orderedIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/desktops"] });
    },
  });

  const moveDesktop = (desktopId: string, direction: -1 | 1) => {
    const idx = desktopList.findIndex(d => d.id === desktopId);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= desktopList.length) return;
    const newOrder = desktopList.map(d => d.id);
    [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
    reorderDesktops.mutate(newOrder);
  };

  // Widget mutations
  const addWidget = useMutation({
    mutationFn: async (data: { type: WidgetType; title: string; content?: Record<string, unknown> }) => {
      if (!activeDesktopId) throw new Error("No active desktop. Please create a dashboard first.");
      const nextY = widgets.length > 0 
        ? Math.max(...widgets.map(w => ((w.layout as LayoutItem)?.y || 0) + ((w.layout as LayoutItem)?.h || 4)))
        : 0;
      
      const size = defaultWidgetSizes[data.type];
      const layout: LayoutItem = {
        i: crypto.randomUUID(),
        x: 0,
        y: nextY,
        ...size,
      };

      return apiRequest("POST", "/api/widgets", {
        type: data.type,
        title: data.title,
        content: data.content || {},
        collapsed: false,
        layout,
        desktopId: activeDesktopId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/widgets", activeDesktopId] });
      toast({ title: "Widget added" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add widget", description: error.message, variant: "destructive" });
    },
  });

  const updateWidget = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Widget> }) => {
      return apiRequest("PATCH", `/api/widgets/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/widgets", activeDesktopId] });
    },
  });

  const deleteWidget = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/widgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/widgets", activeDesktopId] });
      toast({ title: "Widget removed" });
    },
  });

  const duplicateWidget = useMutation({
    mutationFn: async (widget: Widget) => {
      if (!activeDesktopId) throw new Error("No active desktop");
      const nextY = widgets.length > 0
        ? Math.max(...widgets.map(w => ((w.layout as LayoutItem)?.y || 0) + ((w.layout as LayoutItem)?.h || 4)))
        : 0;
      const oldLayout = widget.layout as LayoutItem;
      const layout: LayoutItem = {
        i: crypto.randomUUID(),
        x: 0,
        y: nextY,
        w: oldLayout?.w || 4,
        h: oldLayout?.h || 4,
        minW: oldLayout?.minW || 1,
        minH: oldLayout?.minH || 3,
      };
      return apiRequest("POST", "/api/widgets", {
        type: widget.type,
        title: `${widget.title} (copy)`,
        content: widget.content || {},
        collapsed: false,
        layout,
        desktopId: activeDesktopId,
        cardColor: widget.cardColor || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/widgets", activeDesktopId] });
      toast({ title: "Widget duplicated" });
    },
  });

  const updateWidgetLayout = useMutation({
    mutationFn: async (updates: { id: string; layout: LayoutItem }[]) => {
      await Promise.all(
        updates.map(({ id, layout }) =>
          apiRequest("PATCH", `/api/widgets/${id}`, { layout })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/widgets", activeDesktopId] });
    },
  });

  const handleLayoutChange = useCallback(
    (newLayout: GridLayoutItem[]) => {
      const updates = newLayout.map((l) => {
        const widget = widgets.find(w => w.id === l.i);
        const size = widget ? defaultWidgetSizes[widget.type as WidgetType] : defaultWidgetSizes.notes;
        const isCollapsed = widget?.collapsed ?? false;
        const clampedH = isCollapsed ? l.h : Math.max(l.h, size.minH);
        return {
          id: l.i,
          layout: {
            i: l.i,
            x: l.x,
            y: l.y,
            w: l.w,
            h: clampedH,
            minW: size.minW,
            minH: size.minH,
          },
        };
      });
      updateWidgetLayout.mutate(updates);
    },
    [updateWidgetLayout, widgets]
  );

  const handleToggleCollapse = (widget: Widget) => {
    const newCollapsed = !widget.collapsed;
    queryClient.setQueryData(
      ["/api/widgets", activeDesktopId],
      (old: Widget[] | undefined) =>
        old?.map(w => w.id === widget.id ? { ...w, collapsed: newCollapsed } : w)
    );
    updateWidget.mutate({
      id: widget.id,
      updates: { collapsed: newCollapsed },
    });
  };

  const handleContentChange = (widget: Widget, content: any) => {
    updateWidget.mutate({
      id: widget.id,
      updates: { content },
    });
  };

  const handleTitleChange = (widget: Widget, newTitle: string) => {
    updateWidget.mutate({
      id: widget.id,
      updates: { title: newTitle },
    });
  };

  const handleCardColorChange = (widget: Widget, color: string) => {
    updateWidget.mutate({
      id: widget.id,
      updates: { cardColor: color || null },
    });
  };

  const handlePinToggle = (widget: Widget, pinned: boolean) => {
    updateWidget.mutate(
      {
        id: widget.id,
        updates: { pinnedAllDesktops: pinned },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/widgets/pinned"] });
          queryClient.invalidateQueries({ queryKey: ["/api/widgets", activeDesktopId] });
        },
      }
    );
  };

  const handleMobileReorder = useCallback((widgetId: string, direction: "up" | "down") => {
    const sorted = [...widgets].sort((a, b) => {
      const aOrder = (a.layout as LayoutItem)?.mobileOrder;
      const bOrder = (b.layout as LayoutItem)?.mobileOrder;
      if (aOrder != null && bOrder != null) return aOrder - bOrder;
      if (aOrder != null) return -1;
      if (bOrder != null) return 1;
      const ay = (a.layout as LayoutItem)?.y ?? 0;
      const by = (b.layout as LayoutItem)?.y ?? 0;
      return ay - by;
    });
    const idx = sorted.findIndex(w => w.id === widgetId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const getLayout = (w: Widget): LayoutItem => {
      const size = defaultWidgetSizes[w.type as WidgetType] || defaultWidgetSizes.notes;
      return (w.layout as LayoutItem) || { i: w.id, x: 0, y: 0, w: size.w, h: size.h, minW: size.minW, minH: size.minH };
    };
    const currentLayout = getLayout(sorted[idx]);
    const swapLayout = getLayout(sorted[swapIdx]);

    const newCurrentLayout = { ...currentLayout, i: sorted[idx].id, mobileOrder: swapIdx };
    const newSwapLayout = { ...swapLayout, i: sorted[swapIdx].id, mobileOrder: idx };

    queryClient.setQueryData(
      ["/api/widgets", activeDesktopId],
      (old: Widget[] | undefined) =>
        old?.map(w => {
          if (w.id === sorted[idx].id) return { ...w, layout: newCurrentLayout };
          if (w.id === sorted[swapIdx].id) return { ...w, layout: newSwapLayout };
          return w;
        })
    );

    updateWidgetLayout.mutate([
      { id: sorted[idx].id, layout: newCurrentLayout },
      { id: sorted[swapIdx].id, layout: newSwapLayout },
    ]);
  }, [widgets, updateWidgetLayout, activeDesktopId]);

  const handleMobileHeightChange = useCallback((widget: Widget, height: number) => {
    const layout = (widget.layout as LayoutItem) || { i: widget.id, x: 0, y: 0, w: 4, h: 4, minW: 1, minH: 3 };
    updateWidget.mutate({
      id: widget.id,
      updates: { layout: { ...layout, mobileHeight: height } },
    });
  }, [updateWidget]);

  const handleDesktopRename = (desktopId: string) => {
    if (editingDesktopName.trim()) {
      updateDesktop.mutate({
        id: desktopId,
        updates: { name: editingDesktopName.trim() },
      });
    }
    setEditingDesktopId(null);
  };

  const currentLayout: GridLayoutItem[] = widgets.map((widget, index) => {
    const layout = widget.layout as LayoutItem | undefined;
    const size = defaultWidgetSizes[widget.type as WidgetType] || defaultWidgetSizes.notes;
    const effectiveMinH = Math.max(size.minH, 3);
    
    if (isMobile) {
      const savedH = layout?.h ?? size.h;
      const clampedH = Math.max(savedH, effectiveMinH);
      return {
        i: widget.id,
        x: 0,
        y: index * (widget.collapsed ? 1 : clampedH),
        w: 1,
        h: widget.collapsed ? 1 : clampedH,
        minW: 1,
        minH: widget.collapsed ? 1 : effectiveMinH,
        isResizable: !widget.collapsed,
      };
    }
    
    const savedH = layout?.h ?? size.h;
    const clampedH = Math.max(savedH, size.minH);
    return {
      i: widget.id,
      x: layout?.x ?? 0,
      y: layout?.y ?? 0,
      w: layout?.w ?? size.w,
      h: widget.collapsed ? 1 : clampedH,
      minW: size.minW,
      minH: widget.collapsed ? 1 : size.minH,
      isResizable: !widget.collapsed,
    };
  });

  const renderWidgetContent = (widget: Widget) => {
    switch (widget.type) {
      case "notes":
        return (
          <NotesWidget
            content={(widget.content as NotesContent) || { markdown: "" }}
            onContentChange={(content) => handleContentChange(widget, content)}
          />
        );
      case "priorities":
        return (
          <PrioritiesWidget
            content={(widget.content as PrioritiesContent) || { ventureId: "" }}
            onContentChange={(content) => handleContentChange(widget, content)}
          />
        );
      case "revenue":
        return (
          <RevenueWidget
            content={(widget.content as RevenueContent) || { ventureId: "", chartType: "line" }}
            onContentChange={(content) => handleContentChange(widget, content)}
          />
        );
      case "iframe":
        return (
          <IframeWidget
            content={(widget.content as IframeContent) || { url: "" }}
            onContentChange={(content) => handleContentChange(widget, content)}
          />
        );
      case "code":
        return (
          <CodeWidget
            content={(widget.content as CodeContent) || { code: "", language: "html" }}
            onContentChange={(content) => handleContentChange(widget, content)}
          />
        );
      case "context_mode":
        return (
          <ContextModeWidget
            desktopId={activeDesktopId || ""}
            desktopName={activeDesktop?.name || ""}
          />
        );
      case "quick_capture":
        return <QuickCaptureWidget widgetId={widget.id} />;
      case "habit_tracker":
        return <HabitTrackerWidget widgetId={widget.id} />;
      case "daily_journal":
        return <DailyJournalWidget widgetId={widget.id} />;
      case "weekly_scorecard":
        return <WeeklyScorecardWidget widgetId={widget.id} />;
      case "kpi_dashboard":
        return <KpiDashboardWidget widgetId={widget.id} />;
      case "waiting_for":
        return <WaitingForWidget widgetId={widget.id} />;
      case "crm_pipeline":
        return <CrmPipelineWidget widgetId={widget.id} />;
      case "time_blocks":
        return <TimeBlocksWidget widgetId={widget.id} />;
      case "expense_tracker":
        return <ExpenseTrackerWidget widgetId={widget.id} />;
      case "meeting_prep":
        return <MeetingPrepWidget widgetId={widget.id} />;
      case "google_calendar":
        return (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4 text-center">
            Google Calendar widget has been removed. You can delete this widget.
          </div>
        );
      case "ai_chat":
        return (
          <AiChatWidget
            content={(widget.content as AiChatContent) || {}}
            onContentChange={(content) => handleContentChange(widget, content)}
          />
        );
      case "timer":
        return (
          <TimerWidget
            content={(widget.content as TimerContent) || { mode: "countdown", hours: 0, minutes: 5, seconds: 0, sound: "beep" }}
            onContentChange={(content) => handleContentChange(widget, content)}
          />
        );
      case "custom":
        return (
          <CustomWidget
            content={(widget.content as CustomWidgetContent) || {}}
            onContentChange={(content) => handleContentChange(widget, content)}
          />
        );
      case "ad_board":
        return (
          <AdBoardWidget
            widgetId={widget.id}
            content={(widget.content as AdBoardContent) || {}}
            onContentChange={(content) => handleContentChange(widget, content)}
            isAdmin={userSettings?.isAdmin || false}
          />
        );
      default:
        return <div>Unknown widget type</div>;
    }
  };

  const bgColor = activeDesktop?.backgroundColor || "#09090b";
  const isLightBg = isColorLight(bgColor);

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {isMobile ? (
        <>
          <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="px-3 h-14 flex items-center justify-between gap-2">
              <a href="/" className="flex items-center gap-2 shrink-0 rounded-md hover:opacity-90" title="Home" data-testid="link-home-mobile">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
              </a>
              <span className="text-sm font-semibold truncate" data-testid="text-mobile-desktop-name">
                {activeDesktop?.name || appName}
              </span>
              <div className="flex items-center gap-1">
                <NotificationsBell />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHunterAI(true)}
                  data-testid="button-hunter-ai-open-mobile"
                >
                  <Crosshair className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileMenu(true)}
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
            <SheetContent side="bottom" className="max-h-[85vh] px-4 pb-6" data-testid="mobile-menu-sheet">
              <SheetHeader className="pb-3">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Desktops</p>
                    <div className="flex flex-col gap-1">
                      {desktopList.map((desktop, idx) => (
                        <div key={desktop.id} className="flex items-center gap-1">
                          <Button
                            variant={activeDesktopId === desktop.id ? "default" : "ghost"}
                            className="justify-start gap-2 flex-1"
                            onClick={() => {
                              handleDesktopSwitch(desktop.id);
                              setShowMobileMenu(false);
                            }}
                            data-testid={`button-mobile-desktop-${desktop.id}`}
                          >
                            <Monitor className="h-4 w-4" />
                            {desktop.name}
                          </Button>
                          {desktopList.length > 1 && (
                            <div className="flex flex-col">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveDesktop(desktop.id, -1)}
                                disabled={idx === 0}
                                data-testid={`button-mobile-move-up-${desktop.id}`}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveDesktop(desktop.id, 1)}
                                disabled={idx === desktopList.length - 1}
                                data-testid={`button-mobile-move-down-${desktop.id}`}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        className="justify-start gap-2"
                        onClick={() => {
                          createDesktop.mutate();
                          setShowMobileMenu(false);
                        }}
                        disabled={createDesktop.isPending}
                        data-testid="button-mobile-add-desktop"
                      >
                        <Plus className="h-4 w-4" />
                        Add Desktop
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => {
                          setShowPresetLibrary(true);
                          setShowMobileMenu(false);
                        }}
                        data-testid="button-mobile-preset-library"
                      >
                        <Library className="h-4 w-4" />
                        Preset Library
                      </Button>
                    </div>
                  </div>

                  {activeDesktop && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Background Color</p>
                      <div className="grid grid-cols-6 gap-1.5">
                        {BG_COLORS.map((c) => (
                          <button
                            key={c.value}
                            className={`w-full aspect-square rounded-md border-2 transition-all ${
                              activeDesktop.backgroundColor === c.value
                                ? "border-primary ring-1 ring-primary"
                                : "border-transparent hover:border-muted-foreground/30"
                            }`}
                            style={{ backgroundColor: c.value }}
                            title={c.label}
                            onClick={() => {
                              updateDesktop.mutate({
                                id: activeDesktop.id,
                                updates: { backgroundColor: c.value },
                              });
                            }}
                            data-testid={`button-mobile-bg-color-${c.label.toLowerCase().replace(/\s+/g, "-")}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</p>
                    <div className="flex flex-col gap-1">
                      {activeDesktop && desktopList.length > 1 && (
                        <Button
                          variant="ghost"
                          className="justify-start gap-2 text-destructive"
                          onClick={() => {
                            setDeleteDesktopId(activeDesktop.id);
                            setShowMobileMenu(false);
                          }}
                          data-testid="button-mobile-delete-desktop"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Desktop
                        </Button>
                      )}
                      {hasContextModeWidget && (
                        <Button
                          variant="ghost"
                          className="justify-start gap-2"
                          onClick={() => {
                            setShowSettingsDialog(true);
                            setShowMobileMenu(false);
                          }}
                          data-testid="button-mobile-context-settings"
                        >
                          <Settings className="h-4 w-4" />
                          Context Settings
                        </Button>
                      )}
                      <VentureManager />
                      <ThemeToggle />
                    </div>
                  </div>
                  <div className="space-y-2 pt-3 border-t border-border">
                    <div className="flex items-center gap-2 px-2 py-1">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                        <AvatarFallback className="text-xs">
                          {(user?.firstName?.[0] || "U").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground truncate">
                        {user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : user?.email || "User"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      className="justify-start gap-2 w-full"
                      onClick={() => { window.location.href = "/pricing"; }}
                      data-testid="button-mobile-billing"
                    >
                      <CreditCard className="h-4 w-4" />
                      Billing
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start gap-2 w-full"
                      onClick={() => { window.location.href = "/api/logout"; }}
                      data-testid="button-mobile-logout"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 h-14 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-2 rounded-md hover:opacity-90 transition-opacity" title="Home" data-testid="link-home">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                {editingAppName ? (
                  <Input
                    ref={appNameInputRef}
                    value={appNameValue}
                    onChange={(e) => setAppNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (appNameValue.trim()) updateUserSettings.mutate({ appName: appNameValue.trim() });
                        setEditingAppName(false);
                      }
                      if (e.key === "Escape") setEditingAppName(false);
                    }}
                    onBlur={() => {
                      if (appNameValue.trim()) updateUserSettings.mutate({ appName: appNameValue.trim() });
                      setEditingAppName(false);
                    }}
                    className="h-7 w-32 text-sm font-bold px-2"
                    data-testid="input-app-name"
                  />
                ) : (
                  <div className="hidden sm:flex items-center gap-1">
                    <h1
                      className="text-xl font-bold tracking-tight"
                      data-testid="text-app-name"
                    >
                      {appName}
                    </h1>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setEditingAppName(true); setAppNameValue(appName); setTimeout(() => appNameInputRef.current?.focus(), 50); }}
                      data-testid="button-edit-app-name"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </a>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto flex-1 justify-center px-2">
              {desktopList.map((desktop) => (
                <div key={desktop.id} className="flex items-center">
                  {editingDesktopId === desktop.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        ref={editInputRef}
                        value={editingDesktopName}
                        onChange={(e) => setEditingDesktopName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleDesktopRename(desktop.id);
                          if (e.key === "Escape") setEditingDesktopId(null);
                        }}
                        onBlur={() => handleDesktopRename(desktop.id)}
                        className="h-7 w-28 text-xs px-2"
                        data-testid="input-desktop-name"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-0 shrink-0">
                      {activeDesktopId === desktop.id && desktopList.indexOf(desktop) > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); moveDesktop(desktop.id, -1); }}
                          data-testid={`button-move-desktop-left-${desktop.id}`}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant={activeDesktopId === desktop.id ? "default" : "ghost"}
                        size="sm"
                        className="text-xs gap-1.5 px-3 shrink-0"
                        onClick={() => handleDesktopSwitch(desktop.id)}
                        onDoubleClick={() => {
                          setEditingDesktopId(desktop.id);
                          setEditingDesktopName(desktop.name);
                        }}
                        data-testid={`button-desktop-${desktop.id}`}
                      >
                        <Monitor className="h-3.5 w-3.5" />
                        {desktop.name}
                      </Button>
                      {activeDesktopId === desktop.id && desktopList.indexOf(desktop) < desktopList.length - 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); moveDesktop(desktop.id, 1); }}
                          data-testid={`button-move-desktop-right-${desktop.id}`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => createDesktop.mutate()}
                disabled={createDesktop.isPending}
                data-testid="button-add-desktop"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setShowPresetLibrary(true)}
                data-testid="button-preset-library"
              >
                <Library className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {activeDesktop && (
                <>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid="button-desktop-bg-color"
                      >
                        <div
                          className="w-5 h-5 rounded-md border border-border"
                          style={{ backgroundColor: activeDesktop.backgroundColor }}
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="end">
                      <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Background Color</p>
                      <div className="grid grid-cols-6 gap-1.5">
                        {BG_COLORS.map((c) => (
                          <button
                            key={c.value}
                            className={`w-9 h-9 rounded-md border-2 transition-all ${
                              activeDesktop.backgroundColor === c.value
                                ? "border-primary ring-1 ring-primary"
                                : "border-transparent hover:border-muted-foreground/30"
                            }`}
                            style={{ backgroundColor: c.value }}
                            title={c.label}
                            onClick={() => {
                              updateDesktop.mutate({
                                id: activeDesktop.id,
                                updates: { backgroundColor: c.value },
                              });
                            }}
                            data-testid={`button-bg-color-${c.label.toLowerCase().replace(/\s+/g, "-")}`}
                          />
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t">
                        <label className="text-xs text-muted-foreground mb-1 block px-1">Custom</label>
                        <input
                          type="color"
                          value={activeDesktop.backgroundColor}
                          onChange={(e) => {
                            updateDesktop.mutate({
                              id: activeDesktop.id,
                              updates: { backgroundColor: e.target.value },
                            });
                          }}
                          className="w-full h-8 rounded-md cursor-pointer"
                          data-testid="input-custom-bg-color"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  {desktopList.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground"
                      onClick={() => setDeleteDesktopId(activeDesktop.id)}
                      data-testid="button-delete-desktop"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
              {hasContextModeWidget && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettingsDialog(true)}
                  data-testid="button-context-settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              <VentureManager />
              <AddWidgetDialog onAddWidget={(type, title, content) => addWidget.mutate({ type, title, content })} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHunterAI(true)}
                title="HunterAI Assistant"
                data-testid="button-hunter-ai-open"
              >
                <Crosshair className="h-4 w-4" />
              </Button>
              <NotificationsBell />
              <ThemeToggle />
              <div className="flex items-center gap-1.5 ml-1 pl-1.5 border-l border-border">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                  <AvatarFallback className="text-xs">
                    {(user?.firstName?.[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  asChild
                  data-testid="button-billing"
                >
                  <a href="/pricing" title="Billing">
                    <CreditCard className="h-4 w-4" />
                    <span className="hidden sm:inline">Billing</span>
                  </a>
                </Button>
                {userSettings?.isAdmin && (
                  <>
                    <AdminCodesDialog />
                    <AdminAnnouncementsDialog />
                    <AdminWidgetTemplates />
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { window.location.href = "/api/logout"; }}
                  title="Sign out"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      <main ref={containerRef} className={isMobile ? "px-3 py-4 pb-20" : "px-4 py-6"}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
          </div>
        ) : desktopList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Monitor className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${isLightBg ? "text-gray-900" : "text-white"}`}>Welcome to Your Dashboard</h2>
            <p className={`mb-4 max-w-md ${isLightBg ? "text-gray-600" : "text-white/60"}`}>
              Get started by creating your first dashboard and adding widgets to organize your work.
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Button onClick={() => createDesktop.mutate()} data-testid="button-create-first-desktop">
                <Plus className="h-4 w-4 mr-2" />
                Create Dashboard
              </Button>
              <Button variant="outline" onClick={() => setShowPresetLibrary(true)} data-testid="button-browse-templates">
                <Library className="h-4 w-4 mr-2" />
                Browse Templates
              </Button>
            </div>
          </div>
        ) : widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${isLightBg ? "text-gray-900" : "text-white"}`}>Add Widgets to Your Dashboard</h2>
            <p className={`mb-4 max-w-md ${isLightBg ? "text-gray-600" : "text-white/60"}`}>
              Add widgets to "{activeDesktop?.name}" to track notes, priorities, revenue, and more — or start from a template.
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <AddWidgetDialog onAddWidget={(type, title, content) => addWidget.mutate({ type, title, content })} />
              <Button variant="outline" onClick={() => setShowPresetLibrary(true)} data-testid="button-empty-browse-templates">
                <Library className="h-4 w-4 mr-2" />
                Browse Templates
              </Button>
            </div>
          </div>
        ) : isMobile ? (
          <div className="flex flex-col gap-3" data-testid="mobile-widget-list">
            {[...widgets].sort((a, b) => {
              const aOrder = (a.layout as LayoutItem)?.mobileOrder;
              const bOrder = (b.layout as LayoutItem)?.mobileOrder;
              if (aOrder != null && bOrder != null) return aOrder - bOrder;
              if (aOrder != null) return -1;
              if (bOrder != null) return 1;
              const ay = (a.layout as LayoutItem)?.y ?? 0;
              const by = (b.layout as LayoutItem)?.y ?? 0;
              return ay - by;
            }).map((widget, idx, arr) => (
              <div key={widget.id} data-testid={`widget-${widget.id}`}>
                <WidgetWrapper
                  title={widget.title}
                  widgetType={widget.type as any}
                  collapsed={widget.collapsed || false}
                  onToggleCollapse={() => handleToggleCollapse(widget)}
                  onRemove={() => deleteWidget.mutate(widget.id)}
                  onTitleChange={(newTitle) => handleTitleChange(widget, newTitle)}
                  onCardColorChange={(color) => handleCardColorChange(widget, color)}
                  cardColor={widget.cardColor}
                  pinnedAllDesktops={widget.pinnedAllDesktops || false}
                  onTogglePin={(pinned) => handlePinToggle(widget, pinned)}
                  showPinOption={widget.type === "context_mode"}
                  onDuplicate={() => duplicateWidget.mutate(widget)}
                  isMobile
                  onMoveUp={() => handleMobileReorder(widget.id, "up")}
                  onMoveDown={() => handleMobileReorder(widget.id, "down")}
                  isFirst={idx === 0}
                  isLast={idx === arr.length - 1}
                  mobileHeight={(widget.layout as LayoutItem & { mobileHeight?: number })?.mobileHeight ?? null}
                  onMobileHeightChange={(h) => handleMobileHeightChange(widget, h)}
                >
                  {renderWidgetContent(widget)}
                </WidgetWrapper>
              </div>
            ))}
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={currentLayout}
            cols={gridCols}
            rowHeight={ROW_HEIGHT}
            width={containerWidth}
            onDragStop={(layout) => handleLayoutChange(layout)}
            onResizeStop={(layout) => handleLayoutChange(layout)}
            draggableHandle=".widget-drag-handle"
            draggableCancel=".draggable-cancel"
            compactType="vertical"
            preventCollision={false}
            margin={[12, 12]}
            useCSSTransforms={true}
            resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
          >
            {widgets.map((widget) => (
              <div key={widget.id} data-testid={`widget-${widget.id}`}>
                <WidgetWrapper
                  title={widget.title}
                  widgetType={widget.type as any}
                  collapsed={widget.collapsed || false}
                  onToggleCollapse={() => handleToggleCollapse(widget)}
                  onRemove={() => deleteWidget.mutate(widget.id)}
                  onTitleChange={(newTitle) => handleTitleChange(widget, newTitle)}
                  onCardColorChange={(color) => handleCardColorChange(widget, color)}
                  cardColor={widget.cardColor}
                  pinnedAllDesktops={widget.pinnedAllDesktops || false}
                  onTogglePin={(pinned) => handlePinToggle(widget, pinned)}
                  showPinOption={widget.type === "context_mode"}
                  onDuplicate={() => duplicateWidget.mutate(widget)}
                >
                  {renderWidgetContent(widget)}
                </WidgetWrapper>
              </div>
            ))}
          </GridLayout>
        )}
      </main>

      {isMobile && activeDesktop && widgets.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 [&>*]:w-full [&_button:first-child]:w-full" data-testid="mobile-bottom-bar">
          <AddWidgetDialog onAddWidget={(type, title) => addWidget.mutate({ type, title })} />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteDesktopId}
        onOpenChange={(open) => !open && setDeleteDesktopId(null)}
        title="Delete Desktop"
        description={`Are you sure you want to delete "${desktopList.find(d => d.id === deleteDesktopId)?.name}"? All widgets on this desktop will be deleted. This action cannot be undone.`}
        onConfirm={() => {
          if (deleteDesktopId) {
            removeDesktop.mutate(deleteDesktopId);
            setDeleteDesktopId(null);
          }
        }}
        confirmText="Delete Desktop"
      />

      <Dialog open={showContextModal} onOpenChange={setShowContextModal}>
        <DialogContent className="sm:max-w-md" data-testid="enter-context-modal">
          <DialogHeader>
            <DialogTitle className="text-lg" data-testid="text-entering-context">
              Entering {desktopList.find(d => d.id === pendingDesktopId)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {pendingContract?.objective ? (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today's Objective</p>
                <p className="text-sm" data-testid="text-modal-objective">{pendingContract.objective}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground" data-testid="text-no-objective">No objective set yet. Set one in the Context Mode widget.</p>
            )}
            {pendingContract?.top3 && (pendingContract.top3 as { text: string; done: boolean }[]).some(t => t.text) && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top 3 Actions</p>
                {(pendingContract.top3 as { text: string; done: boolean }[]).map((item, i) => (
                  item.text ? (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={item.done} disabled />
                      <span className={item.done ? "line-through text-muted-foreground" : ""} data-testid={`text-modal-top3-${i}`}>
                        {item.text}
                      </span>
                    </div>
                  ) : null
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowContextModal(false);
                setPendingDesktopId(null);
              }}
              data-testid="button-cancel-context"
            >
              Cancel
            </Button>
            <Button onClick={confirmDesktopSwitch} data-testid="button-start-focus">
              Start Focus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showExitWarning} onOpenChange={setShowExitWarning}>
        <AlertDialogContent data-testid="exit-warning-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Leaving {activeDesktop?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              You're leaving {activeDesktop?.name} before today's exit condition is met.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {appSettingsData?.exitGuardMode === "strict" && (
            <div className="space-y-2">
              <Label className="text-sm">Reason for leaving</Label>
              <Textarea
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                placeholder="Why are you leaving early?"
                className="resize-none text-sm"
                rows={2}
                data-testid="input-exit-reason"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-stay">Stay</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const targetDesktopId = pendingDesktopId;
                setShowExitWarning(false);
                setPendingDesktopId(null);
                const showModal = appSettingsData?.showContextModal !== false;
                if (showModal && targetDesktopId) {
                  setPendingDesktopId(targetDesktopId);
                  setShowContextModal(true);
                } else if (targetDesktopId) {
                  setActiveDesktopId(targetDesktopId);
                }
              }}
              disabled={appSettingsData?.exitGuardMode === "strict" && !exitReason.trim()}
              data-testid="button-leave-anyway"
            >
              Leave anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <HunterAI open={showHunterAI} onOpenChange={setShowHunterAI} />

      <PresetLibrary
        open={showPresetLibrary}
        onOpenChange={setShowPresetLibrary}
        activeDesktopId={activeDesktopId}
        isAdmin={userSettings?.isAdmin || false}
        onPresetApplied={(desktopId) => setActiveDesktopId(desktopId)}
      />

      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-sm" data-testid="settings-dialog">
          <DialogHeader>
            <DialogTitle>Context Mode Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm">Show context modal on switch</Label>
                <p className="text-xs text-muted-foreground">Show focus prompt when switching desktops</p>
              </div>
              <Switch
                checked={appSettingsData?.showContextModal !== false}
                onCheckedChange={(checked) => updateSettings.mutate({ showContextModal: checked })}
                data-testid="switch-context-modal"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Exit guard mode</Label>
              <p className="text-xs text-muted-foreground">Control warnings when leaving with incomplete tasks</p>
              <Select
                value={appSettingsData?.exitGuardMode || "soft_warn"}
                onValueChange={(val) => updateSettings.mutate({ exitGuardMode: val as ExitGuardMode })}
              >
                <SelectTrigger data-testid="select-exit-guard">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Off</SelectItem>
                  <SelectItem value="soft_warn">Soft warning (default)</SelectItem>
                  <SelectItem value="strict">Strict (requires reason)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function isColorLight(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}
