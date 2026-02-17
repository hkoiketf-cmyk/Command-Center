import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Check, Flame, Trophy, Star, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Habit, HabitEntry } from "@shared/schema";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

const HABIT_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LABELS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

type ViewMode = "week" | "month" | "year";

function getStreakMilestone(streak: number): { message: string; icon: typeof Flame } | null {
  if (streak >= 365) return { message: "1 YEAR STREAK! Legendary!", icon: Trophy };
  if (streak >= 100) return { message: "100 day streak! Incredible!", icon: Trophy };
  if (streak >= 30) return { message: "30 day streak! On fire!", icon: Flame };
  if (streak >= 14) return { message: "2 week streak! Amazing!", icon: Star };
  if (streak >= 7) return { message: "1 week streak! Keep going!", icon: Star };
  if (streak >= 3) return { message: "3 day streak! Nice start!", icon: Flame };
  return null;
}

function getWeekDates(refDate: Date): string[] {
  const dates: string[] = [];
  const start = new Date(refDate);
  start.setDate(start.getDate() - start.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
}

function getMonthDates(year: number, month: number): (string | null)[][] {
  const weeks: (string | null)[][] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  let current = new Date(firstDay);
  current.setDate(1 - startDow);

  while (current <= lastDay || current.getDay() !== 0) {
    const week: (string | null)[] = [];
    for (let i = 0; i < 7; i++) {
      if (current.getMonth() === month) {
        week.push(formatDate(current));
      } else {
        week.push(null);
      }
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (current > lastDay && current.getDay() === 0) break;
  }
  return weeks;
}

function getYearMonths(year: number): { month: number; year: number }[] {
  return Array.from({ length: 12 }, (_, i) => ({ month: i, year }));
}

export function HabitTrackerWidget() {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [refDate, setRefDate] = useState(new Date());
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

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
      if (selectedHabitId === deleteHabit.variables) setSelectedHabitId(null);
    },
  });

  const updateHabit = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { name?: string; color?: string } }) =>
      apiRequest("PATCH", `/api/habits/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setEditingHabitId(null);
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

  const entrySet = useMemo(() => new Set(entries.map((e) => `${e.habitId}:${e.date}`)), [entries]);
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

  const getLongestStreak = (habitId: string): number => {
    const habitDates = entries
      .filter(e => e.habitId === habitId)
      .map(e => e.date)
      .sort();
    if (habitDates.length === 0) return 0;
    let longest = 1;
    let current = 1;
    for (let i = 1; i < habitDates.length; i++) {
      const prev = new Date(habitDates[i - 1]);
      const curr = new Date(habitDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        current++;
        longest = Math.max(longest, current);
      } else if (diffDays > 1) {
        current = 1;
      }
    }
    return longest;
  };

  const getCompletionRate = (habitId: string, days: number): number => {
    let completed = 0;
    const d = new Date();
    for (let i = 0; i < days; i++) {
      if (entrySet.has(`${habitId}:${formatDate(d)}`)) completed++;
      d.setDate(d.getDate() - 1);
    }
    return days > 0 ? Math.round((completed / days) * 100) : 0;
  };

  const getPeriodStreak = (habitId: string): number => {
    if (viewMode === "week") {
      const dates = getWeekDates(refDate);
      let streak = 0;
      const todayStr = formatDate(new Date());
      const validDates = dates.filter(d => d <= todayStr).reverse();
      for (const date of validDates) {
        if (entrySet.has(`${habitId}:${date}`)) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    } else if (viewMode === "month") {
      const year = refDate.getFullYear();
      const month = refDate.getMonth();
      const todayDate = new Date();
      const lastDay = new Date(year, month + 1, 0).getDate();
      let streak = 0;
      let startDay = lastDay;
      const endOfMonth = new Date(year, month, lastDay);
      if (endOfMonth > todayDate) {
        startDay = todayDate.getDate();
      }
      for (let d = startDay; d >= 1; d--) {
        const dateStr = formatDate(new Date(year, month, d));
        if (new Date(year, month, d) > todayDate) continue;
        if (entrySet.has(`${habitId}:${dateStr}`)) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    } else {
      return getStreak(habitId);
    }
  };

  const getPeriodTotal = (habitId: string): number => {
    if (viewMode === "week") {
      const dates = getWeekDates(refDate);
      const todayStr = formatDate(new Date());
      return dates.filter(d => d <= todayStr && entrySet.has(`${habitId}:${d}`)).length;
    } else if (viewMode === "month") {
      return getMonthCount(habitId).completed;
    } else {
      return getYearCount(habitId).completed;
    }
  };

  const getPeriodLabel = (): string => {
    if (viewMode === "week") return "this week";
    if (viewMode === "month") return MONTH_NAMES[refDate.getMonth()];
    return `${refDate.getFullYear()}`;
  };

  const activeHabit = selectedHabitId ? habits.find(h => h.id === selectedHabitId) : null;
  const displayHabits = activeHabit ? [activeHabit] : habits;

  const navigateRef = (direction: number) => {
    const d = new Date(refDate);
    if (viewMode === "week") d.setDate(d.getDate() + direction * 7);
    else if (viewMode === "month") d.setMonth(d.getMonth() + direction);
    else d.setFullYear(d.getFullYear() + direction);
    setRefDate(d);
  };

  const getNavLabel = (): string => {
    if (viewMode === "week") {
      const weekDates = getWeekDates(refDate);
      const start = new Date(weekDates[0]);
      const end = new Date(weekDates[6]);
      return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} - ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}`;
    } else if (viewMode === "month") {
      return `${MONTH_NAMES[refDate.getMonth()]} ${refDate.getFullYear()}`;
    } else {
      return `${refDate.getFullYear()}`;
    }
  };

  const renderWeekView = (habit: Habit) => {
    const dates = getWeekDates(refDate);
    return (
      <div className="space-y-1.5">
        <div className="grid grid-cols-7 gap-1">
          {DAY_LABELS_SHORT.map((d, i) => (
            <div key={i} className="text-center text-[10px] text-muted-foreground font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {dates.map((date) => {
            const isDone = entrySet.has(`${habit.id}:${date}`);
            const isFuture = date > today;
            const isToday = date === today;
            const dayNum = new Date(date).getDate();
            return (
              <button
                key={date}
                className={`relative flex flex-col items-center justify-center rounded-md aspect-square transition-all ${
                  isToday ? "ring-2 ring-primary/50" : ""
                } ${isFuture ? "opacity-30 cursor-default" : "cursor-pointer"}`}
                style={{
                  backgroundColor: isDone ? habit.color + "20" : "transparent",
                  border: `1.5px solid ${isDone ? habit.color : "hsl(var(--border))"}`,
                }}
                onClick={() => {
                  if (!isFuture) toggleEntry.mutate({ habitId: habit.id, date, exists: isDone });
                }}
                disabled={isFuture}
                title={`${DAY_LABELS[new Date(date).getDay()]} ${date}`}
                data-testid={`habit-cell-${habit.id}-${date}`}
              >
                <span className="text-[10px] text-muted-foreground">{dayNum}</span>
                {isDone && <Check className="h-3.5 w-3.5" style={{ color: habit.color }} />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const getMonthCount = (habitId: string): { completed: number; total: number } => {
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayDate = new Date();
    let completed = 0;
    let total = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      if (date <= todayDate) {
        total++;
        if (entrySet.has(`${habitId}:${formatDate(date)}`)) completed++;
      }
    }
    return { completed, total };
  };

  const renderMonthView = (habit: Habit) => {
    const weeks = getMonthDates(refDate.getFullYear(), refDate.getMonth());
    const { completed, total } = getMonthCount(habit.id);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <span className="text-[10px] text-muted-foreground">{completed}/{total} days</span>
          <span className="text-[10px] font-medium" style={{ color: habit.color }}>{pct}%</span>
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {DAY_LABELS_SHORT.map((d, i) => (
            <div key={i} className="text-center text-[10px] text-muted-foreground font-medium">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-0.5">
            {week.map((date, di) => {
              if (!date) return <div key={di} className="aspect-square" />;
              const isDone = entrySet.has(`${habit.id}:${date}`);
              const isFuture = date > today;
              const isToday = date === today;
              const dayNum = new Date(date).getDate();
              return (
                <button
                  key={date}
                  className={`flex items-center justify-center rounded-sm aspect-square transition-all text-[9px] ${
                    isToday ? "ring-1.5 ring-primary/50" : ""
                  } ${isFuture ? "opacity-30 cursor-default" : "cursor-pointer"}`}
                  style={{
                    backgroundColor: isDone ? habit.color + "40" : "transparent",
                    border: `1px solid ${isDone ? habit.color : "hsl(var(--border))"}`,
                    color: isDone ? habit.color : undefined,
                    fontWeight: isDone ? 600 : 400,
                  }}
                  onClick={() => {
                    if (!isFuture) toggleEntry.mutate({ habitId: habit.id, date, exists: isDone });
                  }}
                  disabled={isFuture}
                  title={date}
                  data-testid={`habit-cell-${habit.id}-${date}`}
                >
                  <span className={isDone ? "" : "text-muted-foreground"} style={isDone ? { color: habit.color } : {}}>{dayNum}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const getYearCount = (habitId: string): { completed: number; total: number } => {
    const year = refDate.getFullYear();
    const todayDate = new Date();
    let completed = 0;
    let total = 0;
    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, m, d);
        if (date <= todayDate) {
          total++;
          if (entrySet.has(`${habitId}:${formatDate(date)}`)) completed++;
        }
      }
    }
    return { completed, total };
  };

  const renderYearView = (habit: Habit) => {
    const months = getYearMonths(refDate.getFullYear());
    const yearCount = getYearCount(habit.id);
    const yearPct = yearCount.total > 0 ? Math.round((yearCount.completed / yearCount.total) * 100) : 0;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <span className="text-[10px] text-muted-foreground">{yearCount.completed}/{yearCount.total} days</span>
          <span className="text-[10px] font-medium" style={{ color: habit.color }}>{yearPct}%</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {months.map(({ month, year }) => {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const todayDate = new Date();
            let completed = 0;
            let countableDays = 0;
            for (let d = 1; d <= daysInMonth; d++) {
              const date = new Date(year, month, d);
              if (date <= todayDate) {
                countableDays++;
                if (entrySet.has(`${habit.id}:${formatDate(date)}`)) completed++;
              }
            }
            const pct = countableDays > 0 ? Math.round((completed / countableDays) * 100) : 0;
            const isCurrent = month === new Date().getMonth() && year === new Date().getFullYear();
            const isFutureMonth = new Date(year, month, 1) > todayDate;
            return (
              <button
                key={month}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-md border transition-all ${
                  isCurrent ? "ring-1 ring-primary/50" : ""
                } ${isFutureMonth ? "opacity-30" : ""}`}
                style={{
                  backgroundColor: completed > 0 ? habit.color + Math.min(Math.round(pct * 0.6), 60).toString(16).padStart(2, "0") : "transparent",
                  borderColor: completed > 0 ? habit.color : "hsl(var(--border))",
                }}
                onClick={() => {
                  setRefDate(new Date(year, month, 1));
                  setViewMode("month");
                }}
                data-testid={`habit-year-${habit.id}-${month}`}
              >
                <span className="text-[10px] font-medium">{MONTH_NAMES[month]}</span>
                <span className="text-[9px] text-muted-foreground">{completed}/{countableDays}</span>
                {pct > 0 && <span className="text-[9px] font-medium" style={{ color: habit.color }}>{pct}%</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-2 p-3" data-testid="widget-habit-tracker">
      {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}

      <div className="flex items-center justify-between gap-1 flex-wrap">
        <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <SelectTrigger className="w-[90px] text-xs" data-testid="select-view-mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-0.5">
          <Button size="sm" variant="ghost" onClick={() => navigateRef(-1)} data-testid="button-nav-prev">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <button
            onClick={() => setRefDate(new Date())}
            className="text-xs font-medium px-1.5 hover-elevate rounded"
            data-testid="button-nav-today"
          >
            {getNavLabel()}
          </button>
          <Button size="sm" variant="ghost" onClick={() => navigateRef(1)} data-testid="button-nav-next">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {habits.length > 1 && (
          <Select value={selectedHabitId || "all"} onValueChange={(v) => setSelectedHabitId(v === "all" ? null : v)}>
            <SelectTrigger className="w-[100px] text-xs" data-testid="select-habit-filter">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Habits</SelectItem>
              {habits.map(h => (
                <SelectItem key={h.id} value={h.id}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                    {h.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {habits.length === 0 && !isLoading && !showAdd && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Flame className="h-8 w-8 opacity-40" />
          <div className="text-sm">Start tracking your habits</div>
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} data-testid="button-add-first-habit">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Habit
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3">
        {displayHabits.map((habit) => {
          const streak = getStreak(habit.id);
          const periodStreak = getPeriodStreak(habit.id);
          const periodTotal = getPeriodTotal(habit.id);
          const longestStreak = getLongestStreak(habit.id);
          const milestone = getStreakMilestone(streak);
          const completionRate = getCompletionRate(habit.id, 30);
          const isEditing = editingHabitId === habit.id;

          return (
            <div key={habit.id} className="space-y-1.5" data-testid={`habit-${habit.id}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
                  {isEditing ? (
                    <form
                      className="flex items-center gap-1 flex-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (editName.trim()) {
                          updateHabit.mutate({ id: habit.id, updates: { name: editName.trim(), color: editColor } });
                        }
                      }}
                    >
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-xs flex-1"
                        autoFocus
                        data-testid={`input-edit-habit-${habit.id}`}
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className="w-5 h-5 rounded-full border border-border shrink-0"
                            style={{ backgroundColor: editColor }}
                            data-testid={`button-color-picker-${habit.id}`}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align="start">
                          <div className="flex gap-1 flex-wrap">
                            {HABIT_COLORS.map(c => (
                              <button
                                key={c}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${editColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                                style={{ backgroundColor: c }}
                                onClick={() => setEditColor(c)}
                              />
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button type="submit" size="sm" data-testid={`button-save-edit-${habit.id}`}>
                        Save
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditingHabitId(null)}>
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <span className="text-sm font-medium truncate">{habit.name}</span>
                  )}
                </div>
                {!isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5" data-testid={`badge-total-${habit.id}`}>
                      <Check className="h-3 w-3" style={{ color: habit.color }} />
                      {periodTotal}d
                    </Badge>
                    {periodStreak > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5" data-testid={`badge-streak-${habit.id}`}>
                        <Flame className="h-3 w-3" style={{ color: habit.color }} />
                        {periodStreak}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingHabitId(habit.id);
                        setEditName(habit.name);
                        setEditColor(habit.color);
                      }}
                      data-testid={`button-edit-habit-${habit.id}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteHabit.mutate(habit.id)}
                      data-testid={`button-delete-habit-${habit.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {milestone && (
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium"
                  style={{ backgroundColor: habit.color + "15", color: habit.color }}
                  data-testid={`milestone-${habit.id}`}
                >
                  <milestone.icon className="h-3.5 w-3.5" />
                  {milestone.message}
                </div>
              )}

              {viewMode === "week" && renderWeekView(habit)}
              {viewMode === "month" && renderMonthView(habit)}
              {viewMode === "year" && renderYearView(habit)}

              <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-0.5 flex-wrap">
                <span data-testid={`stat-streak-${habit.id}`}>Streak: {streak}d</span>
                <span data-testid={`stat-best-${habit.id}`}>Best: {longestStreak}d</span>
                <span data-testid={`stat-rate-${habit.id}`}>30d: {completionRate}%</span>
              </div>
            </div>
          );
        })}
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
