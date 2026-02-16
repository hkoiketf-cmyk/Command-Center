import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { WaitingItem } from "@shared/schema";

function getDaysDiff(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr + "T12:00:00");
  return Math.floor((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatusColor(item: WaitingItem): string {
  if (item.completed) return "hsl(var(--muted-foreground))";
  if (!item.expectedDate) return "";
  const days = getDaysDiff(item.expectedDate);
  if (days > 7) return "hsl(0, 84%, 60%)";
  if (days > 0) return "hsl(48, 96%, 53%)";
  return "";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function WaitingForWidget() {
  const [showAdd, setShowAdd] = useState(false);
  const [newPerson, setNewPerson] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newExpected, setNewExpected] = useState("");

  const { data: items = [], isLoading } = useQuery<WaitingItem[]>({ queryKey: ["/api/waiting-items"] });

  const createItem = useMutation({
    mutationFn: (data: { person: string; description: string; dateSent: string; expectedDate?: string }) =>
      apiRequest("POST", "/api/waiting-items", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waiting-items"] });
      setNewPerson("");
      setNewDesc("");
      setNewExpected("");
      setShowAdd(false);
    },
  });

  const updateItem = useMutation({
    mutationFn: ({ id, ...data }: { id: string; completed?: boolean }) =>
      apiRequest("PATCH", `/api/waiting-items/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/waiting-items"] }),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/waiting-items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/waiting-items"] }),
  });

  const active = items.filter((i) => !i.completed);
  const completed = items.filter((i) => i.completed);

  return (
    <div className="flex flex-col h-full gap-3 p-3" data-testid="widget-waiting-for">
      {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}

      {active.length === 0 && !isLoading && !showAdd && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <div className="text-sm">Nothing in anyone else's court</div>
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} data-testid="button-add-first-waiting">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {active.map((item) => {
          const statusColor = getStatusColor(item);
          return (
            <div
              key={item.id}
              className="p-2 rounded-md border border-border space-y-1"
              style={statusColor ? { borderLeftColor: statusColor, borderLeftWidth: 3 } : {}}
              data-testid={`waiting-item-${item.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{item.person}</div>
                  <div className="text-xs text-muted-foreground break-words">{item.description}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateItem.mutate({ id: item.id, completed: true })} data-testid={`button-complete-waiting-${item.id}`}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteItem.mutate(item.id)} data-testid={`button-delete-waiting-${item.id}`}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>Sent: {formatDate(item.dateSent)}</span>
                {item.expectedDate && (
                  <span style={{ color: statusColor || undefined }}>
                    Due: {formatDate(item.expectedDate)}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {completed.length > 0 && (
          <div className="pt-2 border-t border-border mt-2">
            <div className="text-xs text-muted-foreground mb-1">Resolved ({completed.length})</div>
            {completed.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center gap-2 p-1 opacity-50">
                <Check className="h-3 w-3 shrink-0" />
                <span className="text-xs line-through truncate">{item.person}: {item.description}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto shrink-0" onClick={() => deleteItem.mutate(item.id)}>
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {active.length > 0 && !showAdd && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setShowAdd(true)} data-testid="button-add-waiting">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
        </Button>
      )}

      {showAdd && (
        <form
          className="space-y-2 border-t border-border pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (newPerson.trim() && newDesc.trim()) {
              createItem.mutate({
                person: newPerson.trim(),
                description: newDesc.trim(),
                dateSent: new Date().toISOString().split("T")[0],
                expectedDate: newExpected || undefined,
              });
            }
          }}
        >
          <Input value={newPerson} onChange={(e) => setNewPerson(e.target.value)} placeholder="Person's name" autoFocus data-testid="input-waiting-person" />
          <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What are you waiting for?" data-testid="input-waiting-desc" />
          <Input value={newExpected} onChange={(e) => setNewExpected(e.target.value)} type="date" placeholder="Expected by" data-testid="input-waiting-expected" />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!newPerson.trim() || !newDesc.trim()} data-testid="button-confirm-waiting">Add</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setShowAdd(false); setNewPerson(""); setNewDesc(""); setNewExpected(""); }}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}
