import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Circle, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Venture, Priority, PrioritiesContent } from "@shared/schema";

const VENTURE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];

interface PrioritiesWidgetProps {
  content: PrioritiesContent;
  onContentChange: (content: PrioritiesContent) => void;
}

export function PrioritiesWidget({ content, onContentChange }: PrioritiesWidgetProps) {
  const [newPriority, setNewPriority] = useState("");
  const [showAddVenture, setShowAddVenture] = useState(false);
  const [newVentureName, setNewVentureName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; text: string }>({
    open: false,
    id: "",
    text: "",
  });
  const selectedVentureId = content?.ventureId || "";

  const { data: ventures = [] } = useQuery<Venture[]>({
    queryKey: ["/api/ventures"],
  });

  const addVenture = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const res = await apiRequest("POST", "/api/ventures", data);
      return await res.json();
    },
    onSuccess: async (venture: Venture) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/ventures"] });
      if (venture?.id) {
        onContentChange({ ventureId: venture.id });
      }
      setNewVentureName("");
      setShowAddVenture(false);
    },
  });

  const { data: priorities = [] } = useQuery<Priority[]>({
    queryKey: ["/api/priorities", selectedVentureId],
    enabled: !!selectedVentureId,
  });

  const addPriority = useMutation({
    mutationFn: async (text: string) => {
      return apiRequest("POST", "/api/priorities", {
        ventureId: selectedVentureId,
        text,
        order: priorities.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/priorities", selectedVentureId] });
      setNewPriority("");
    },
  });

  const togglePriority = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      return apiRequest("PATCH", `/api/priorities/${id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/priorities", selectedVentureId] });
    },
  });

  const deletePriority = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/priorities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/priorities", selectedVentureId] });
    },
  });

  const handleVentureChange = (ventureId: string) => {
    onContentChange({ ventureId });
  };

  const handleAddPriority = () => {
    if (newPriority.trim() && priorities.length < 3) {
      addPriority.mutate(newPriority.trim());
    }
  };

  const handleDeleteClick = (priority: Priority) => {
    setDeleteConfirm({ open: true, id: priority.id, text: priority.text });
  };

  const confirmDelete = () => {
    deletePriority.mutate(deleteConfirm.id);
    setDeleteConfirm({ open: false, id: "", text: "" });
  };

  const selectedVenture = ventures.find((v) => v.id === selectedVentureId);

  return (
    <>
      <div className="h-full flex flex-col gap-4">
        {ventures.length === 0 && !showAddVenture ? (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
            <Briefcase className="h-8 w-8 text-muted-foreground opacity-40" />
            <div className="text-sm text-muted-foreground">Create a venture to start tracking priorities</div>
            <Button variant="outline" size="sm" onClick={() => setShowAddVenture(true)} data-testid="button-create-first-venture">
              <Plus className="h-3.5 w-3.5 mr-1" /> Create Venture
            </Button>
          </div>
        ) : showAddVenture ? (
          <div className="space-y-2">
            <Input
              value={newVentureName}
              onChange={(e) => setNewVentureName(e.target.value)}
              placeholder="Venture name..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newVentureName.trim()) {
                  addVenture.mutate({ name: newVentureName.trim(), color: VENTURE_COLORS[ventures.length % VENTURE_COLORS.length] });
                }
              }}
              data-testid="input-inline-venture-name"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  if (newVentureName.trim()) {
                    addVenture.mutate({ name: newVentureName.trim(), color: VENTURE_COLORS[ventures.length % VENTURE_COLORS.length] });
                  }
                }}
                disabled={!newVentureName.trim() || addVenture.isPending}
                data-testid="button-confirm-inline-venture"
              >
                Create
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowAddVenture(false); setNewVentureName(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <Select value={selectedVentureId || undefined} onValueChange={handleVentureChange}>
              <SelectTrigger className="flex-1" data-testid="select-venture">
                <SelectValue placeholder="Select a venture..." />
              </SelectTrigger>
              <SelectContent>
                {ventures.map((venture) => (
                  <SelectItem key={venture.id} value={venture.id} textValue={venture.name}>
                    <div className="flex items-center gap-2">
                      <Circle
                        className="h-3 w-3"
                        style={{ fill: venture.color, color: venture.color }}
                      />
                      {venture.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => setShowAddVenture(true)} title="Add venture" data-testid="button-add-venture-inline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        {selectedVentureId && !showAddVenture && (
          <>
            <div className="flex-1 space-y-2">
              {priorities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No priorities yet. Add up to 3.
                </p>
              ) : (
                priorities.map((priority, index) => (
                  <div
                    key={priority.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-md border transition-colors",
                      priority.completed
                        ? "bg-muted/50 border-muted"
                        : "bg-card border-border"
                    )}
                    style={{
                      borderLeftWidth: 3,
                      borderLeftColor: selectedVenture?.color || "#3B82F6",
                    }}
                  >
                    <span className="text-xs font-bold text-muted-foreground w-4">
                      {index + 1}
                    </span>
                    <Checkbox
                      checked={priority.completed ?? false}
                      onCheckedChange={(checked) =>
                        togglePriority.mutate({
                          id: priority.id,
                          completed: checked as boolean,
                        })
                      }
                      data-testid={`checkbox-priority-${priority.id}`}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        priority.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {priority.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteClick(priority)}
                      data-testid={`button-delete-priority-${priority.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {priorities.length < 3 && (
              <div className="flex gap-2">
                <Input
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  placeholder="Add a priority..."
                  onKeyDown={(e) => e.key === "Enter" && handleAddPriority()}
                  className="text-sm"
                  data-testid="input-new-priority"
                />
                <Button
                  size="icon"
                  onClick={handleAddPriority}
                  disabled={!newPriority.trim() || addPriority.isPending}
                  data-testid="button-add-priority"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title="Delete Priority"
        description={`Are you sure you want to delete "${deleteConfirm.text}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
      />
    </>
  );
}
