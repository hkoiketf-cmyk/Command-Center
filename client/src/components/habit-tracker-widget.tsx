import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Habit, HabitEntry } from "@shared/schema";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getLast7Weeks(): string[][] {
  const weeks: string[][] = [];
  const today = new Date();
  for (let w = 6; w >= 0; w--) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (w * 7) + d - today.getDay());
      week.push(formatDate(date));
    }
    weeks.push(week);
  }
  return weeks;
}

const HABIT_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function HabitTrackerWidget() {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: habits = [], isLoading } = useQuery<Habit[]>({ queryKey: ["/api/habits"] });
  const { data: entries = [] } = useQuery<HabitEntry[]>({ queryKey: ["/api/habit-entries"] });

  const createHabit = useMutation({
    mutationFn: (name: string) =>
      apiRequest("POST", "/api/habits", { name, color: HABIT_COLORS[habits.length % HABIT_COLORS.length], order: habits.length }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setNewName("");
      setShowAdd(false);
    },
  });

  const deleteHabit = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/habits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-entries"] });
    },
  });

  const toggleEntry = useMutation({
    mutationFn: async ({ habitId, date, exists }: { habitId: string; date: string; exists: boolean }) => {
      if (exists) {
        return apiRequest("DELETE", `/api/habit-entries/${habitId}/${date}`);
      } else {
        return apiRequest("POST", "/api/habit-entries", { habitId, date });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/habit-entries"] }),
  });

  const weeks = getLast7Weeks();
  const entrySet = new Set(entries.map((e) => `${e.habitId}:${e.date}`));
  const today = formatDate(new Date());

  const getStreak = (habitId: string): number => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const dateStr = formatDate(d);
      if (entrySet.has(`${habitId}:${dateStr}`)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  return (
    <div className="flex flex-col h-full gap-3 p-3" data-testid="widget-habit-tracker">
      {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}

      {habits.length === 0 && !isLoading && !showAdd && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <div className="text-sm">No habits tracked yet</div>
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} data-testid="button-add-first-habit">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Habit
          </Button>
        </div>
      )}

      {habits.map((habit) => {
        const streak = getStreak(habit.id);
        return (
          <div key={habit.id} className="space-y-1" data-testid={`habit-${habit.id}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
                <span className="text-sm font-medium truncate">{habit.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {streak > 0 && (
                  <span className="text-xs font-medium" style={{ color: habit.color }}>
                    {streak}d streak
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => deleteHabit.mutate(habit.id)}
                  data-testid={`button-delete-habit-${habit.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex gap-0.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((date) => {
                    const isDone = entrySet.has(`${habit.id}:${date}`);
                    const isFuture = date > today;
                    return (
                      <button
                        key={date}
                        className="w-3.5 h-3.5 rounded-sm border transition-colors"
                        style={{
                          backgroundColor: isDone ? habit.color : "transparent",
                          borderColor: isDone ? habit.color : "hsl(var(--border))",
                          opacity: isFuture ? 0.2 : 1,
                          cursor: isFuture ? "default" : "pointer",
                        }}
                        onClick={() => {
                          if (!isFuture) {
                            toggleEntry.mutate({ habitId: habit.id, date, exists: isDone });
                          }
                        }}
                        title={date}
                        disabled={isFuture}
                        data-testid={`habit-cell-${habit.id}-${date}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {DAY_LABELS.map((d, i) => (
          <span key={i} className="w-3.5 text-center">{d}</span>
        ))}
      </div>

      {habits.length > 0 && !showAdd && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setShowAdd(true)} data-testid="button-add-habit">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Habit
        </Button>
      )}

      {showAdd && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) createHabit.mutate(newName.trim());
          }}
        >
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Habit name..."
            className="flex-1"
            autoFocus
            data-testid="input-habit-name"
          />
          <Button type="submit" size="sm" disabled={!newName.trim()} data-testid="button-confirm-habit">
            Add
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setShowAdd(false); setNewName(""); }}>
            Cancel
          </Button>
        </form>
      )}
    </div>
  );
}
