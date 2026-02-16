import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronLeft, ChevronRight, ExternalLink, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type CalendarView = "day" | "week" | "month" | "agenda";

interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  colorId?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
}

interface CalendarListItem {
  id: string;
  summary: string;
  backgroundColor?: string;
  primary?: boolean;
}

interface GoogleCalendarContent {
  calendarUrl?: string;
  calendarId?: string;
  useApi?: boolean;
}

const EVENT_COLORS: Record<string, string> = {
  "1": "#7986CB", "2": "#33B679", "3": "#8E24AA", "4": "#E67C73",
  "5": "#F6BF26", "6": "#F4511E", "7": "#039BE5", "8": "#616161",
  "9": "#3F51B5", "10": "#0B8043", "11": "#D50000",
};

function getTimeRange(view: CalendarView, baseDate: Date) {
  const start = new Date(baseDate);
  const end = new Date(baseDate);

  if (view === "day") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (view === "week") {
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (view === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  } else {
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 14);
    end.setHours(23, 59, 59, 999);
  }

  return { timeMin: start.toISOString(), timeMax: end.toISOString(), start, end };
}

function formatEventTime(event: CalendarEvent): string {
  const startStr = event.start?.dateTime || event.start?.date;
  const endStr = event.end?.dateTime || event.end?.date;
  if (!startStr) return "";

  if (event.start?.date && !event.start?.dateTime) {
    return "All day";
  }

  const startDate = new Date(startStr);
  const endDate = endStr ? new Date(endStr) : null;
  const timeOpts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true };

  if (endDate) {
    return `${startDate.toLocaleTimeString([], timeOpts)} - ${endDate.toLocaleTimeString([], timeOpts)}`;
  }
  return startDate.toLocaleTimeString([], timeOpts);
}

function navigateDate(date: Date, view: CalendarView, direction: number): Date {
  const d = new Date(date);
  if (view === "day") d.setDate(d.getDate() + direction);
  else if (view === "week") d.setDate(d.getDate() + direction * 7);
  else if (view === "month") d.setMonth(d.getMonth() + direction);
  else d.setDate(d.getDate() + direction * 14);
  return d;
}

function getDateLabel(date: Date, view: CalendarView): string {
  if (view === "day") {
    return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  } else if (view === "week") {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString([], { month: "short", day: "numeric" })} - ${end.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`;
  } else if (view === "month") {
    return date.toLocaleDateString([], { month: "long", year: "numeric" });
  }
  return `Next 2 weeks`;
}

function groupEventsByDate(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const groups: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const startStr = event.start?.dateTime || event.start?.date;
    if (!startStr) continue;
    const dateKey = new Date(startStr).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(event);
  }
  return groups;
}

function EventItem({ event }: { event: CalendarEvent }) {
  const color = event.colorId ? EVENT_COLORS[event.colorId] : "#039BE5";
  const isAllDay = event.start?.date && !event.start?.dateTime;

  return (
    <div
      className="flex items-start gap-2 py-1.5 px-2 rounded-md hover-elevate cursor-default"
      data-testid={`event-item-${event.id}`}
      onClick={() => event.htmlLink && window.open(event.htmlLink, "_blank")}
    >
      <div
        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{event.summary || "(No title)"}</p>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          {isAllDay ? "All day" : formatEventTime(event)}
        </p>
        {event.location && (
          <p className="text-[10px] text-muted-foreground truncate">{event.location}</p>
        )}
      </div>
    </div>
  );
}

function AgendaView({ events }: { events: CalendarEvent[] }) {
  const grouped = groupEventsByDate(events);
  const dateKeys = Object.keys(grouped);

  if (dateKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 p-4">
        <Calendar className="h-8 w-8" />
        <p className="text-xs">No events in this period</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-3 overflow-auto h-full">
      {dateKeys.map(dateKey => (
        <div key={dateKey}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-1 border-b border-border mb-1">
            {dateKey}
          </p>
          <div className="space-y-0.5">
            {grouped[dateKey].map(event => (
              <EventItem key={event.id} event={event} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DayView({ events, date }: { events: CalendarEvent[]; date: Date }) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 6);
  const dayEvents = events.filter(e => {
    const startStr = e.start?.dateTime || e.start?.date;
    if (!startStr) return false;
    const eventDate = new Date(startStr);
    return eventDate.toDateString() === date.toDateString();
  });

  const allDayEvents = dayEvents.filter(e => e.start?.date && !e.start?.dateTime);
  const timedEvents = dayEvents.filter(e => e.start?.dateTime);

  return (
    <div className="overflow-auto h-full">
      {allDayEvents.length > 0 && (
        <div className="px-2 py-1 border-b border-border bg-muted/30">
          <p className="text-[10px] text-muted-foreground font-medium mb-1">All Day</p>
          {allDayEvents.map(event => (
            <EventItem key={event.id} event={event} />
          ))}
        </div>
      )}
      <div className="relative">
        {hours.map(hour => {
          const hourEvents = timedEvents.filter(e => {
            const h = new Date(e.start!.dateTime!).getHours();
            return h === hour;
          });
          return (
            <div key={hour} className="flex border-b border-border/50 min-h-[40px]">
              <div className="w-12 shrink-0 text-[10px] text-muted-foreground text-right pr-2 pt-1">
                {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
              </div>
              <div className="flex-1 border-l border-border/50 pl-1">
                {hourEvents.map(event => (
                  <EventItem key={event.id} event={event} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GoogleCalendarWidget({
  content,
  onContentChange,
}: {
  content: GoogleCalendarContent;
  onContentChange: (content: GoogleCalendarContent) => void;
}) {
  const safeContent = content || {};
  const [view, setView] = useState<CalendarView>("agenda");
  const [currentDate, setCurrentDate] = useState(new Date());

  const calendarId = safeContent.calendarId || "primary";

  const { timeMin, timeMax } = useMemo(
    () => getTimeRange(view, currentDate),
    [view, currentDate]
  );

  const calendarsQuery = useQuery<CalendarListItem[]>({
    queryKey: ["/api/google-calendar/calendars"],
  });

  const eventsQuery = useQuery<CalendarEvent[]>({
    queryKey: ["/api/google-calendar/events", calendarId, timeMin, timeMax],
    queryFn: async () => {
      const params = new URLSearchParams({ calendarId, timeMin, timeMax });
      const res = await fetch(`/api/google-calendar/events?${params}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const isLoading = calendarsQuery.isLoading || eventsQuery.isLoading;
  const hasError = calendarsQuery.isError || eventsQuery.isError;
  const errorMsg = (calendarsQuery.error as Error)?.message || (eventsQuery.error as Error)?.message || "Connection error";

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-4" data-testid="calendar-error">
        <Calendar className="h-10 w-10 text-muted-foreground" />
        <div className="text-center space-y-1">
          <p className="text-sm font-medium">Google Calendar</p>
          <p className="text-xs text-muted-foreground max-w-[280px]">
            {errorMsg.includes("not connected") || errorMsg.includes("not configured")
              ? "Google Calendar is not connected. Please set up the Google Calendar integration in the Replit tools panel."
              : `Unable to load calendar: ${errorMsg}`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { calendarsQuery.refetch(); eventsQuery.refetch(); }}
          data-testid="button-retry-calendar"
        >
          <RefreshCw className="h-3 w-3 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  const events = eventsQuery.data || [];
  const calendars = calendarsQuery.data || [];

  return (
    <div className="flex flex-col h-full" data-testid="widget-google-calendar">
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 border-b border-border shrink-0 flex-wrap">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCurrentDate(navigateDate(currentDate, view, -1))}
            data-testid="button-calendar-prev"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[11px] h-6 px-2"
            onClick={() => setCurrentDate(new Date())}
            data-testid="button-calendar-today"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCurrentDate(navigateDate(currentDate, view, 1))}
            data-testid="button-calendar-next"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <p className="text-[11px] font-medium text-center flex-1 min-w-0 truncate" data-testid="text-calendar-date">
          {getDateLabel(currentDate, view)}
        </p>

        <div className="flex items-center gap-1">
          {calendars.length > 1 && (
            <Select value={calendarId} onValueChange={(v) => onContentChange({ ...safeContent, calendarId: v, useApi: true })}>
              <SelectTrigger className="w-[90px] h-6 text-[10px]" data-testid="select-calendar-id">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((cal) => (
                  <SelectItem key={cal.id} value={cal.id}>
                    {cal.summary}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={view} onValueChange={(v) => setView(v as CalendarView)}>
            <SelectTrigger className="w-[80px] h-6 text-[10px]" data-testid="select-calendar-view">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="agenda">Agenda</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => window.open("https://calendar.google.com", "_blank")}
            data-testid="button-open-gcal"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : view === "day" ? (
          <DayView events={events} date={currentDate} />
        ) : (
          <AgendaView events={events} />
        )}
      </div>

      {!isLoading && events.length > 0 && (
        <div className="px-2 py-1 border-t border-border shrink-0">
          <p className="text-[10px] text-muted-foreground">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
