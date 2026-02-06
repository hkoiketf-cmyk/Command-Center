import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, RotateCcw, X, Plus } from "lucide-react";
import type { FocusContract } from "@shared/schema";

interface ContextModeWidgetProps {
  desktopId: string;
  desktopName: string;
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function ContextModeWidget({ desktopId, desktopName }: ContextModeWidgetProps) {
  const date = getTodayDate();

  const { data: contract, isLoading } = useQuery<FocusContract | null>({
    queryKey: ["/api/focus-contracts", desktopId, date],
    queryFn: async () => {
      const res = await fetch(`/api/focus-contracts?desktopId=${desktopId}&date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const [objective, setObjective] = useState("");
  const [top3, setTop3] = useState<{ text: string; done: boolean }[]>([
    { text: "", done: false },
    { text: "", done: false },
    { text: "", done: false },
  ]);
  const [ignoreList, setIgnoreList] = useState<string[]>([]);
  const [ignoreInput, setIgnoreInput] = useState("");
  const [exitCondition, setExitCondition] = useState("");
  const [timeboxMinutes, setTimeboxMinutes] = useState<number | null>(null);

  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (contract) {
      setObjective(contract.objective || "");
      setTop3(
        (contract.top3 as { text: string; done: boolean }[]) || [
          { text: "", done: false },
          { text: "", done: false },
          { text: "", done: false },
        ]
      );
      setIgnoreList((contract.ignoreList as string[]) || []);
      setExitCondition(contract.exitCondition || "");
      setTimeboxMinutes(contract.timeboxMinutes ?? null);
    }
  }, [contract]);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const saveMutation = useMutation({
    mutationFn: async (data: {
      objective: string;
      top3: { text: string; done: boolean }[];
      ignoreList: string[];
      exitCondition: string;
      timeboxMinutes: number | null;
    }) => {
      return apiRequest("PUT", "/api/focus-contracts", {
        desktopId,
        date,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/focus-contracts", desktopId, date] });
    },
  });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(
    (data: {
      objective: string;
      top3: { text: string; done: boolean }[];
      ignoreList: string[];
      exitCondition: string;
      timeboxMinutes: number | null;
    }) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveMutation.mutate(data);
      }, 600);
    },
    [saveMutation]
  );

  const triggerSave = useCallback(
    (overrides?: Partial<{
      objective: string;
      top3: { text: string; done: boolean }[];
      ignoreList: string[];
      exitCondition: string;
      timeboxMinutes: number | null;
    }>) => {
      debouncedSave({
        objective: overrides?.objective ?? objective,
        top3: overrides?.top3 ?? top3,
        ignoreList: overrides?.ignoreList ?? ignoreList,
        exitCondition: overrides?.exitCondition ?? exitCondition,
        timeboxMinutes: overrides?.timeboxMinutes !== undefined ? overrides.timeboxMinutes : timeboxMinutes,
      });
    },
    [objective, top3, ignoreList, exitCondition, timeboxMinutes, debouncedSave]
  );

  const handleObjectiveChange = (val: string) => {
    setObjective(val);
    triggerSave({ objective: val });
  };

  const handleTop3TextChange = (index: number, text: string) => {
    const updated = [...top3];
    updated[index] = { ...updated[index], text };
    setTop3(updated);
    triggerSave({ top3: updated });
  };

  const handleTop3DoneChange = (index: number, done: boolean) => {
    const updated = [...top3];
    updated[index] = { ...updated[index], done };
    setTop3(updated);
    triggerSave({ top3: updated });
  };

  const handleExitConditionChange = (val: string) => {
    setExitCondition(val);
    triggerSave({ exitCondition: val });
  };

  const handleAddIgnoreItem = () => {
    if (ignoreInput.trim()) {
      const updated = [...ignoreList, ignoreInput.trim()];
      setIgnoreList(updated);
      setIgnoreInput("");
      triggerSave({ ignoreList: updated });
    }
  };

  const handleRemoveIgnoreItem = (index: number) => {
    const updated = ignoreList.filter((_, i) => i !== index);
    setIgnoreList(updated);
    triggerSave({ ignoreList: updated });
  };

  const handleTimeboxSelect = (minutes: number) => {
    const newVal = timeboxMinutes === minutes ? null : minutes;
    setTimeboxMinutes(newVal);
    setElapsed(0);
    setTimerRunning(false);
    triggerSave({ timeboxMinutes: newVal });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const totalSeconds = (timeboxMinutes || 0) * 60;
  const remaining = Math.max(0, totalSeconds - elapsed);
  const progress = totalSeconds > 0 ? Math.min(1, elapsed / totalSeconds) : 0;
  const allDone = top3.every((item) => item.done);
  const timeUp = timeboxMinutes !== null && remaining === 0 && elapsed > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm" data-testid="context-mode-loading">
        Loading...
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4 h-full draggable-cancel"
      onMouseDown={(e) => e.stopPropagation()}
      data-testid="context-mode-widget"
    >
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs uppercase tracking-wider" data-testid="context-mode-desktop-name">
          Active Context: {desktopName}
        </Badge>
        {allDone && (
          <Badge variant="default" className="text-xs bg-green-600" data-testid="badge-all-done">
            Complete
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Objective
        </label>
        <p className="text-[11px] text-muted-foreground/70 leading-tight">
          What would make today a win in this context?
        </p>
        <Textarea
          value={objective}
          onChange={(e) => handleObjectiveChange(e.target.value)}
          placeholder="If I did nothing else, this would still move things forward..."
          className="resize-none text-sm border-0 bg-muted/30 focus-visible:ring-1"
          rows={2}
          data-testid="input-objective"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Top 3 Actions
        </label>
        <p className="text-[11px] text-muted-foreground/70 leading-tight">
          No more, no less. If these are done, you're allowed to leave.
        </p>
        {top3.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Checkbox
              checked={item.done}
              onCheckedChange={(checked) => handleTop3DoneChange(index, !!checked)}
              data-testid={`checkbox-top3-${index}`}
            />
            <Input
              value={item.text}
              onChange={(e) => handleTop3TextChange(index, e.target.value)}
              placeholder="Action that directly supports the objective"
              className={`flex-1 text-sm border-0 bg-muted/30 focus-visible:ring-1 ${
                item.done ? "line-through text-muted-foreground" : ""
              }`}
              data-testid={`input-top3-${index}`}
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Ignore Today
        </label>
        <p className="text-[11px] text-muted-foreground/70 leading-tight">
          Things that feel productive but will dilute focus.
        </p>
        <div className="flex items-center gap-2">
          <Input
            value={ignoreInput}
            onChange={(e) => setIgnoreInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddIgnoreItem()}
            placeholder="e.g. Pricing tweaks, Tool cleanup, Inbox zero"
            className="flex-1 text-sm border-0 bg-muted/30 focus-visible:ring-1"
            data-testid="input-ignore-item"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleAddIgnoreItem}
            disabled={!ignoreInput.trim()}
            data-testid="button-add-ignore"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {ignoreList.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ignoreList.map((item, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs gap-1 cursor-pointer"
                onClick={() => handleRemoveIgnoreItem(index)}
                data-testid={`badge-ignore-${index}`}
              >
                {item}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Exit Condition
        </label>
        <p className="text-[11px] text-muted-foreground/70 leading-tight">
          When this is true, you can leave this context guilt-free.
        </p>
        <Input
          value={exitCondition}
          onChange={(e) => handleExitConditionChange(e.target.value)}
          placeholder="All 3 follow-ups sent"
          className="text-sm border-0 bg-muted/30 focus-visible:ring-1"
          data-testid="input-exit-condition"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Timebox
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {[30, 45, 60].map((mins) => (
            <Button
              key={mins}
              variant={timeboxMinutes === mins ? "default" : "outline"}
              size="sm"
              onClick={() => handleTimeboxSelect(mins)}
              data-testid={`button-timebox-${mins}`}
            >
              {mins}m
            </Button>
          ))}
        </div>
        {timeboxMinutes !== null && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  timeUp ? "bg-red-500" : "bg-primary"
                }`}
                style={{ width: `${progress * 100}%` }}
                data-testid="timebox-progress"
              />
            </div>
            <span className={`text-sm font-mono tabular-nums ${timeUp ? "text-red-500" : "text-muted-foreground"}`} data-testid="timebox-remaining">
              {formatTime(remaining)}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setTimerRunning(!timerRunning)}
                data-testid="button-timer-toggle"
              >
                {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setElapsed(0);
                  setTimerRunning(false);
                }}
                data-testid="button-timer-reset"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
