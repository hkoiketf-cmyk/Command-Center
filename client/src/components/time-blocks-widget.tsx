import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, ChevronLeft, ChevronRight, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { TimeBlock } from "@shared/schema";

const BLOCK_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function displayDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function TimeBlocksWidget({ widgetId }: { widgetId: string }) {
  const today = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("10:00");
  const [newColor, setNewColor] = useState(BLOCK_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editColor, setEditColor] = useState("");

  const { data: blocks = [] } = useQuery<TimeBlock[]>({
    queryKey: ["/api/time-blocks", selectedDate, widgetId],
    queryFn: async () => {
      const res = await fetch(`/api/time-blocks/${selectedDate}?widgetId=${widgetId}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });

  const createBlock = useMutation({
    mutationFn: (data: { date: string; startTime: string; endTime: string; label: string; color: string }) =>
      apiRequest("POST", "/api/time-blocks", { ...data, widgetId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-blocks", selectedDate, widgetId] });
      setNewLabel("");
      setShowAdd(false);
    },
  });

  const updateBlock = useMutation({
    mutationFn: ({ id, ...data }: { id: string; startTime: string; endTime: string; label: string; color: string }) =>
      apiRequest("PATCH", `/api/time-blocks/${id}`, { ...data, widgetId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-blocks", selectedDate, widgetId] });
      setEditingId(null);
    },
  });

  const deleteBlock = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/time-blocks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/time-blocks", selectedDate, widgetId] }),
  });

  const navigateDay = (dir: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + dir);
    setSelectedDate(formatDate(d));
  };

  const startEditing = (block: TimeBlock) => {
    setEditingId(block.id);
    setEditLabel(block.label);
    setEditStart(block.startTime);
    setEditEnd(block.endTime);
    setEditColor(block.color);
  };

  const saveEdit = () => {
    if (editingId && editLabel.trim()) {
      updateBlock.mutate({ id: editingId, label: editLabel.trim(), startTime: editStart, endTime: editEnd, color: editColor });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const sortedBlocks = [...blocks].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const minHour = sortedBlocks.length > 0 ? Math.min(...sortedBlocks.map((b) => parseInt(b.startTime))) : 8;
  const maxHour = sortedBlocks.length > 0 ? Math.max(...sortedBlocks.map((b) => parseInt(b.endTime))) + 1 : 18;
  const hours = Array.from({ length: maxHour - minHour }, (_, i) => minHour + i);

  return (
    <div className="flex flex-col h-full gap-2 p-3" data-testid="widget-time-blocks">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigateDay(-1)} data-testid="button-time-prev">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">{displayDate(selectedDate)}</div>
        <Button variant="ghost" size="icon" onClick={() => navigateDay(1)} data-testid="button-time-next">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 relative">
        {hours.map((hour) => (
          <div key={hour} className="flex h-12 border-t border-border/50">
            <div className="w-12 text-[10px] text-muted-foreground pt-0.5 shrink-0">
              {hour % 12 || 12}{hour >= 12 ? "p" : "a"}
            </div>
            <div className="flex-1 relative" />
          </div>
        ))}

        {sortedBlocks.map((block) => {
          const startMin = timeToMinutes(block.startTime) - minHour * 60;
          const endMin = timeToMinutes(block.endTime) - minHour * 60;
          const top = (startMin / 60) * 48;
          const height = Math.max(((endMin - startMin) / 60) * 48, 20);
          const isEditing = editingId === block.id;

          return (
            <div
              key={block.id}
              className="absolute left-12 right-1 rounded-md px-2 py-1 text-xs overflow-hidden group"
              style={{
                top: `${top}px`,
                height: `${height}px`,
                backgroundColor: (isEditing ? editColor : block.color) + "30",
                borderLeft: `3px solid ${isEditing ? editColor : block.color}`,
              }}
              data-testid={`time-block-${block.id}`}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate" style={{ color: block.color }}>{block.label}</div>
                  <div className="text-muted-foreground text-[10px]">
                    {formatTime(block.startTime)} - {formatTime(block.endTime)}
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0 invisible group-hover:visible">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditing(block)}
                    data-testid={`button-edit-block-${block.id}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteBlock.mutate(block.id)}
                    data-testid={`button-delete-block-${block.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingId && (
        <div className="space-y-2 border-t border-border pt-2" data-testid="form-edit-block">
          <div className="text-xs font-medium text-muted-foreground">Edit Block</div>
          <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="Block label" autoFocus data-testid="input-edit-block-label" />
          <div className="flex gap-2">
            <Input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="flex-1" data-testid="input-edit-block-start" />
            <Input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="flex-1" data-testid="input-edit-block-end" />
          </div>
          <div className="flex gap-1">
            {BLOCK_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`w-5 h-5 rounded-full border-2 ${editColor === c ? "ring-2 ring-offset-1 ring-foreground/50" : ""}`}
                style={{ backgroundColor: c, borderColor: editColor === c ? "white" : "transparent" }}
                onClick={() => setEditColor(c)}
                data-testid={`button-edit-color-${c.replace("#", "")}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit} disabled={!editLabel.trim()} data-testid="button-save-edit-block">
              <Check className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
            <Button variant="ghost" size="sm" onClick={cancelEdit} data-testid="button-cancel-edit-block">
              <X className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {!showAdd && !editingId ? (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setShowAdd(true)} data-testid="button-add-block">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Block
        </Button>
      ) : !editingId ? (
        <form
          className="space-y-2 border-t border-border pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (newLabel.trim()) createBlock.mutate({ date: selectedDate, startTime: newStart, endTime: newEnd, label: newLabel.trim(), color: newColor });
          }}
        >
          <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Block label" autoFocus data-testid="input-block-label" />
          <div className="flex gap-2">
            <Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="flex-1" data-testid="input-block-start" />
            <Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="flex-1" data-testid="input-block-end" />
          </div>
          <div className="flex gap-1">
            {BLOCK_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`w-5 h-5 rounded-full border-2 ${newColor === c ? "ring-2 ring-offset-1 ring-foreground/50" : ""}`}
                style={{ backgroundColor: c, borderColor: newColor === c ? "white" : "transparent" }}
                onClick={() => setNewColor(c)}
                data-testid={`button-add-color-${c.replace("#", "")}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!newLabel.trim()} data-testid="button-confirm-block">Add</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setShowAdd(false); setNewLabel(""); }}>Cancel</Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
