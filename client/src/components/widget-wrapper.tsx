import { ChevronDown, ChevronUp, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WidgetWrapperProps {
  title: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onRemove: () => void;
  children: React.ReactNode;
  className?: string;
}

export function WidgetWrapper({
  title,
  collapsed,
  onToggleCollapse,
  onRemove,
  children,
  className,
}: WidgetWrapperProps) {
  return (
    <Card className={cn("h-full flex flex-col overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 py-3 px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab widget-drag-handle" />
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
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
            onClick={onRemove}
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
  );
}
