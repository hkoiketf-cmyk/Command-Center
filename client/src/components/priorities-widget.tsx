import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, Plus, Trash2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Venture, Priority, PrioritiesContent } from "@shared/schema";

interface PrioritiesWidgetProps {
  content: PrioritiesContent;
  onContentChange: (content: PrioritiesContent) => void;
}

export function PrioritiesWidget({ content, onContentChange }: PrioritiesWidgetProps) {
  const [newPriority, setNewPriority] = useState("");
  const selectedVentureId = content?.ventureId || "";

  const { data: ventures = [] } = useQuery<Venture[]>({
    queryKey: ["/api/ventures"],
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

  const selectedVenture = ventures.find((v) => v.id === selectedVentureId);

  return (
    <div className="h-full flex flex-col gap-4">
      <Select value={selectedVentureId} onValueChange={handleVentureChange}>
        <SelectTrigger data-testid="select-venture">
          <SelectValue placeholder="Select a venture..." />
        </SelectTrigger>
        <SelectContent>
          {ventures.map((venture) => (
            <SelectItem key={venture.id} value={venture.id}>
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

      {selectedVentureId && (
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
                    onClick={() => deletePriority.mutate(priority.id)}
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
  );
}
