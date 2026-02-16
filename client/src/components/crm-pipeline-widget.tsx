import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Deal } from "@shared/schema";

const STAGES = [
  { key: "lead", label: "Lead" },
  { key: "contacted", label: "Contacted" },
  { key: "proposal", label: "Proposal" },
  { key: "negotiating", label: "Negotiating" },
  { key: "closed", label: "Closed" },
] as const;

function getDaysSince(dateStr: string): number {
  const now = new Date();
  const d = new Date(dateStr);
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function getStaleColor(days: number, stage: string): string {
  if (stage === "closed") return "";
  if (days > 14) return "hsl(0, 84%, 60%)";
  if (days > 7) return "hsl(48, 96%, 53%)";
  return "";
}

export function CrmPipelineWidget() {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newAction, setNewAction] = useState("");
  const [dragDealId, setDragDealId] = useState<string | null>(null);

  const { data: deals = [], isLoading } = useQuery<Deal[]>({ queryKey: ["/api/deals"] });

  const createDeal = useMutation({
    mutationFn: (data: { name: string; value: number; nextAction: string }) =>
      apiRequest("POST", "/api/deals", {
        ...data,
        stage: "lead",
        lastContactDate: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      setNewName("");
      setNewValue("");
      setNewAction("");
      setShowAdd(false);
    },
  });

  const updateDeal = useMutation({
    mutationFn: ({ id, ...data }: { id: string; stage?: string; lastContactDate?: string; nextAction?: string }) =>
      apiRequest("PATCH", `/api/deals/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/deals"] }),
  });

  const deleteDeal = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/deals/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/deals"] }),
  });

  const handleDrop = (dealId: string, newStage: string) => {
    updateDeal.mutate({ id: dealId, stage: newStage, lastContactDate: new Date().toISOString() });
    setDragDealId(null);
  };

  const totalValue = deals.filter((d) => d.stage === "closed").reduce((sum, d) => sum + (d.value || 0), 0);
  const pipelineValue = deals.filter((d) => d.stage !== "closed").reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className="flex flex-col h-full gap-2 p-3" data-testid="widget-crm-pipeline">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-4 text-xs">
          <span className="text-muted-foreground">Pipeline: <span className="font-medium text-foreground">${pipelineValue.toLocaleString()}</span></span>
          <span className="text-muted-foreground">Closed: <span className="font-medium text-green-500">${totalValue.toLocaleString()}</span></span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowAdd(!showAdd)} data-testid="button-add-deal">
          <Plus className="h-3.5 w-3.5 mr-1" /> Deal
        </Button>
      </div>

      {showAdd && (
        <form
          className="flex gap-2 flex-wrap"
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) createDeal.mutate({ name: newName.trim(), value: parseFloat(newValue) || 0, nextAction: newAction.trim() });
          }}
        >
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="flex-1 min-w-[100px]" autoFocus data-testid="input-deal-name" />
          <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="$" type="number" className="w-20" data-testid="input-deal-value" />
          <Input value={newAction} onChange={(e) => setNewAction(e.target.value)} placeholder="Next action" className="flex-1 min-w-[100px]" data-testid="input-deal-action" />
          <Button type="submit" size="sm" disabled={!newName.trim()} data-testid="button-confirm-deal">Add</Button>
        </form>
      )}

      <div className="flex-1 flex gap-1 min-h-0 overflow-x-auto">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key);
          const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

          return (
            <div
              key={stage.key}
              className="flex-1 min-w-[120px] flex flex-col gap-1 rounded-md p-1.5"
              style={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.opacity = "0.8"; }}
              onDragLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.opacity = "1";
                if (dragDealId) handleDrop(dragDealId, stage.key);
              }}
              data-testid={`pipeline-stage-${stage.key}`}
            >
              <div className="text-xs font-medium text-center pb-1 border-b border-border mb-1">
                {stage.label} ({stageDeals.length})
                {stageValue > 0 && <div className="text-muted-foreground font-normal">${stageValue.toLocaleString()}</div>}
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 min-h-[40px]">
                {stageDeals.map((deal) => {
                  const days = getDaysSince(deal.lastContactDate);
                  const staleColor = getStaleColor(days, deal.stage);

                  return (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => setDragDealId(deal.id)}
                      onDragEnd={() => setDragDealId(null)}
                      className="p-1.5 rounded border border-border bg-card text-xs space-y-0.5 cursor-grab active:cursor-grabbing group"
                      style={staleColor ? { borderLeftColor: staleColor, borderLeftWidth: 2 } : {}}
                      data-testid={`deal-card-${deal.id}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium truncate">{deal.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 shrink-0"
                          style={{ visibility: "hidden" }}
                          onClick={() => deleteDeal.mutate(deal.id)}
                          data-testid={`button-delete-deal-${deal.id}`}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                      {(deal.value || 0) > 0 && <div className="text-muted-foreground">${(deal.value || 0).toLocaleString()}</div>}
                      {deal.nextAction && <div className="text-muted-foreground truncate">{deal.nextAction}</div>}
                      {staleColor && <div className="text-[10px]" style={{ color: staleColor }}>{days}d ago</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
