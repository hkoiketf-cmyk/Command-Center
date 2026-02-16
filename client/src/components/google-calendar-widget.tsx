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
  const srcMatch = input.match(/src="([^"]+)"/);
  if (srcMatch) return srcMatch[1];
  if (input.includes("calendar.google.com")) {
    let url = input.trim();
    if (!url.startsWith("http")) url = "https://" + url;
    return url;
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
  const [inputValue, setInputValue] = useState("");
  const [view, setView] = useState<CalendarView>("week");
  const [showSetup, setShowSetup] = useState(!content.calendarUrl);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = extractCalendarSrc(inputValue);
    if (url) {
      onContentChange({ calendarUrl: url });
      setShowSetup(false);
      setError("");
    } else {
      setError("Could not find a valid Google Calendar URL. Please paste the embed code or sharing URL from Google Calendar.");
    }
  };

  if (showSetup || !content.calendarUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-4" data-testid="calendar-setup">
        <Calendar className="h-10 w-10 text-muted-foreground" />
        <div className="text-center space-y-1">
          <div className="text-sm font-medium">Connect Your Google Calendar</div>
          <div className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">
            Go to Google Calendar Settings, find your calendar under "Integrate calendar", copy the embed code or public URL, and paste it below.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-2 max-w-[320px]">
          <Input
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setError(""); }}
            placeholder="Paste embed code or calendar URL..."
            className="text-sm"
            autoFocus
            data-testid="input-calendar-url"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" size="sm" className="w-full" disabled={!inputValue.trim()} data-testid="button-connect-calendar">
            Connect Calendar
          </Button>
        </form>

        <div className="text-[11px] text-muted-foreground max-w-[280px] space-y-1">
          <p className="font-medium">How to get your embed URL:</p>
          <ol className="list-decimal pl-4 space-y-0.5">
            <li>Open Google Calendar on the web</li>
            <li>Click the gear icon, then "Settings"</li>
            <li>Select your calendar on the left</li>
            <li>Scroll to "Integrate calendar"</li>
            <li>Copy the "Embed code" or "Public URL"</li>
          </ol>
        </div>
      </div>
    );
  }

  const calendarSrc = buildCalendarUrl(content.calendarUrl, view);

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
