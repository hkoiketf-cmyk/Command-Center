import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Meeting } from "@shared/schema";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function MeetingPrepWidget() {
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPerson, setNewPerson] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState("");

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({ queryKey: ["/api/meetings"] });

  const createMeeting = useMutation({
    mutationFn: (data: { title: string; person: string; date: string; time: string }) =>
      apiRequest("POST", "/api/meetings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      setNewTitle("");
      setNewPerson("");
      setNewTime("");
      setShowAdd(false);
    },
  });

  const updateMeeting = useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      apiRequest("PATCH", `/api/meetings/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/meetings"] }),
  });

  const deleteMeeting = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/meetings/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/meetings"] }),
  });

  const upcoming = meetings.filter((m) => !m.completed).sort((a, b) => a.date.localeCompare(b.date));
  const past = meetings.filter((m) => m.completed);

  const MeetingDetail = ({ meeting }: { meeting: Meeting }) => {
    const [objective, setObjective] = useState(meeting.objective || "");
    const [talkingPoints, setTalkingPoints] = useState<string[]>((meeting.talkingPoints as string[]) || []);
    const [desiredOutcome, setDesiredOutcome] = useState(meeting.desiredOutcome || "");
    const [notes, setNotes] = useState(meeting.notes || "");
    const [actionItems, setActionItems] = useState<string[]>((meeting.actionItems as string[]) || []);
    const [newTP, setNewTP] = useState("");
    const [newAI, setNewAI] = useState("");

    const save = (updates: any) => {
      updateMeeting.mutate({ id: meeting.id, ...updates });
    };

    return (
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Objective</label>
          <Input
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            onBlur={() => save({ objective })}
            placeholder="What's the goal of this meeting?"
            className="text-sm"
            data-testid={`input-meeting-objective-${meeting.id}`}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Talking Points</label>
          {talkingPoints.map((tp, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
              <span className="text-sm flex-1">{tp}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => {
                  const updated = talkingPoints.filter((_, j) => j !== i);
                  setTalkingPoints(updated);
                  save({ talkingPoints: updated });
                }}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            </div>
          ))}
          <form
            className="flex gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (newTP.trim()) {
                const updated = [...talkingPoints, newTP.trim()];
                setTalkingPoints(updated);
                save({ talkingPoints: updated });
                setNewTP("");
              }
            }}
          >
            <Input value={newTP} onChange={(e) => setNewTP(e.target.value)} placeholder="Add talking point" className="flex-1 text-sm" data-testid={`input-meeting-tp-${meeting.id}`} />
            <Button type="submit" size="sm" disabled={!newTP.trim()}>Add</Button>
          </form>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Desired Outcome</label>
          <Input
            value={desiredOutcome}
            onChange={(e) => setDesiredOutcome(e.target.value)}
            onBlur={() => save({ desiredOutcome })}
            placeholder="What does success look like?"
            className="text-sm"
            data-testid={`input-meeting-outcome-${meeting.id}`}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => save({ notes })}
            placeholder="Meeting notes..."
            className="text-sm min-h-[60px] resize-none"
            data-testid={`textarea-meeting-notes-${meeting.id}`}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Action Items</label>
          {actionItems.map((ai, i) => (
            <div key={i} className="flex items-center gap-1">
              <Check className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1">{ai}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => {
                  const updated = actionItems.filter((_, j) => j !== i);
                  setActionItems(updated);
                  save({ actionItems: updated });
                }}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            </div>
          ))}
          <form
            className="flex gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (newAI.trim()) {
                const updated = [...actionItems, newAI.trim()];
                setActionItems(updated);
                save({ actionItems: updated });
                setNewAI("");
              }
            }}
          >
            <Input value={newAI} onChange={(e) => setNewAI(e.target.value)} placeholder="Add action item" className="flex-1 text-sm" data-testid={`input-meeting-ai-${meeting.id}`} />
            <Button type="submit" size="sm" disabled={!newAI.trim()}>Add</Button>
          </form>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => save({ completed: true })}
            data-testid={`button-complete-meeting-${meeting.id}`}
          >
            <Check className="h-3.5 w-3.5 mr-1" /> Mark Complete
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-3 p-3" data-testid="widget-meeting-prep">
      {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}

      {upcoming.length === 0 && !isLoading && !showAdd && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <div className="text-sm">No upcoming meetings</div>
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} data-testid="button-add-first-meeting">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Meeting
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {upcoming.map((meeting) => {
          const isExpanded = expandedId === meeting.id;
          return (
            <div key={meeting.id} className="p-2 rounded-md border border-border" data-testid={`meeting-${meeting.id}`}>
              <div className="flex items-center justify-between gap-2">
                <button className="flex-1 text-left min-w-0" onClick={() => setExpandedId(isExpanded ? null : meeting.id)}>
                  <div className="text-sm font-medium truncate">{meeting.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {meeting.person && `${meeting.person} · `}{formatDate(meeting.date)}{meeting.time && ` at ${meeting.time}`}
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpandedId(isExpanded ? null : meeting.id)}>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMeeting.mutate(meeting.id)} data-testid={`button-delete-meeting-${meeting.id}`}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {isExpanded && <MeetingDetail meeting={meeting} />}
            </div>
          );
        })}

        {past.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground mb-1">Past ({past.length})</div>
            {past.slice(0, 3).map((m) => (
              <div key={m.id} className="flex items-center gap-2 py-1 opacity-50">
                <Check className="h-3 w-3 shrink-0" />
                <span className="text-xs truncate">{m.title} - {formatDate(m.date)}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto shrink-0" onClick={() => deleteMeeting.mutate(m.id)}>
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {upcoming.length > 0 && !showAdd && (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setShowAdd(true)} data-testid="button-add-meeting">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Meeting
        </Button>
      )}

      {showAdd && (
        <form
          className="space-y-2 border-t border-border pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (newTitle.trim()) createMeeting.mutate({ title: newTitle.trim(), person: newPerson.trim(), date: newDate, time: newTime });
          }}
        >
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Meeting title" autoFocus data-testid="input-meeting-title" />
          <Input value={newPerson} onChange={(e) => setNewPerson(e.target.value)} placeholder="With whom?" data-testid="input-meeting-person" />
          <div className="flex gap-2">
            <Input value={newDate} onChange={(e) => setNewDate(e.target.value)} type="date" className="flex-1" data-testid="input-meeting-date" />
            <Input value={newTime} onChange={(e) => setNewTime(e.target.value)} type="time" className="flex-1" data-testid="input-meeting-time" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!newTitle.trim()} data-testid="button-confirm-meeting">Add</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setShowAdd(false); setNewTitle(""); setNewPerson(""); setNewTime(""); }}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}
