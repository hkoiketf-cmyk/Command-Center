import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Target, TrendingUp, Globe, Plus, Code, Crosshair, Inbox, Flame, BookOpen, BarChart3, Gauge, Clock, Kanban, CalendarClock, DollarSign, Users, Calendar, Timer, Blocks, Wand2, ArrowLeft } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { AiWidgetBuilder } from "@/components/ai-widget-builder";
import type { WidgetType, WidgetTemplate } from "@shared/schema";

interface AddWidgetDialogProps {
  onAddWidget: (type: WidgetType, title: string, content?: Record<string, unknown>) => void;
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
  {
    type: "quick_capture",
    label: "Quick Capture",
    description: "Fast inbox for fleeting thoughts",
    icon: Inbox,
  },
  {
    type: "habit_tracker",
    label: "Habit Tracker",
    description: "Daily habit streaks with visual grid",
    icon: Flame,
  },
  {
    type: "daily_journal",
    label: "Daily Journal",
    description: "Dated daily log entries",
    icon: BookOpen,
  },
  {
    type: "weekly_scorecard",
    label: "Weekly Scorecard",
    description: "Track measurable activities vs targets",
    icon: BarChart3,
  },
  {
    type: "kpi_dashboard",
    label: "KPI Dashboard",
    description: "Key numbers with progress indicators",
    icon: Gauge,
  },
  {
    type: "waiting_for",
    label: "Waiting For",
    description: "Track items in other people's courts",
    icon: Clock,
  },
  {
    type: "crm_pipeline",
    label: "CRM Pipeline",
    description: "Mini deal pipeline with stale alerts",
    icon: Kanban,
  },
  {
    type: "time_blocks",
    label: "Time Blocks",
    description: "Visual daily time block planner",
    icon: CalendarClock,
  },
  {
    type: "expense_tracker",
    label: "Expense Tracker",
    description: "Monthly burn rate at a glance",
    icon: DollarSign,
  },
  {
    type: "meeting_prep",
    label: "Meeting Prep",
    description: "Prepare agendas & capture action items",
    icon: Users,
  },
  {
    type: "timer",
    label: "Timer",
    description: "Countdown or count-up timer with sound alerts",
    icon: Timer,
  },
];

export function AddWidgetDialog({ onAddWidget }: AddWidgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WidgetTemplate | null>(null);
  const [title, setTitle] = useState("");
  const [showAiBuilder, setShowAiBuilder] = useState(false);

  const { data: templates } = useQuery<WidgetTemplate[]>({
    queryKey: ["/api/widget-templates"],
    enabled: open,
  });

  const handleSelectType = (type: WidgetType) => {
    setSelectedType(type);
    setSelectedTemplate(null);
    const option = widgetOptions.find((o) => o.type === type);
    setTitle(option?.label || "");
  };

  const handleSelectTemplate = (template: WidgetTemplate) => {
    setSelectedType("custom");
    setSelectedTemplate(template);
    setTitle(template.name);
  };

  const handleAdd = () => {
    if (selectedType && title.trim()) {
      if (selectedType === "custom" && selectedTemplate) {
        onAddWidget(selectedType, title.trim(), {
          templateId: selectedTemplate.id,
          code: selectedTemplate.code,
          templateName: selectedTemplate.name,
        });
      } else {
        onAddWidget(selectedType, title.trim());
      }
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setOpen(false);
    setSelectedType(null);
    setSelectedTemplate(null);
    setTitle("");
    setShowAiBuilder(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedType(null);
      setSelectedTemplate(null);
      setTitle("");
      setShowAiBuilder(false);
    }
  };

  const handleAiWidgetAdd = (code: string, widgetTitle: string) => {
    onAddWidget("custom" as WidgetType, widgetTitle, {
      code,
      templateName: widgetTitle,
    });
    resetAndClose();
  };

  const publicTemplates = templates?.filter(t => t.isPublic) || [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-widget">
          <Plus className="h-4 w-4 mr-2" />
          Add Widget
        </Button>
      </DialogTrigger>
      <DialogContent className={`max-h-[85vh] overflow-y-auto ${showAiBuilder ? "sm:max-w-2xl" : "sm:max-w-lg"}`}>
        {showAiBuilder ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAiBuilder(false)}
                  data-testid="button-back-from-ai-builder"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    Build Your Own Widget with AI
                  </DialogTitle>
                  <DialogDescription>
                    Describe what you want and AI will generate the code for you
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <AiWidgetBuilder
              onAddWidget={handleAiWidgetAdd}
              onClose={() => setShowAiBuilder(false)}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add Widget</DialogTitle>
              <DialogDescription>
                Choose a widget type to add to your dashboard
              </DialogDescription>
            </DialogHeader>

            <div className="border rounded-lg p-4 bg-primary/5 border-primary/20 hover-elevate cursor-pointer"
              onClick={() => setShowAiBuilder(true)}
              data-testid="button-open-ai-builder"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                  <Wand2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Build Your Own Widget with AI</span>
                    <Badge variant="secondary" className="text-xs">AI</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Describe what you want and AI generates the code instantly
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
              {widgetOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.type}
                    onClick={() => handleSelectType(option.type)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors text-center hover-elevate ${
                      selectedType === option.type && !selectedTemplate
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

            {publicTemplates.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Blocks className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Custom Widgets</span>
                  <Badge variant="secondary" className="text-xs">Templates</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {publicTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors text-center hover-elevate ${
                        selectedTemplate?.id === template.id
                          ? "border-primary bg-primary/10"
                          : "border-border"
                      }`}
                      data-testid={`button-template-${template.id}`}
                    >
                      <Blocks className="h-6 w-6" />
                      <span className="font-medium text-sm">{template.name}</span>
                      {template.description && (
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
