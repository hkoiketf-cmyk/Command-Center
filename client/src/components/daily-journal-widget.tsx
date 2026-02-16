import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

export function DailyJournalWidget() {
  const today = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [content, setContent] = useState("");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: entries = [] } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal"],
  });

  const { data: currentEntry } = useQuery<JournalEntry | null>({
    queryKey: ["/api/journal", selectedDate],
  });

  useEffect(() => {
    setContent(currentEntry?.content || "");
  }, [currentEntry, selectedDate]);

  const saveMutation = useMutation({
    mutationFn: (data: { date: string; content: string }) =>
      apiRequest("PUT", "/api/journal", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal", selectedDate] });
    },
  });

  const handleChange = useCallback((value: string) => {
    setContent(value);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveMutation.mutate({ date: selectedDate, content: value });
    }, 800);
  }, [selectedDate]);

  const navigateDay = (dir: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + dir);
    setSelectedDate(formatDate(d));
  };

  const isToday = selectedDate === today;
  const hasEntries = entries.filter((e) => e.content.trim()).length;

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

      <Textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="What happened today? What did you learn? What's on your mind?"
        className="flex-1 resize-none text-sm min-h-[120px]"
        data-testid="textarea-journal"
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{hasEntries} entr{hasEntries !== 1 ? "ies" : "y"} total</span>
        {saveMutation.isPending && <span>Saving...</span>}
      </div>
    </div>
  );
}
