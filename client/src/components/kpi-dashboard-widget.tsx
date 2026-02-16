import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Kpi } from "@shared/schema";

export function KpiDashboardWidget() {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newPrefix, setNewPrefix] = useState("");
  const [newUnit, setNewUnit] = useState("");

  const { data: kpis = [], isLoading } = useQuery<Kpi[]>({ queryKey: ["/api/kpis"] });

  const createKpi = useMutation({
    mutationFn: (data: { name: string; targetValue: number; prefix: string; unit: string }) =>
      apiRequest("POST", "/api/kpis", { ...data, currentValue: 0, order: kpis.length }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kpis"] });
      setNewName("");
      setNewTarget("");
      setNewPrefix("");
      setNewUnit("");
      setShowAdd(false);
    },
  });

  const updateKpi = useMutation({
    mutationFn: ({ id, ...data }: { id: string; currentValue?: number }) =>
      apiRequest("PATCH", `/api/kpis/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/kpis"] }),
  });

  const deleteKpi = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/kpis/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/kpis"] }),
  });

  const getStatusColor = (pct: number): string => {
    if (pct >= 80) return "hsl(142, 76%, 36%)";
    if (pct >= 50) return "hsl(48, 96%, 53%)";
    return "hsl(0, 84%, 60%)";
  };

  return (
    <div className="flex flex-col h-full gap-3 p-3" data-testid="widget-kpi-dashboard">
      {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}

      {kpis.length === 0 && !isLoading && !showAdd && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <div className="text-sm">Define your key numbers</div>
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} data-testid="button-add-first-kpi">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add KPI
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {kpis.map((kpi) => {
          const pct = kpi.targetValue > 0 ? Math.min((kpi.currentValue / kpi.targetValue) * 100, 100) : 0;
          const color = getStatusColor(pct);
          const isEditing = editingId === kpi.id;

          return (
            <div key={kpi.id} className="space-y-1.5" data-testid={`kpi-${kpi.id}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{kpi.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {isEditing ? (
                    <form
                      className="flex items-center gap-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        updateKpi.mutate({ id: kpi.id, currentValue: parseFloat(editValue) || 0 });
                        setEditingId(null);
                      }}
                    >
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-20 h-7 text-sm p-1"
                        autoFocus
                        data-testid={`input-kpi-value-${kpi.id}`}
                      />
                      <Button type="submit" variant="ghost" size="icon" className="h-6 w-6">
                        <Check className="h-3 w-3" />
                      </Button>
                    </form>
                  ) : (
                    <>
                      <span className="text-sm font-semibold" style={{ color }}>
                        {kpi.prefix}{kpi.currentValue.toLocaleString()}{kpi.unit ? ` ${kpi.unit}` : ""}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        / {kpi.prefix}{kpi.targetValue.toLocaleString()}{kpi.unit ? ` ${kpi.unit}` : ""}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => { setEditingId(kpi.id); setEditValue(String(kpi.currentValue)); }}
                        data-testid={`button-edit-kpi-${kpi.id}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteKpi.mutate(kpi.id)} data-testid={`button-delete-kpi-${kpi.id}`}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              <div className="text-xs text-muted-foreground text-right">{Math.round(pct)}%</div>
            </div>
          );
        })}
      </div>

      {kpis.length > 0 && !showAdd && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setShowAdd(true)} data-testid="button-add-kpi">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add KPI
        </Button>
      )}

      {showAdd && (
        <form
          className="space-y-2 border-t border-border pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) {
              createKpi.mutate({ name: newName.trim(), targetValue: parseFloat(newTarget) || 0, prefix: newPrefix.trim(), unit: newUnit.trim() });
            }
          }}
        >
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="KPI name (e.g., Monthly Revenue)" autoFocus data-testid="input-kpi-name" />
          <div className="flex gap-2">
            <Input value={newPrefix} onChange={(e) => setNewPrefix(e.target.value)} placeholder="$" className="w-12" data-testid="input-kpi-prefix" />
            <Input value={newTarget} onChange={(e) => setNewTarget(e.target.value)} placeholder="Target" type="number" className="flex-1" data-testid="input-kpi-target" />
            <Input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="unit" className="w-16" data-testid="input-kpi-unit" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!newName.trim()} data-testid="button-confirm-kpi">Add</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setShowAdd(false); setNewName(""); setNewTarget(""); setNewPrefix(""); setNewUnit(""); }}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}
