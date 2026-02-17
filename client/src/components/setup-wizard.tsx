import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowRight, ArrowLeft, Loader2, Check, Briefcase, Palette, TrendingUp, Code, Users, Megaphone, Wrench, Heart, ChevronRight } from "lucide-react";
import type { WidgetType } from "@shared/schema";

interface SetupWizardProps {
  onComplete: (desktopId: string) => void;
  onCancel: () => void;
}

interface RoleOption {
  id: string;
  label: string;
  icon: typeof Briefcase;
  description: string;
}

interface PriorityOption {
  id: string;
  label: string;
  description: string;
}

interface ToolOption {
  id: string;
  label: string;
}

const ROLES: RoleOption[] = [
  { id: "content_creator", label: "Content Creator", icon: Palette, description: "YouTuber, blogger, podcaster, social media" },
  { id: "sales", label: "Sales / BizDev", icon: TrendingUp, description: "Deals, pipeline, client management" },
  { id: "freelancer", label: "Freelancer / Consultant", icon: Briefcase, description: "Client work, invoicing, project management" },
  { id: "developer", label: "Developer / Builder", icon: Code, description: "Coding projects, sprint planning, deployments" },
  { id: "coach", label: "Coach / Trainer", icon: Users, description: "Client sessions, programs, progress tracking" },
  { id: "marketer", label: "Marketer / Growth", icon: Megaphone, description: "Campaigns, analytics, funnels, ads" },
  { id: "agency", label: "Agency Owner", icon: Wrench, description: "Team management, multiple clients, workflows" },
  { id: "general", label: "General Solopreneur", icon: Heart, description: "A bit of everything, just getting started" },
];

const PRIORITIES: PriorityOption[] = [
  { id: "revenue", label: "Revenue tracking", description: "Track income, expenses, profit" },
  { id: "clients", label: "Client management", description: "Pipeline, deals, follow-ups" },
  { id: "tasks", label: "Task & priority management", description: "Stay organized, focused" },
  { id: "habits", label: "Habits & accountability", description: "Build consistency, track streaks" },
  { id: "time", label: "Time management", description: "Schedule, time blocks, deadlines" },
  { id: "metrics", label: "KPIs & scorecards", description: "Measure what matters" },
  { id: "notes", label: "Notes & journaling", description: "Capture ideas, reflect daily" },
  { id: "meetings", label: "Meeting prep & follow-up", description: "Agendas, action items" },
];

const TOOLS: ToolOption[] = [
  { id: "timer", label: "Timer / Pomodoro" },
  { id: "external_apps", label: "Embed external web apps" },
  { id: "context_mode", label: "Focus / Deep Work Mode" },
  { id: "expense_tracker", label: "Expense Tracking" },
  { id: "daily_journal", label: "Daily Journal" },
  { id: "quick_capture", label: "Quick Capture Inbox" },
  { id: "meeting_prep", label: "Meeting Prep & Agendas" },
  { id: "crm", label: "CRM / Deal Pipeline" },
  { id: "code_snippets", label: "Code Snippets / Sandbox" },
  { id: "waiting_for", label: "Delegated Task Tracker" },
];

type Step = "role" | "priorities" | "tools" | "generating" | "result";

interface WizardResult {
  desktopName: string;
  description: string;
  widgets: { type: WidgetType; title: string; content: Record<string, unknown>; layout: { i: string; x: number; y: number; w: number; h: number }; cardColor: string | null }[];
}

function generateRecommendation(role: string, priorities: string[], tools: string[]): WizardResult {
  const selectedWidgets: { type: WidgetType; title: string; content: Record<string, unknown>; cardColor: string | null }[] = [];

  const roleWidgetMap: Record<string, { type: WidgetType; title: string; content?: Record<string, unknown>; cardColor?: string }[]> = {
    content_creator: [
      { type: "quick_capture", title: "Content Ideas" },
      { type: "habit_tracker", title: "Publishing Streaks" },
      { type: "weekly_scorecard", title: "Content Metrics" },
      { type: "time_blocks", title: "Content Schedule" },
      { type: "notes", title: "Content Briefs" },
    ],
    sales: [
      { type: "crm_pipeline", title: "Sales Pipeline" },
      { type: "kpi_dashboard", title: "Sales KPIs" },
      { type: "waiting_for", title: "Follow-ups" },
      { type: "meeting_prep", title: "Sales Calls" },
      { type: "revenue", title: "Revenue" },
    ],
    freelancer: [
      { type: "priorities", title: "Active Projects" },
      { type: "time_blocks", title: "Weekly Schedule" },
      { type: "expense_tracker", title: "Business Expenses" },
      { type: "waiting_for", title: "Client Approvals" },
      { type: "notes", title: "Project Notes" },
      { type: "revenue", title: "Income Tracker" },
    ],
    developer: [
      { type: "priorities", title: "Sprint Priorities" },
      { type: "quick_capture", title: "Bug Reports & Ideas" },
      { type: "code", title: "Code Snippets" },
      { type: "time_blocks", title: "Focus Blocks" },
      { type: "daily_journal", title: "Dev Log" },
    ],
    coach: [
      { type: "crm_pipeline", title: "Client Pipeline" },
      { type: "meeting_prep", title: "Session Prep" },
      { type: "waiting_for", title: "Client Actions" },
      { type: "notes", title: "Session Notes" },
      { type: "weekly_scorecard", title: "Business Scorecard" },
      { type: "revenue", title: "Revenue" },
    ],
    marketer: [
      { type: "kpi_dashboard", title: "Campaign KPIs" },
      { type: "weekly_scorecard", title: "Growth Metrics" },
      { type: "quick_capture", title: "Campaign Ideas" },
      { type: "priorities", title: "Active Campaigns" },
      { type: "notes", title: "Strategy Notes" },
      { type: "expense_tracker", title: "Ad Spend" },
    ],
    agency: [
      { type: "crm_pipeline", title: "Client Pipeline" },
      { type: "priorities", title: "Team Priorities" },
      { type: "waiting_for", title: "Client Deliverables" },
      { type: "meeting_prep", title: "Client Meetings" },
      { type: "kpi_dashboard", title: "Agency KPIs" },
      { type: "revenue", title: "Agency Revenue" },
      { type: "expense_tracker", title: "Operating Expenses" },
    ],
    general: [
      { type: "priorities", title: "Top Priorities" },
      { type: "quick_capture", title: "Quick Ideas" },
      { type: "notes", title: "Notes" },
      { type: "daily_journal", title: "Daily Journal" },
    ],
  };

  const roleWidgets = roleWidgetMap[role] || roleWidgetMap.general;
  for (const w of roleWidgets) {
    selectedWidgets.push({ type: w.type, title: w.title, content: w.content || {}, cardColor: w.cardColor || null });
  }

  const existingTypes = new Set(selectedWidgets.map(w => w.type));

  for (const priority of priorities) {
    const priorityWidgets: Record<string, { type: WidgetType; title: string }[]> = {
      revenue: [{ type: "revenue", title: "Revenue Tracker" }],
      clients: [{ type: "crm_pipeline", title: "Client Pipeline" }, { type: "waiting_for", title: "Client Follow-ups" }],
      tasks: [{ type: "priorities", title: "Priorities" }, { type: "context_mode", title: "Focus Mode" }],
      habits: [{ type: "habit_tracker", title: "Habit Tracker" }],
      time: [{ type: "time_blocks", title: "Time Blocks" }, { type: "timer", title: "Focus Timer" }],
      metrics: [{ type: "kpi_dashboard", title: "KPI Dashboard" }, { type: "weekly_scorecard", title: "Weekly Scorecard" }],
      notes: [{ type: "notes", title: "Notes" }, { type: "daily_journal", title: "Daily Journal" }],
      meetings: [{ type: "meeting_prep", title: "Meeting Prep" }],
    };

    const widgets = priorityWidgets[priority] || [];
    for (const w of widgets) {
      if (!existingTypes.has(w.type)) {
        selectedWidgets.push({ type: w.type, title: w.title, content: {}, cardColor: null });
        existingTypes.add(w.type);
      }
    }
  }

  for (const tool of tools) {
    const toolWidgets: Record<string, { type: WidgetType; title: string }> = {
      timer: { type: "timer", title: "Focus Timer" },
      external_apps: { type: "iframe", title: "Web App" },
      context_mode: { type: "context_mode", title: "Focus Mode" },
      expense_tracker: { type: "expense_tracker", title: "Expense Tracker" },
      daily_journal: { type: "daily_journal", title: "Daily Journal" },
      quick_capture: { type: "quick_capture", title: "Quick Capture" },
      meeting_prep: { type: "meeting_prep", title: "Meeting Prep" },
      crm: { type: "crm_pipeline", title: "CRM Pipeline" },
      code_snippets: { type: "code", title: "Code Snippets" },
      waiting_for: { type: "waiting_for", title: "Delegated Tasks" },
    };

    const w = toolWidgets[tool];
    if (w && !existingTypes.has(w.type)) {
      selectedWidgets.push({ type: w.type, title: w.title, content: {}, cardColor: null });
      existingTypes.add(w.type);
    }
  }

  const widgets = selectedWidgets.map((w, i) => ({
    ...w,
    layout: {
      i: `wizard-${i}`,
      x: (i % 2) * 6,
      y: Math.floor(i / 2) * 4,
      w: 6,
      h: 4,
    },
  }));

  const roleLabel = ROLES.find(r => r.id === role)?.label || "Solopreneur";

  return {
    desktopName: `${roleLabel} Dashboard`,
    description: `Auto-generated dashboard for ${roleLabel.toLowerCase()}s with ${widgets.length} widgets tailored to your workflow.`,
    widgets,
  };
}

export function SetupWizard({ onComplete, onCancel }: SetupWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [result, setResult] = useState<WizardResult | null>(null);

  const applySetup = useMutation({
    mutationFn: async (setup: WizardResult) => {
      const presetRes = await apiRequest("POST", "/api/presets", {
        name: setup.desktopName,
        description: setup.description,
        category: "AI Generated",
        isPublic: false,
        widgets: setup.widgets,
      });
      const preset = await presetRes.json();

      const applyRes = await apiRequest("POST", `/api/presets/${preset.id}/apply`, {
        desktopName: setup.desktopName,
      });
      return applyRes.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/desktops"] });
      queryClient.invalidateQueries({ queryKey: ["/api/widgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      toast({ title: "Dashboard created!", description: `${data.widgetCount} widgets ready for you.` });
      if (data.desktop?.id) {
        onComplete(data.desktop.id);
      }
    },
    onError: () => {
      toast({ title: "Failed to create dashboard", variant: "destructive" });
    },
  });

  const togglePriority = (id: string) => {
    setSelectedPriorities(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleTool = (id: string) => {
    setSelectedTools(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    setStep("generating");
    setTimeout(() => {
      const recommendation = generateRecommendation(selectedRole, selectedPriorities, selectedTools);
      setResult(recommendation);
      setStep("result");
    }, 1200);
  };

  const handleApply = () => {
    if (!result) return;
    applySetup.mutate(result);
  };

  const stepNumber = step === "role" ? 1 : step === "priorities" ? 2 : step === "tools" ? 3 : 4;

  return (
    <div className="space-y-4" data-testid="setup-wizard">
      {step !== "generating" && step !== "result" && (
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  s < stepNumber
                    ? "bg-primary text-primary-foreground"
                    : s === stepNumber
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s < stepNumber ? <Check className="h-3.5 w-3.5" /> : s}
              </div>
              {s < 3 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            {step === "role" ? "Your role" : step === "priorities" ? "Your priorities" : "Your tools"}
          </span>
        </div>
      )}

      {step === "role" && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">What best describes your work?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              This helps us pick the right widgets for your workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const selected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`flex items-start gap-3 p-3 rounded-md border text-left transition-colors ${
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border hover-elevate"
                  }`}
                  data-testid={`button-role-${role.id}`}
                >
                  <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{role.label}</div>
                    <div className="text-xs text-muted-foreground">{role.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between gap-2 pt-1">
            <Button variant="ghost" onClick={onCancel} data-testid="button-wizard-cancel">Cancel</Button>
            <Button
              onClick={() => setStep("priorities")}
              disabled={!selectedRole}
              data-testid="button-wizard-next-1"
            >
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === "priorities" && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">What matters most to you?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select all that apply. We'll add the right widgets to support these.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRIORITIES.map((p) => {
              const selected = selectedPriorities.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePriority(p.id)}
                  className={`flex items-start gap-3 p-2.5 rounded-md border text-left transition-colors ${
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border hover-elevate"
                  }`}
                  data-testid={`button-priority-${p.id}`}
                >
                  <div className={`w-4 h-4 rounded border shrink-0 mt-0.5 flex items-center justify-center ${
                    selected ? "bg-primary border-primary" : "border-muted-foreground/30"
                  }`}>
                    {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm">{p.label}</div>
                    <div className="text-xs text-muted-foreground">{p.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between gap-2 pt-1">
            <Button variant="ghost" onClick={() => setStep("role")} data-testid="button-wizard-back-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button
              onClick={() => setStep("tools")}
              disabled={selectedPriorities.length === 0}
              data-testid="button-wizard-next-2"
            >
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === "tools" && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">Any tools you'd like integrated?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Optional. Select any that you'd like on your dashboard.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TOOLS.map((tool) => {
              const selected = selectedTools.includes(tool.id);
              return (
                <button
                  key={tool.id}
                  onClick={() => toggleTool(tool.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-md border text-left transition-colors ${
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border hover-elevate"
                  }`}
                  data-testid={`button-tool-${tool.id}`}
                >
                  <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                    selected ? "bg-primary border-primary" : "border-muted-foreground/30"
                  }`}>
                    {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className="text-sm">{tool.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between gap-2 pt-1">
            <Button variant="ghost" onClick={() => setStep("priorities")} data-testid="button-wizard-back-3">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={handleGenerate} data-testid="button-wizard-generate">
              <Sparkles className="h-4 w-4 mr-1" /> Generate My Dashboard
            </Button>
          </div>
        </div>
      )}

      {step === "generating" && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="relative">
            <Sparkles className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Building your perfect dashboard...</p>
            <p className="text-xs text-muted-foreground mt-1">Selecting the best widgets for your workflow</p>
          </div>
        </div>
      )}

      {step === "result" && result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">{result.desktopName}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{result.description}</p>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Included widgets ({result.widgets.length}):</span>
            <div className="flex flex-wrap gap-1.5">
              {result.widgets.map((w, i) => (
                <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-wizard-widget-${i}`}>
                  {w.title}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-between gap-2 pt-2">
            <Button variant="ghost" onClick={() => setStep("tools")} data-testid="button-wizard-back-result">
              <ArrowLeft className="h-4 w-4 mr-1" /> Adjust
            </Button>
            <Button
              onClick={handleApply}
              disabled={applySetup.isPending}
              data-testid="button-wizard-apply"
            >
              {applySetup.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Create Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
