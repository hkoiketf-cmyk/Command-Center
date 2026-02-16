import { useState } from "react";
import { Calendar, ExternalLink, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GoogleCalendarContent {
  calendarUrl?: string;
  calendarId?: string;
  useApi?: boolean;
  embedMode?: "default" | "custom";
  customEmbedUrl?: string;
  viewMode?: string;
}

const VIEW_MODES = [
  { value: "WEEK", label: "Week" },
  { value: "MONTH", label: "Month" },
  { value: "AGENDA", label: "Agenda" },
];

function buildEmbedUrl(calendarId?: string, viewMode?: string): string {
  const base = "https://calendar.google.com/calendar/embed";
  const params = new URLSearchParams();
  params.set("showTitle", "0");
  params.set("showNav", "1");
  params.set("showDate", "1");
  params.set("showPrint", "0");
  params.set("showTabs", "1");
  params.set("showCalendars", "0");
  params.set("showTz", "0");
  if (calendarId) {
    params.set("src", calendarId);
  }
  if (viewMode) {
    params.set("mode", viewMode);
  }
  return `${base}?${params.toString()}`;
}

function SetupView({
  content,
  onContentChange,
}: {
  content: GoogleCalendarContent;
  onContentChange: (content: GoogleCalendarContent) => void;
}) {
  const [calendarEmail, setCalendarEmail] = useState(content.calendarId || "");
  const [customUrl, setCustomUrl] = useState(content.customEmbedUrl || "");
  const [mode, setMode] = useState<"email" | "url">(content.embedMode === "custom" ? "url" : "email");

  function handleConnect() {
    if (mode === "email" && calendarEmail.trim()) {
      onContentChange({
        ...content,
        calendarId: calendarEmail.trim(),
        embedMode: "default",
        customEmbedUrl: undefined,
      });
    } else if (mode === "url" && customUrl.trim()) {
      onContentChange({
        ...content,
        embedMode: "custom",
        customEmbedUrl: customUrl.trim(),
        calendarId: undefined,
      });
    }
  }

  function handleUseDefault() {
    onContentChange({
      ...content,
      embedMode: "default",
      calendarId: undefined,
      customEmbedUrl: undefined,
    });
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-4" data-testid="calendar-setup">
      <Calendar className="h-10 w-10 text-muted-foreground" />
      <div className="text-center space-y-1">
        <p className="text-sm font-medium">Google Calendar</p>
        <p className="text-xs text-muted-foreground max-w-[300px]">
          Set up your personal Google Calendar. Use "Default" to sign in with your Google account directly, or enter your calendar details below.
        </p>
      </div>

      <div className="w-full max-w-[320px] space-y-3">
        <div className="flex gap-2">
          <Button
            variant={mode === "email" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("email")}
            className="flex-1"
            data-testid="button-mode-email"
          >
            Calendar ID
          </Button>
          <Button
            variant={mode === "url" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("url")}
            className="flex-1"
            data-testid="button-mode-url"
          >
            Embed URL
          </Button>
        </div>

        {mode === "email" ? (
          <div className="space-y-2">
            <Input
              placeholder="your.email@gmail.com"
              value={calendarEmail}
              onChange={(e) => setCalendarEmail(e.target.value)}
              className="text-xs"
              data-testid="input-calendar-email"
            />
            <p className="text-[10px] text-muted-foreground">
              Enter your Google Calendar ID (usually your Gmail address). Your calendar must be set to public or you'll need to use the embed URL option.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              placeholder="https://calendar.google.com/calendar/embed?src=..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="text-xs"
              data-testid="input-calendar-url"
            />
            <p className="text-[10px] text-muted-foreground">
              Paste your Google Calendar embed URL. Go to Google Calendar Settings &gt; your calendar &gt; "Integrate calendar" &gt; copy the embed code URL.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={(mode === "email" && !calendarEmail.trim()) || (mode === "url" && !customUrl.trim())}
            data-testid="button-connect-calendar"
          >
            Connect Calendar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUseDefault}
            data-testid="button-use-default-calendar"
          >
            Use Default (sign in via Google)
          </Button>
        </div>
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
  const [showSetup, setShowSetup] = useState(false);
  const viewMode = safeContent.viewMode || "WEEK";

  const hasConfig = safeContent.embedMode === "custom" || safeContent.calendarId || safeContent.embedMode === "default";

  if (!hasConfig || showSetup) {
    return (
      <SetupView
        content={safeContent}
        onContentChange={(newContent) => {
          onContentChange(newContent);
          setShowSetup(false);
        }}
      />
    );
  }

  let embedUrl: string;
  if (safeContent.embedMode === "custom" && safeContent.customEmbedUrl) {
    embedUrl = safeContent.customEmbedUrl;
  } else {
    embedUrl = buildEmbedUrl(safeContent.calendarId, viewMode);
  }

  return (
    <div className="flex flex-col h-full" data-testid="widget-google-calendar">
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 border-b border-border shrink-0 flex-wrap">
        <div className="flex items-center gap-1">
          {safeContent.embedMode !== "custom" && (
            <Select value={viewMode} onValueChange={(v) => onContentChange({ ...safeContent, viewMode: v })}>
              <SelectTrigger className="w-[80px] h-6 text-[10px]" data-testid="select-calendar-view">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIEW_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSetup(true)}
            data-testid="button-calendar-settings"
          >
            <Settings2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open("https://calendar.google.com", "_blank")}
            data-testid="button-open-gcal"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          title="Google Calendar"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          data-testid="calendar-iframe"
        />
      </div>
    </div>
  );
}
