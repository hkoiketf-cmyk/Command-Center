import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { JournalEntry } from "@shared/schema";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function displayDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function formatTime(createdAt: string): string {
  try {
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return "";
  }
}

export function DailyJournalWidget() {
  const today = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [content, setContent] = useState("");

  const { data: allEntries = [] } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal"],
  });

  const { data: dateEntries = [] } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal", selectedDate],
  });

  const createMutation = useMutation({
    mutationFn: (data: { date: string; content: string }) =>
      apiRequest("POST", "/api/journal", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal", selectedDate] });
      setContent("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/journal/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal", selectedDate] });
    },
  });

  const handleSubmit = () => {
    if (content.trim()) {
      createMutation.mutate({ date: selectedDate, content: content.trim() });
    }
  };

  const navigateDay = (dir: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + dir);
    setSelectedDate(formatDate(d));
  };

  const isToday = selectedDate === today;
  const totalEntries = allEntries.filter((e) => e.content.trim()).length;

  return (
    <div className="flex flex-col h-full gap-2 p-3" data-testid="widget-daily-journal">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigateDay(-1)} data-testid="button-journal-prev">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <div className="text-sm font-medium">{displayDate(selectedDate)}</div>
          {isToday && <div className="text-xs text-primary">Today</div>}
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigateDay(1)} disabled={isToday} data-testid="button-journal-next">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {dateEntries.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-3">
            No entries for this day yet.
          </div>
        )}
        {dateEntries.map((entry) => (
          <div
            key={entry.id}
            className="group relative rounded-md border border-border p-2.5 text-sm"
            data-testid={`journal-entry-${entry.id}`}
          >
            <div className="whitespace-pre-wrap break-words">{entry.content}</div>
            <div className="flex items-center justify-between gap-2 mt-1.5">
              <span className="text-[10px] text-muted-foreground">{formatTime(entry.createdAt)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="invisible group-hover:visible"
                onClick={() => deleteMutation.mutate(entry.id)}
                data-testid={`button-delete-journal-${entry.id}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-end">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What happened today? What did you learn?"
          className="flex-1 resize-none text-sm min-h-[60px] max-h-[120px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          data-testid="textarea-journal"
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!content.trim() || createMutation.isPending}
          data-testid="button-submit-journal"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{dateEntries.length} entr{dateEntries.length !== 1 ? "ies" : "y"} today</span>
        <span>{totalEntries} total</span>
      </div>
    </div>
  );
}
