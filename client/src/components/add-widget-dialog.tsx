import { useState } from "react";
import { FileText, Target, TrendingUp, Globe, Plus, Code, Crosshair } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WidgetType } from "@shared/schema";

interface AddWidgetDialogProps {
  onAddWidget: (type: WidgetType, title: string) => void;
}

const widgetOptions: { type: WidgetType; label: string; description: string; icon: typeof FileText }[] = [
  {
    type: "notes",
    label: "Notes",
    description: "Sticky notes with formatting",
    icon: FileText,
  },
  {
    type: "code",
    label: "Code Block",
    description: "Display code with syntax highlighting",
    icon: Code,
  },
  {
    type: "priorities",
    label: "Priorities",
    description: "Track top 3 priorities per venture",
    icon: Target,
  },
  {
    type: "revenue",
    label: "Revenue",
    description: "Customer payments tracking",
    icon: TrendingUp,
  },
  {
    type: "iframe",
    label: "Embed",
    description: "Embed external tools and websites",
    icon: Globe,
  },
  {
    type: "context_mode",
    label: "Context Mode",
    description: "Focus contract for intentional work",
    icon: Crosshair,
  },
];

export function AddWidgetDialog({ onAddWidget }: AddWidgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);
  const [title, setTitle] = useState("");

  const handleSelectType = (type: WidgetType) => {
    setSelectedType(type);
    const option = widgetOptions.find((o) => o.type === type);
    setTitle(option?.label || "");
  };

  const handleAdd = () => {
    if (selectedType && title.trim()) {
      onAddWidget(selectedType, title.trim());
      setOpen(false);
      setSelectedType(null);
      setTitle("");
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedType(null);
      setTitle("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-widget">
          <Plus className="h-4 w-4 mr-2" />
          Add Widget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
          <DialogDescription>
            Choose a widget type to add to your dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          {widgetOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.type}
                onClick={() => handleSelectType(option.type)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors text-center hover-elevate ${
                  selectedType === option.type
                    ? "border-primary bg-primary/10"
                    : "border-border"
                }`}
                data-testid={`button-widget-type-${option.type}`}
              >
                <Icon className="h-6 w-6" />
                <span className="font-medium text-sm">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        {selectedType && (
          <div className="space-y-3 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="widget-title">Widget Title</Label>
              <Input
                id="widget-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter widget title..."
                data-testid="input-widget-title"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleAdd}
              disabled={!title.trim()}
              data-testid="button-confirm-add-widget"
            >
              Add Widget
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
