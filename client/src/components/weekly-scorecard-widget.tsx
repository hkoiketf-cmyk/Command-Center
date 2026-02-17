import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ScorecardMetric, ScorecardEntry } from "@shared/schema";

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

function getPreviousWeekStart(weekStart: string): string {
  const d = new Date(weekStart + "T12:00:00");
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

export function WeeklyScorecardWidget({ widgetId }: { widgetId: string }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newUnit, setNewUnit] = useState("");

  const thisWeek = getWeekStart(new Date());
  const lastWeek = getPreviousWeekStart(thisWeek);

  const { data: metrics = [], isLoading } = useQuery<ScorecardMetric[]>({
    queryKey: ["/api/scorecard-metrics", widgetId],
    queryFn: () => fetch(`/api/scorecard-metrics?widgetId=${widgetId}`).then(r => r.json()),
  });
  const { data: entries = [] } = useQuery<ScorecardEntry[]>({
    queryKey: ["/api/scorecard-entries", widgetId],
    queryFn: () => fetch(`/api/scorecard-entries?widgetId=${widgetId}`).then(r => r.json()),
  });

  const createMetric = useMutation({
    mutationFn: (data: { name: string; target: number; unit: string }) =>
      apiRequest("POST", "/api/scorecard-metrics", { ...data, order: metrics.length, widgetId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scorecard-metrics", widgetId] });
      setNewName("");
      setNewTarget("");
      setNewUnit("");
      setShowAdd(false);
    },
  });

  const deleteMetric = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/scorecard-metrics/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scorecard-metrics", widgetId] });
      queryClient.invalidateQueries({ queryKey: ["/api/scorecard-entries", widgetId] });
    },
  });

  const upsertEntry = useMutation({
    mutationFn: (data: { metricId: string; weekStart: string; value: number }) =>
      apiRequest("PUT", "/api/scorecard-entries", { ...data, widgetId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/scorecard-entries", widgetId] }),
  });

  const getEntry = (metricId: string, weekStart: string): number => {
    const entry = entries.find((e) => e.metricId === metricId && e.weekStart === weekStart);
    return entry?.value ?? 0;
  };

  return (
    <div className="flex flex-col h-full gap-3 p-3" data-testid="widget-weekly-scorecard">
      {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}

      {metrics.length === 0 && !isLoading && !showAdd && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <div className="text-sm">Define your weekly metrics</div>
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} data-testid="button-add-first-metric">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Metric
          </Button>
        </div>
      )}

      {metrics.length > 0 && (
        <div className="space-y-1">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 text-xs text-muted-foreground font-medium px-1">
            <span>Metric</span>
            <span className="w-16 text-center">This Wk</span>
            <span className="w-16 text-center">Last Wk</span>
            <span className="w-14 text-center">Target</span>
            <span className="w-8" />
          </div>

          {metrics.map((metric) => {
            const thisVal = getEntry(metric.id, thisWeek);
            const lastVal = getEntry(metric.id, lastWeek);
            const pct = metric.target > 0 ? (thisVal / metric.target) * 100 : 0;
            const trend = thisVal > lastVal ? "up" : thisVal < lastVal ? "down" : "flat";

            return (
              <div
                key={metric.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center p-1 rounded-md"
                data-testid={`scorecard-metric-${metric.id}`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500 shrink-0" />}
                  {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500 shrink-0" />}
                  {trend === "flat" && <Minus className="h-3 w-3 text-muted-foreground shrink-0" />}
                  <span className="text-sm truncate">{metric.name}</span>
                </div>

                <Input
                  type="number"
                  value={thisVal || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    upsertEntry.mutate({ metricId: metric.id, weekStart: thisWeek, value: val });
                  }}
                  className="w-16 h-7 text-center text-sm p-1"
                  data-testid={`input-scorecard-this-${metric.id}`}
                />

                <div className="w-16 text-center text-sm text-muted-foreground">
                  {lastVal}{metric.unit ? ` ${metric.unit}` : ""}
                </div>

                <div className="w-14 text-center">
                  <div
                    className="text-xs font-medium"
                    style={{
                      color: pct >= 100 ? "hsl(var(--chart-2))" : pct >= 70 ? "hsl(var(--chart-4))" : "hsl(var(--destructive))",
                    }}
                  >
                    {metric.target}{metric.unit ? ` ${metric.unit}` : ""}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => deleteMetric.mutate(metric.id)}
                  data-testid={`button-delete-metric-${metric.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {metrics.length > 0 && !showAdd && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setShowAdd(true)} data-testid="button-add-metric">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Metric
        </Button>
      )}

      {showAdd && (
        <form
          className="space-y-2 border-t border-border pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) {
              createMetric.mutate({ name: newName.trim(), target: parseFloat(newTarget) || 0, unit: newUnit.trim() });
            }
          }}
        >
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Metric name (e.g., Calls Made)" autoFocus data-testid="input-metric-name" />
          <div className="flex gap-2">
            <Input value={newTarget} onChange={(e) => setNewTarget(e.target.value)} placeholder="Target" type="number" className="flex-1" data-testid="input-metric-target" />
            <Input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="Unit" className="w-20" data-testid="input-metric-unit" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!newName.trim()} data-testid="button-confirm-metric">Add</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setShowAdd(false); setNewName(""); setNewTarget(""); setNewUnit(""); }}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}
