import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Library, Plus, Globe, Lock, Trash2, LayoutTemplate, Loader2, Hammer, ArrowLeft, FileText, Code, Target, TrendingUp, Globe as GlobeIcon, Crosshair, Inbox, Flame, BookOpen, BarChart3, Gauge, Clock, Kanban, CalendarClock, DollarSign, Users, Bot, Timer, Sparkles } from "lucide-react";
import type { DashboardPreset, WidgetType } from "@shared/schema";
import { SetupWizard } from "./setup-wizard";

const WIDGET_OPTIONS: { type: WidgetType; label: string; icon: typeof FileText }[] = [
  { type: "notes", label: "Notes", icon: FileText },
  { type: "code", label: "Code Block", icon: Code },
  { type: "priorities", label: "Priorities", icon: Target },
  { type: "revenue", label: "Revenue", icon: TrendingUp },
  { type: "iframe", label: "Embed Web Address", icon: GlobeIcon },
  { type: "context_mode", label: "Context Mode", icon: Crosshair },
  { type: "quick_capture", label: "Quick Capture", icon: Inbox },
  { type: "habit_tracker", label: "Habit Tracker", icon: Flame },
  { type: "daily_journal", label: "Daily Journal", icon: BookOpen },
  { type: "weekly_scorecard", label: "Weekly Scorecard", icon: BarChart3 },
  { type: "kpi_dashboard", label: "KPI Dashboard", icon: Gauge },
  { type: "waiting_for", label: "Waiting For", icon: Clock },
  { type: "crm_pipeline", label: "CRM Pipeline", icon: Kanban },
  { type: "time_blocks", label: "Time Blocks", icon: CalendarClock },
  { type: "expense_tracker", label: "Expense Tracker", icon: DollarSign },
  { type: "meeting_prep", label: "Meeting Prep", icon: Users },
  { type: "ai_chat", label: "AI Chat", icon: Bot },
  { type: "timer", label: "Timer", icon: Timer },
];

interface PresetLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeDesktopId: string | null;
  isAdmin: boolean;
  onPresetApplied: (desktopId: string) => void;
}

type View = "browse" | "save" | "build" | "wizard";

export function PresetLibrary({ open, onOpenChange, activeDesktopId, isAdmin, onPresetApplied }: PresetLibraryProps) {
  const { toast } = useToast();
  const [view, setView] = useState<View>("browse");
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [saveCategory, setSaveCategory] = useState("");
  const [savePublic, setSavePublic] = useState(false);
  const [buildWidgets, setBuildWidgets] = useState<WidgetType[]>([]);
  const [buildName, setBuildName] = useState("");
  const [buildDescription, setBuildDescription] = useState("");
  const [buildCategory, setBuildCategory] = useState("");
  const [buildPublic, setBuildPublic] = useState(false);

  const resetForms = () => {
    setView("browse");
    setSaveName("");
    setSaveDescription("");
    setSaveCategory("");
    setSavePublic(false);
    setBuildWidgets([]);
    setBuildName("");
    setBuildDescription("");
    setBuildCategory("");
    setBuildPublic(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetForms();
    onOpenChange(isOpen);
  };

  const { data: presets = [], isLoading } = useQuery<DashboardPreset[]>({
    queryKey: ["/api/presets"],
    enabled: open,
  });

  const applyPreset = useMutation({
    mutationFn: async ({ presetId }: { presetId: string }) => {
      const res = await apiRequest("POST", `/api/presets/${presetId}/apply`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/desktops"] });
      queryClient.invalidateQueries({ queryKey: ["/api/widgets"] });
      toast({ title: "Template applied!", description: `Created new dashboard with ${data.widgetCount} widgets.` });
      handleOpenChange(false);
      if (data.desktop?.id) {
        onPresetApplied(data.desktop.id);
      }
    },
    onError: () => {
      toast({ title: "Failed to apply template", variant: "destructive" });
    },
  });

  const saveDesktopAsPreset = useMutation({
    mutationFn: async (data: { name: string; description: string; category: string; isPublic: boolean }) => {
      const res = await apiRequest("POST", `/api/presets/save-desktop/${activeDesktopId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      toast({ title: "Template saved!" });
      resetForms();
    },
    onError: () => {
      toast({ title: "Failed to save template", variant: "destructive" });
    },
  });

  const buildTemplate = useMutation({
    mutationFn: async (data: { name: string; description: string; category: string; isPublic: boolean; widgetTypes: WidgetType[] }) => {
      const widgets = data.widgetTypes.map((type, i) => {
        const option = WIDGET_OPTIONS.find(w => w.type === type);
        return {
          type,
          title: option?.label || type,
          content: {},
          layout: { i: `w-${i}`, x: (i % 2) * 6, y: Math.floor(i / 2) * 4, w: 6, h: 4 },
          cardColor: null,
        };
      });
      const res = await apiRequest("POST", "/api/presets", {
        name: data.name,
        description: data.description,
        category: data.category,
        isPublic: data.isPublic,
        widgets,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      toast({ title: "Template created!" });
      resetForms();
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    },
  });

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/presets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      toast({ title: "Template deleted" });
    },
  });

  const toggleBuildWidget = (type: WidgetType) => {
    setBuildWidgets(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const publicPresets = presets.filter(p => p.isPublic);
  const myPresets = presets.filter(p => !p.isPublic);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="preset-library-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {view !== "browse" && (
              <Button size="icon" variant="ghost" onClick={() => setView("browse")} data-testid="button-back-to-browse">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {view === "wizard" ? <Sparkles className="h-5 w-5" /> : <Library className="h-5 w-5" />}
            {view === "browse" ? "Template Library" : view === "save" ? "Save as Template" : view === "wizard" ? "Dashboard Setup Wizard" : "Build a Template"}
          </DialogTitle>
          <DialogDescription>
            {view === "browse" && "Browse templates, get a personalized setup, or build from scratch."}
            {view === "save" && "Save your current dashboard layout as a reusable template."}
            {view === "build" && "Pick the widgets you want and create a reusable template."}
            {view === "wizard" && "Answer a few quick questions and we'll build the perfect dashboard for you."}
          </DialogDescription>
        </DialogHeader>

        {view === "browse" && (
          <>
            <Card className="p-3 space-y-2 border-primary/30 bg-primary/5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-sm">Smart Setup Wizard</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Answer 3 quick questions and get a personalized dashboard built for your exact workflow.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setView("wizard")}
                  data-testid="button-start-wizard"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Start
                </Button>
              </div>
            </Card>

            <div className="flex items-center gap-2 flex-wrap">
              {activeDesktopId && (
                <Button
                  variant="outline"
                  onClick={() => setView("save")}
                  data-testid="button-save-as-preset"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Save Current Dashboard
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setView("build")}
                data-testid="button-build-template"
              >
                <Hammer className="h-4 w-4 mr-1" />
                Build New Template
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">
                {publicPresets.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Globe className="h-4 w-4" />
                      Public Templates
                    </h3>
                    <div className="grid gap-3">
                      {publicPresets.map((preset) => (
                        <PresetCard
                          key={preset.id}
                          preset={preset}
                          onApply={() => applyPreset.mutate({ presetId: preset.id })}
                          onDelete={isAdmin ? () => deletePreset.mutate(preset.id) : undefined}
                          isApplying={applyPreset.isPending}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {myPresets.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Lock className="h-4 w-4" />
                      My Templates
                    </h3>
                    <div className="grid gap-3">
                      {myPresets.map((preset) => (
                        <PresetCard
                          key={preset.id}
                          preset={preset}
                          onApply={() => applyPreset.mutate({ presetId: preset.id })}
                          onDelete={() => deletePreset.mutate(preset.id)}
                          isApplying={applyPreset.isPending}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {publicPresets.length === 0 && myPresets.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <LayoutTemplate className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No templates yet.</p>
                    <p className="text-xs mt-1">Save your current dashboard or build a new template from scratch.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {view === "save" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="preset-name">Template Name</Label>
              <Input
                id="preset-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g., Content Creator Dashboard"
                data-testid="input-preset-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preset-description">Description</Label>
              <Textarea
                id="preset-description"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="What this template includes..."
                className="resize-none"
                data-testid="input-preset-description"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preset-category">Category</Label>
              <Input
                id="preset-category"
                value={saveCategory}
                onChange={(e) => setSaveCategory(e.target.value)}
                placeholder="e.g., Content, Business, Personal"
                data-testid="input-preset-category"
              />
            </div>
            {isAdmin && (
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={savePublic}
                  onCheckedChange={(checked) => setSavePublic(!!checked)}
                  data-testid="checkbox-preset-public"
                />
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Make available to all users</span>
              </label>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setView("browse")} data-testid="button-cancel-save-preset">
                Cancel
              </Button>
              <Button
                onClick={() => saveDesktopAsPreset.mutate({ name: saveName, description: saveDescription, category: saveCategory, isPublic: savePublic })}
                disabled={!saveName.trim() || saveDesktopAsPreset.isPending}
                data-testid="button-confirm-save-preset"
              >
                {saveDesktopAsPreset.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Save Template
              </Button>
            </div>
          </div>
        )}

        {view === "build" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="build-name">Template Name</Label>
              <Input
                id="build-name"
                value={buildName}
                onChange={(e) => setBuildName(e.target.value)}
                placeholder="e.g., Freelancer Starter Kit"
                data-testid="input-build-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="build-description">Description</Label>
              <Textarea
                id="build-description"
                value={buildDescription}
                onChange={(e) => setBuildDescription(e.target.value)}
                placeholder="Describe what this template is for..."
                className="resize-none"
                data-testid="input-build-description"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="build-category">Category</Label>
              <Input
                id="build-category"
                value={buildCategory}
                onChange={(e) => setBuildCategory(e.target.value)}
                placeholder="e.g., Content, Business, Personal"
                data-testid="input-build-category"
              />
            </div>

            <div className="space-y-2">
              <Label>Select Widgets ({buildWidgets.length} selected)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WIDGET_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = buildWidgets.includes(option.type);
                  return (
                    <button
                      key={option.type}
                      onClick={() => toggleBuildWidget(option.type)}
                      className={`flex items-center gap-2 p-2.5 rounded-md border transition-colors text-left text-sm ${
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border hover-elevate"
                      }`}
                      data-testid={`button-build-widget-${option.type}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {isAdmin && (
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={buildPublic}
                  onCheckedChange={(checked) => setBuildPublic(!!checked)}
                  data-testid="checkbox-build-public"
                />
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Make available to all users</span>
              </label>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setView("browse")} data-testid="button-cancel-build">
                Cancel
              </Button>
              <Button
                onClick={() => buildTemplate.mutate({
                  name: buildName,
                  description: buildDescription,
                  category: buildCategory,
                  isPublic: buildPublic,
                  widgetTypes: buildWidgets,
                })}
                disabled={!buildName.trim() || buildWidgets.length === 0 || buildTemplate.isPending}
                data-testid="button-confirm-build-template"
              >
                {buildTemplate.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Create Template
              </Button>
            </div>
          </div>
        )}

        {view === "wizard" && (
          <SetupWizard
            onComplete={(desktopId) => {
              handleOpenChange(false);
              onPresetApplied(desktopId);
            }}
            onCancel={() => setView("browse")}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PresetCard({ preset, onApply, onDelete, isApplying }: {
  preset: DashboardPreset;
  onApply: () => void;
  onDelete?: () => void;
  isApplying: boolean;
}) {
  const widgetList = preset.widgets as any[];

  return (
    <Card className="p-3 space-y-2" data-testid={`preset-card-${preset.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm" data-testid={`text-preset-name-${preset.id}`}>{preset.name}</span>
            {preset.category && (
              <Badge variant="secondary" className="text-xs" data-testid={`badge-preset-category-${preset.id}`}>
                {preset.category}
              </Badge>
            )}
            {preset.isPublic && (
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-0.5" />
                Public
              </Badge>
            )}
          </div>
          {preset.description && (
            <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {widgetList.length} widget{widgetList.length !== 1 ? "s" : ""}:
            {" "}{widgetList.map(w => w.title || w.type).join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            onClick={onApply}
            disabled={isApplying}
            data-testid={`button-apply-preset-${preset.id}`}
          >
            {isApplying ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <LayoutTemplate className="h-3 w-3 mr-1" />}
            Use
          </Button>
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              data-testid={`button-delete-preset-${preset.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
