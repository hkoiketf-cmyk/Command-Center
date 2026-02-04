import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Circle, Settings2 } from "lucide-react";
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Venture } from "@shared/schema";

const colorOptions = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
];

export function VentureManager() {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(colorOptions[0]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: "",
    name: "",
  });

  const { data: ventures = [] } = useQuery<Venture[]>({
    queryKey: ["/api/ventures"],
  });

  const addVenture = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      return apiRequest("POST", "/api/ventures", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ventures"] });
      setNewName("");
      setNewColor(colorOptions[0]);
    },
  });

  const deleteVenture = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/ventures/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ventures"] });
    },
  });

  const handleAdd = () => {
    if (newName.trim()) {
      addVenture.mutate({ name: newName.trim(), color: newColor });
    }
  };

  const handleDeleteClick = (venture: Venture) => {
    setDeleteConfirm({ open: true, id: venture.id, name: venture.name });
  };

  const confirmDelete = () => {
    deleteVenture.mutate(deleteConfirm.id);
    setDeleteConfirm({ open: false, id: "", name: "" });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" data-testid="button-manage-ventures">
            <Settings2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Ventures</DialogTitle>
            <DialogDescription>
              Add or remove business ventures for tracking priorities and revenue
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              {ventures.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No ventures yet. Add one to get started.
                </p>
              ) : (
                ventures.map((venture) => (
                  <div
                    key={venture.id}
                    className="flex items-center justify-between p-3 rounded-md border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Circle
                        className="h-4 w-4"
                        style={{ fill: venture.color, color: venture.color }}
                      />
                      <span className="font-medium">{venture.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteClick(venture)}
                      data-testid={`button-delete-venture-${venture.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="venture-name">New Venture</Label>
                <Input
                  id="venture-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Venture name..."
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  data-testid="input-new-venture"
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        newColor === color ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      data-testid={`button-color-${color.replace("#", "")}`}
                    />
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleAdd}
                disabled={!newName.trim() || addVenture.isPending}
                data-testid="button-add-venture"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Venture
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title="Delete Venture"
        description={`Are you sure you want to delete "${deleteConfirm.name}"? This will also delete all associated priorities and revenue data. This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
      />
    </>
  );
}
