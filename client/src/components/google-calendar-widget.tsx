import { useState } from "react";
import { Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CalendarView = "day" | "week" | "month" | "agenda";

interface GoogleCalendarContent {
  calendarUrl?: string;
}

function extractCalendarSrc(input: string): string | null {
  if (!input.trim()) return null;
  const trimmed = input.trim();

  const srcMatch = trimmed.match(/src="([^"]+)"/);
  if (srcMatch) return srcMatch[1];

  const emailMatch = trimmed.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  if (emailMatch) {
    return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(trimmed)}`;
  }

  let url = trimmed;
  if (!url.startsWith("http")) url = "https://" + url;

  if (url.includes("calendar.google.com")) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname.includes("/embed")) {
        return url;
      }
      if (parsed.pathname.includes("/r") || parsed.pathname.includes("/b/")) {
        const srcParam = parsed.searchParams.get("src") || parsed.searchParams.get("cid");
        if (srcParam) {
          return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(srcParam)}`;
        }
      }
      if (parsed.pathname.includes("/ical") || url.includes(".ics")) {
        const icalMatch = url.match(/calendar\/([^/]+)\//);
        if (icalMatch) {
          return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(icalMatch[1])}`;
        }
      }
      return url;
    } catch {
      return null;
    }
  }

  return null;
}

function buildCalendarUrl(baseUrl: string, view: CalendarView): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("mode", view === "day" ? "day" : view === "week" ? "WEEK" : view === "month" ? "MONTH" : "AGENDA");
    url.searchParams.set("showTitle", "0");
    url.searchParams.set("showNav", "1");
    url.searchParams.set("showDate", "1");
    url.searchParams.set("showPrint", "0");
    url.searchParams.set("showTabs", "0");
    url.searchParams.set("showCalendars", "0");
    url.searchParams.set("showTz", "0");
    return url.toString();
  } catch {
    return baseUrl;
  }
}

export function GoogleCalendarWidget({
  content,
  onContentChange,
}: {
  content: GoogleCalendarContent;
  onContentChange: (content: GoogleCalendarContent) => void;
}) {
  const safeContent = content || {};
  const [inputValue, setInputValue] = useState("");
  const [view, setView] = useState<CalendarView>("week");
  const [showSetup, setShowSetup] = useState(!safeContent.calendarUrl);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = extractCalendarSrc(inputValue);
    if (url) {
      onContentChange({ calendarUrl: url });
      setShowSetup(false);
      setError("");
    } else {
      setError("Could not find a valid Google Calendar URL. Try pasting the embed code from Google Calendar settings, or your calendar's email address (e.g. example@gmail.com).");
    }
  };

  if (showSetup || !safeContent.calendarUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4" data-testid="calendar-setup">
        <Calendar className="h-10 w-10 text-muted-foreground" />
        <div className="text-center space-y-1">
          <div className="text-sm font-medium">Connect Your Google Calendar</div>
          <div className="text-xs text-muted-foreground max-w-[300px] leading-relaxed">
            Paste your calendar's embed code, public URL, or email address below.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-2 max-w-[320px]">
          <Input
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setError(""); }}
            placeholder="Paste embed code, URL, or email..."
            className="text-sm"
            autoFocus
            data-testid="input-calendar-url"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" size="sm" className="w-full" disabled={!inputValue.trim()} data-testid="button-connect-calendar">
            Connect Calendar
          </Button>
        </form>

        <div className="text-[11px] text-muted-foreground max-w-[300px] space-y-2">
          <div className="space-y-1">
            <p className="font-medium">How to get your embed URL:</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Open Google Calendar on the web</li>
              <li>Click the gear icon, then "Settings"</li>
              <li>Select your calendar on the left</li>
              <li>Scroll to "Integrate calendar"</li>
              <li>Copy the "Embed code" or "Public URL"</li>
            </ol>
          </div>
          <div className="p-2 rounded-md bg-muted/50 border border-border">
            <p className="font-medium">Important:</p>
            <p>Your calendar must be set to <strong>public</strong> for the embed to display. In Settings, check "Make available to public" under "Access permissions".</p>
          </div>
          <div className="space-y-0.5">
            <p className="font-medium">You can also paste:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Your Google account email (e.g. you@gmail.com)</li>
              <li>A calendar sharing or public URL</li>
              <li>The full &lt;iframe&gt; embed code</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const calendarSrc = buildCalendarUrl(safeContent.calendarUrl!, view);

  return (
    <div className="flex flex-col h-full" data-testid="widget-google-calendar">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border shrink-0">
        <Select value={view} onValueChange={(v) => setView(v as CalendarView)}>
          <SelectTrigger className="w-[100px] h-7 text-xs" data-testid="select-calendar-view">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="agenda">Agenda</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => window.open("https://calendar.google.com", "_blank")}
            data-testid="button-open-gcal"
          >
            <ExternalLink className="h-3 w-3 mr-1" /> Open
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowSetup(true)}
            data-testid="button-change-calendar"
          >
            Change
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <iframe
          src={calendarSrc}
          className="w-full h-full border-0"
          title="Google Calendar"
          sandbox="allow-scripts allow-same-origin allow-popups"
          data-testid="iframe-google-calendar"
        />
      </div>
    </div>
  );
}
