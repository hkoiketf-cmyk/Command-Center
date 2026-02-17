import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { TimerContent } from "@shared/schema";

const SOUNDS: { id: string; label: string; frequency: number; pattern: number[] }[] = [
  { id: "beep", label: "Beep", frequency: 880, pattern: [200, 100, 200, 100, 200] },
  { id: "chime", label: "Chime", frequency: 523, pattern: [400, 200, 400] },
  { id: "alarm", label: "Alarm", frequency: 660, pattern: [150, 75, 150, 75, 150, 75, 150] },
  { id: "bell", label: "Bell", frequency: 440, pattern: [600, 300, 600] },
  { id: "pulse", label: "Pulse", frequency: 350, pattern: [100, 50, 100, 50, 100, 300, 100, 50, 100, 50, 100] },
];

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new AudioContext();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

function playSoundOnce(soundId: string) {
  const sound = SOUNDS.find((s) => s.id === soundId) || SOUNDS[0];
  const ctx = getAudioContext();

  let time = ctx.currentTime;
  for (let i = 0; i < sound.pattern.length; i++) {
    const duration = sound.pattern[i] / 1000;
    if (i % 2 === 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = sound.frequency;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
      osc.start(time);
      osc.stop(time + duration);
    }
    time += duration;
  }
}

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function showTimerNotification() {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification("Timer Complete", {
        body: "Your countdown timer has finished!",
        icon: "/favicon.ico",
        requireInteraction: true,
      });
    } catch (_e) {}
  }
}

function padNum(n: number): string {
  return String(n).padStart(2, "0");
}

interface TimerWidgetProps {
  content: TimerContent;
  onContentChange: (content: TimerContent) => void;
}

export function TimerWidget({ content, onContentChange }: TimerWidgetProps) {
  const mode = content.mode ?? "countdown";
  const initialH = content.hours ?? 0;
  const initialM = content.minutes ?? 5;
  const initialS = content.seconds ?? 0;
  const selectedSound = content.sound ?? "beep";

  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsMode, setSettingsMode] = useState(mode);
  const [settingsH, setSettingsH] = useState(String(initialH));
  const [settingsM, setSettingsM] = useState(String(initialM));
  const [settingsS, setSettingsS] = useState(String(initialS));
  const [settingsSound, setSettingsSound] = useState(selectedSound);
  const [hasFinished, setHasFinished] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startTimeRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);

  const totalCountdownSeconds = initialH * 3600 + initialM * 60 + initialS;

  const clearSoundTimeouts = useCallback(() => {
    soundTimeoutsRef.current.forEach(clearTimeout);
    soundTimeoutsRef.current = [];
  }, []);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopInterval();
      clearSoundTimeouts();
    };
  }, [stopInterval, clearSoundTimeouts]);

  const playRepeatingSound = (soundId: string) => {
    clearSoundTimeouts();
    playSoundOnce(soundId);
    const t1 = setTimeout(() => playSoundOnce(soundId), 1500);
    const t2 = setTimeout(() => playSoundOnce(soundId), 3000);
    soundTimeoutsRef.current = [t1, t2];
  };

  const startTimer = () => {
    if (mode === "countdown" && totalCountdownSeconds === 0) return;
    getAudioContext();
    requestNotificationPermission();
    setHasFinished(false);
    setShowAlert(false);
    startTimeRef.current = Date.now();
    pausedElapsedRef.current = elapsed;
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const newElapsed = pausedElapsedRef.current + Math.floor((now - startTimeRef.current) / 1000);

      if (mode === "countdown" && newElapsed >= totalCountdownSeconds) {
        setElapsed(totalCountdownSeconds);
        setIsRunning(false);
        setHasFinished(true);
        setShowAlert(true);
        if (!soundMuted) playRepeatingSound(selectedSound);
        showTimerNotification();
        stopInterval();
      } else {
        setElapsed(newElapsed);
      }
    }, 100);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    pausedElapsedRef.current = elapsed;
    stopInterval();
  };

  const resetTimer = () => {
    setIsRunning(false);
    setElapsed(0);
    setHasFinished(false);
    setShowAlert(false);
    pausedElapsedRef.current = 0;
    stopInterval();
    clearSoundTimeouts();
  };

  const dismissAlert = () => {
    setShowAlert(false);
    clearSoundTimeouts();
  };

  const displaySeconds = mode === "countdown"
    ? Math.max(totalCountdownSeconds - elapsed, 0)
    : elapsed;

  const h = Math.floor(displaySeconds / 3600);
  const m = Math.floor((displaySeconds % 3600) / 60);
  const s = displaySeconds % 60;

  const progress = mode === "countdown" && totalCountdownSeconds > 0
    ? ((totalCountdownSeconds - displaySeconds) / totalCountdownSeconds) * 100
    : 0;

  const saveSettings = () => {
    const newH = Math.max(0, parseInt(settingsH) || 0);
    const newM = Math.max(0, Math.min(59, parseInt(settingsM) || 0));
    const newS = Math.max(0, Math.min(59, parseInt(settingsS) || 0));
    onContentChange({
      mode: settingsMode,
      hours: newH,
      minutes: newM,
      seconds: newS,
      sound: settingsSound,
    });
    resetTimer();
    setShowSettings(false);
  };

  const openSettings = () => {
    setSettingsMode(mode);
    setSettingsH(String(initialH));
    setSettingsM(String(initialM));
    setSettingsS(String(initialS));
    setSettingsSound(selectedSound);
    setShowSettings(true);
  };

  if (showSettings) {
    return (
      <div className="flex flex-col h-full gap-3 p-4" data-testid="timer-settings">
        <div className="text-sm font-medium">Timer Settings</div>

        <div className="space-y-1">
          <Label className="text-xs">Mode</Label>
          <Select value={settingsMode} onValueChange={(v) => setSettingsMode(v as "countdown" | "countup")}>
            <SelectTrigger data-testid="select-timer-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="countdown">Countdown</SelectItem>
              <SelectItem value="countup">Count Up</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {settingsMode === "countdown" && (
          <div className="space-y-1">
            <Label className="text-xs">Duration</Label>
            <div className="flex gap-2 items-center">
              <div className="flex-1 space-y-0.5">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={settingsH}
                  onChange={(e) => setSettingsH(e.target.value)}
                  data-testid="input-timer-hours"
                />
                <div className="text-[10px] text-muted-foreground text-center">hrs</div>
              </div>
              <span className="text-lg font-bold pb-4">:</span>
              <div className="flex-1 space-y-0.5">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={settingsM}
                  onChange={(e) => setSettingsM(e.target.value)}
                  data-testid="input-timer-minutes"
                />
                <div className="text-[10px] text-muted-foreground text-center">min</div>
              </div>
              <span className="text-lg font-bold pb-4">:</span>
              <div className="flex-1 space-y-0.5">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={settingsS}
                  onChange={(e) => setSettingsS(e.target.value)}
                  data-testid="input-timer-seconds"
                />
                <div className="text-[10px] text-muted-foreground text-center">sec</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-xs">Alert Sound</Label>
          <div className="flex gap-2">
            <Select value={settingsSound} onValueChange={(v) => { setSettingsSound(v); playSoundOnce(v); }}>
              <SelectTrigger className="flex-1" data-testid="select-timer-sound">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOUNDS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => playSoundOnce(settingsSound)} data-testid="button-preview-sound">
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          <Button size="sm" className="flex-1" onClick={saveSettings} data-testid="button-save-timer-settings">
            Save
          </Button>
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShowSettings(false)} data-testid="button-cancel-timer-settings">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-full gap-3 p-4" data-testid="timer-widget">
      {showAlert && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-md"
          style={{ backgroundColor: "hsl(var(--destructive) / 0.12)" }}
          data-testid="timer-alert-overlay"
        >
          <Bell className="h-10 w-10 text-destructive animate-bounce" />
          <div className="text-lg font-bold text-destructive">Time's Up!</div>
          <Button variant="outline" size="sm" onClick={dismissAlert} data-testid="button-dismiss-alert">
            Dismiss
          </Button>
        </div>
      )}

      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {mode === "countdown" ? "Countdown" : "Stopwatch"}
      </div>

      {mode === "countdown" && totalCountdownSeconds > 0 && (
        <div className="w-full max-w-[200px]">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: hasFinished ? "#EF4444" : progress > 75 ? "#F59E0B" : "#3B82F6",
              }}
              data-testid="timer-progress-bar"
            />
          </div>
        </div>
      )}

      <div
        className={`font-mono text-4xl font-bold tabular-nums tracking-tight ${hasFinished ? "text-destructive animate-pulse" : ""}`}
        data-testid="timer-display"
      >
        {h > 0 && <>{padNum(h)}:</>}{padNum(m)}:{padNum(s)}
      </div>

      <div className="flex items-center gap-2">
        {!isRunning ? (
          <Button
            size="icon"
            onClick={startTimer}
            disabled={mode === "countdown" && totalCountdownSeconds === 0 && elapsed === 0}
            data-testid="button-timer-start"
          >
            <Play className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="icon" variant="secondary" onClick={pauseTimer} data-testid="button-timer-pause">
            <Pause className="h-4 w-4" />
          </Button>
        )}
        <Button size="icon" variant="ghost" onClick={resetTimer} data-testid="button-timer-reset">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setSoundMuted(!soundMuted)}
          data-testid="button-timer-mute"
        >
          {soundMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Button size="icon" variant="ghost" onClick={openSettings} data-testid="button-timer-settings">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {hasFinished && !showAlert && (
        <div className="text-xs text-destructive font-medium animate-pulse" data-testid="timer-finished-text">
          Time's up!
        </div>
      )}
    </div>
  );
}
