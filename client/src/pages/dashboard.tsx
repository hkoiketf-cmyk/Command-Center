import { useCallback, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import GridLayout, { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Zap } from "lucide-react";
import { WidgetWrapper } from "@/components/widget-wrapper";
import { NotesWidget } from "@/components/notes-widget";
import { PrioritiesWidget } from "@/components/priorities-widget";
import { RevenueWidget } from "@/components/revenue-widget";
import { IframeWidget } from "@/components/iframe-widget";
import { AddWidgetDialog } from "@/components/add-widget-dialog";
import { VentureManager } from "@/components/venture-manager";
import { ThemeToggle } from "@/components/theme-toggle";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Widget, WidgetType, LayoutItem, NotesContent, PrioritiesContent, RevenueContent, IframeContent } from "@shared/schema";

const GRID_COLS = 12;
const ROW_HEIGHT = 50;

const defaultWidgetSizes: Record<WidgetType, { w: number; h: number; minW: number; minH: number }> = {
  notes: { w: 4, h: 6, minW: 2, minH: 4 },
  priorities: { w: 4, h: 6, minW: 3, minH: 5 },
  revenue: { w: 6, h: 7, minW: 4, minH: 5 },
  iframe: { w: 6, h: 8, minW: 3, minH: 4 },
};

export default function Dashboard() {
  const { toast } = useToast();
  const [containerWidth, setContainerWidth] = useState(1200);

  const { data: widgets = [], isLoading } = useQuery<Widget[]>({
    queryKey: ["/api/widgets"],
  });

  const addWidget = useMutation({
    mutationFn: async (data: { type: WidgetType; title: string }) => {
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
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/widgets"] });
      toast({ title: "Widget added" });
    },
  });

  const updateWidget = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Widget> }) => {
      return apiRequest("PATCH", `/api/widgets/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/widgets"] });
    },
  });

  const deleteWidget = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/widgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/widgets"] });
      toast({ title: "Widget removed" });
    },
  });

  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById("dashboard-container");
      if (container) {
        setContainerWidth(container.offsetWidth);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const updateWidgetLayout = useMutation({
    mutationFn: async (updates: { id: string; layout: LayoutItem }[]) => {
      await Promise.all(
        updates.map(({ id, layout }) =>
          apiRequest("PATCH", `/api/widgets/${id}`, { layout })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/widgets"] });
    },
  });

  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      const updates = newLayout.map((l) => ({
        id: l.i,
        layout: {
          i: l.i,
          x: l.x,
          y: l.y,
          w: l.w,
          h: l.h,
          minW: l.minW,
          minH: l.minH,
        },
      }));
      updateWidgetLayout.mutate(updates);
    },
    [updateWidgetLayout]
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

  const currentLayout: Layout[] = widgets.map((widget) => {
    const layout = widget.layout as LayoutItem | undefined;
    const size = defaultWidgetSizes[widget.type as WidgetType];
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
      default:
        return <div>Unknown widget type</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">HunterOS</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <VentureManager />
            <AddWidgetDialog onAddWidget={(type, title) => addWidget.mutate({ type, title })} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="dashboard-container" className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
          </div>
        ) : widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your Dashboard is Empty</h2>
            <p className="text-muted-foreground mb-4 max-w-md">
              Start building your personal command center. Add widgets to track notes, priorities, revenue, and more.
            </p>
            <AddWidgetDialog onAddWidget={(type, title) => addWidget.mutate({ type, title })} />
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={currentLayout}
            cols={GRID_COLS}
            rowHeight={ROW_HEIGHT}
            width={containerWidth}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".widget-drag-handle"
            compactType="vertical"
            preventCollision={false}
            margin={[16, 16]}
          >
            {widgets.map((widget) => (
              <div key={widget.id} data-testid={`widget-${widget.id}`}>
                <WidgetWrapper
                  title={widget.title}
                  collapsed={widget.collapsed || false}
                  onToggleCollapse={() => handleToggleCollapse(widget)}
                  onRemove={() => deleteWidget.mutate(widget.id)}
                >
                  {renderWidgetContent(widget)}
                </WidgetWrapper>
              </div>
            ))}
          </GridLayout>
        )}
      </main>
    </div>
  );
}
