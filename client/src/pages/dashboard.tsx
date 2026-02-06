import { useCallback, useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Zap, Plus, Monitor, Trash2, Pencil, Check, X as XIcon } from "lucide-react";
import { WidgetWrapper } from "@/components/widget-wrapper";
import { NotesWidget } from "@/components/notes-widget";
import { PrioritiesWidget } from "@/components/priorities-widget";
import { RevenueWidget } from "@/components/revenue-widget";
import { IframeWidget } from "@/components/iframe-widget";
import { CodeWidget } from "@/components/code-widget";
import { AddWidgetDialog } from "@/components/add-widget-dialog";
import { VentureManager } from "@/components/venture-manager";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Widget, WidgetType, LayoutItem, NotesContent, PrioritiesContent, RevenueContent, IframeContent, CodeContent, Desktop } from "@shared/schema";

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
  { label: "Light", value: "#f8fafc" },
];

export default function Dashboard() {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isMobile, setIsMobile] = useState(false);
  const [activeDesktopId, setActiveDesktopId] = useState<string | null>(null);
  const [editingDesktopId, setEditingDesktopId] = useState<string | null>(null);
  const [editingDesktopName, setEditingDesktopName] = useState("");
  const [deleteDesktopId, setDeleteDesktopId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const { data: desktopList = [], isLoading: desktopsLoading } = useQuery<Desktop[]>({
    queryKey: ["/api/desktops"],
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

  const { data: widgets = [], isLoading: widgetsLoading } = useQuery<Widget[]>({
    queryKey: ["/api/widgets", activeDesktopId],
    queryFn: async () => {
      if (!activeDesktopId) return [];
      const res = await fetch(`/api/widgets?desktopId=${activeDesktopId}`);
      if (!res.ok) throw new Error("Failed to fetch widgets");
      return res.json();
    },
    enabled: !!activeDesktopId,
  });

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

  // Widget mutations
  const addWidget = useMutation({
    mutationFn: async (data: { type: WidgetType; title: string }) => {
      if (!activeDesktopId) throw new Error("No active desktop");
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
        content: {},
        collapsed: false,
        layout,
        desktopId: activeDesktopId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/widgets", activeDesktopId] });
      toast({ title: "Widget added" });
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
        return {
          id: l.i,
          layout: {
            i: l.i,
            x: l.x,
            y: l.y,
            w: l.w,
            h: l.h,
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
    updateWidget.mutate({
      id: widget.id,
      updates: { collapsed: !widget.collapsed },
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
    const size = defaultWidgetSizes[widget.type as WidgetType];
    
    if (isMobile) {
      return {
        i: widget.id,
        x: 0,
        y: index * (widget.collapsed ? 1 : (layout?.h ?? size.h)),
        w: 1,
        h: widget.collapsed ? 1 : (layout?.h ?? size.h),
        minW: 1,
        minH: widget.collapsed ? 1 : 3,
        isResizable: !widget.collapsed,
      };
    }
    
    return {
      i: widget.id,
      x: layout?.x ?? 0,
      y: layout?.y ?? 0,
      w: layout?.w ?? size.w,
      h: widget.collapsed ? 1 : (layout?.h ?? size.h),
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
      default:
        return <div>Unknown widget type</div>;
    }
  };

  const bgColor = activeDesktop?.backgroundColor || "#09090b";
  const isLightBg = isColorLight(bgColor);

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden sm:block">HunterOS</h1>
            </div>
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
                  <Button
                    variant={activeDesktopId === desktop.id ? "default" : "ghost"}
                    size="sm"
                    className="text-xs gap-1.5 px-3 shrink-0"
                    onClick={() => setActiveDesktopId(desktop.id)}
                    onDoubleClick={() => {
                      setEditingDesktopId(desktop.id);
                      setEditingDesktopName(desktop.name);
                    }}
                    data-testid={`button-desktop-${desktop.id}`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    {desktop.name}
                  </Button>
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
                  <PopoverContent className="w-52 p-2" align="end">
                    <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Background Color</p>
                    <div className="grid grid-cols-4 gap-1.5">
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
            <VentureManager />
            <AddWidgetDialog onAddWidget={(type, title) => addWidget.mutate({ type, title })} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main ref={containerRef} className="px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
          </div>
        ) : desktopList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Monitor className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${isLightBg ? "text-gray-900" : "text-white"}`}>Create Your First Desktop</h2>
            <p className={`mb-4 max-w-md ${isLightBg ? "text-gray-600" : "text-white/60"}`}>
              Desktops let you organize widgets into separate layouts. Create one to get started.
            </p>
            <Button onClick={() => createDesktop.mutate()} data-testid="button-create-first-desktop">
              <Plus className="h-4 w-4 mr-2" />
              Create Desktop
            </Button>
          </div>
        ) : widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${isLightBg ? "text-gray-900" : "text-white"}`}>Empty Desktop</h2>
            <p className={`mb-4 max-w-md ${isLightBg ? "text-gray-600" : "text-white/60"}`}>
              Add widgets to "{activeDesktop?.name}" to track notes, priorities, revenue, and more.
            </p>
            <AddWidgetDialog onAddWidget={(type, title) => addWidget.mutate({ type, title })} />
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
                  collapsed={widget.collapsed || false}
                  onToggleCollapse={() => handleToggleCollapse(widget)}
                  onRemove={() => deleteWidget.mutate(widget.id)}
                  onTitleChange={(newTitle) => handleTitleChange(widget, newTitle)}
                  onCardColorChange={(color) => handleCardColorChange(widget, color)}
                  cardColor={widget.cardColor}
                >
                  {renderWidgetContent(widget)}
                </WidgetWrapper>
              </div>
            ))}
          </GridLayout>
        )}
      </main>

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
