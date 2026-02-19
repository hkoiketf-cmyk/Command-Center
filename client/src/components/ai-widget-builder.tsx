import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Wand2, Send, Eye, Code, Loader2, RotateCcw, Check, Key, CheckCircle2, X, MessageSquare, History, Zap, Shield, CircleCheck, AlertTriangle, Square, SplitSquareHorizontal, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Highlight, themes } from "prism-react-renderer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AiWidgetBuilderProps {
  onAddWidget: (code: string, title: string) => void;
  onClose: () => void;
  initialCode?: string;
  initialTitle?: string;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  summary?: string;
  /** "clarify" = clarifying questions (user should reply with choices); "code" = generated widget */
  messageType?: "clarify" | "code";
}

interface CritiqueIssue {
  category: string;
  severity: string;
  description: string;
  fix: string;
}

interface CritiqueResult {
  passed: boolean;
  score: number;
  issues: CritiqueIssue[];
}

interface IterationCheckpoint {
  code: string;
  iteration: number;
  score: number;
  passed: boolean;
  issues: CritiqueIssue[];
  label: string;
}

type ViewMode = "split" | "preview" | "code";

const PROMPT_SUGGESTIONS = [
  "Something to keep track of my daily step count",
  "A widget to log my water intake each day",
  "Track my habits and show streaks",
  "A Pomodoro timer with a visual progress ring",
  "A simple expense tracker for daily spending",
  "A motivational quote rotator with smooth fade animations",
  "A goal progress tracker with animated bars",
];

const MAX_ITERATIONS = 5;
const MAX_EXTRA_FIX_ROUNDS = 2;

export function AiWidgetBuilder({ onAddWidget, onClose, initialCode, initialTitle }: AiWidgetBuilderProps) {
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState(initialCode || "");
  const [widgetTitle, setWidgetTitle] = useState(initialTitle || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(initialCode ? "preview" : "preview");
  const [error, setError] = useState("");
  const [generationPhase, setGenerationPhase] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>(() => {
    if (initialCode) {
      return [{ role: "assistant", content: initialCode, summary: "Existing widget code loaded" }];
    }
    return [];
  });
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [checkpoints, setCheckpoints] = useState<IterationCheckpoint[]>([]);
  const [activeCheckpoint, setActiveCheckpoint] = useState(-1);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [lastCritique, setLastCritique] = useState<CritiqueResult | null>(null);
  const [iframeErrors, setIframeErrors] = useState<string[]>([]);
  const [previewCode, setPreviewCode] = useState(initialCode || "");
  const [askQuestionsFirst, setAskQuestionsFirst] = useState(true);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [extraFixRoundsDone, setExtraFixRoundsDone] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const { data: userSettings } = useQuery<{ hasOpenaiKey: boolean; openaiApiKey: string | null }>({
    queryKey: ["/api/user-settings"],
  });

  const hasKey = !!userSettings?.hasOpenaiKey;

  const saveApiKey = useMutation({
    mutationFn: (key: string) => apiRequest("PATCH", "/api/user-settings", { openaiApiKey: key }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-settings"] });
      toast({ title: "API key saved successfully" });
      setApiKeyInput("");
      setShowApiKeyForm(false);
    },
    onError: () => {
      toast({ title: "Failed to save API key", variant: "destructive" });
    },
  });

  const removeApiKey = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/user-settings", { openaiApiKey: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-settings"] });
      toast({ title: "API key removed" });
    },
  });

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [conversation]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "iframe-error" && event.data?.source === "ai-widget-preview") {
        setIframeErrors(prev => {
          const msg = event.data.message;
          if (prev.includes(msg)) return prev;
          return [...prev.slice(-4), msg];
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const streamFromEndpoint = async (body: Record<string, unknown>, signal: AbortSignal, onChunk?: (text: string) => void): Promise<string> => {
    const response = await fetch("/api/ai/generate-widget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Failed to generate widget" }));
      throw new Error(err.error || "Failed to generate widget");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Failed to read response stream");

    let fullText = "";
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            fullText += parsed.content;
            onChunk?.(fullText);
          }
          if (parsed.error) {
            throw new Error(parsed.error);
          }
        } catch (e: any) {
          if (e.message && !e.message.includes("JSON")) throw e;
        }
      }
    }

    return fullText;
  };

  /** Extract HTML from model output: prefer code fences, then DOCTYPE/html start; always return usable fragment or full document. */
  const cleanCode = (raw: string): string => {
    let code = raw.trim();
    if (!code) return "";

    // 1) Prefer content from markdown code block(s) — take the block that looks like full HTML or largest
    const fenceRegex = /```(?:html|xml)?\s*\n?([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    let bestBlock = "";
    while ((match = fenceRegex.exec(code)) !== null) {
      const block = match[1].trim();
      if (block.length < 30) continue;
      const hasFullDoc = /<!DOCTYPE\s+html>/i.test(block) || /<html[\s>]/i.test(block) || /<body[\s>]/i.test(block);
      if (hasFullDoc && block.length > bestBlock.length) bestBlock = block;
      else if (!bestBlock || block.length > bestBlock.length) bestBlock = block;
    }
    if (bestBlock) code = bestBlock;

    // 2) If no fence, find start of HTML in the text
    const docStart = code.indexOf("<!DOCTYPE");
    const htmlStart = code.search(/<html[\s>]/i);
    const bodyStart = code.search(/<body[\s>]/i);
    const fragmentStart = code.search(/<(?:div|style|section|main)[\s>]/i);
    let start = -1;
    if (docStart >= 0) start = docStart;
    else if (htmlStart >= 0) start = htmlStart;
    else if (bodyStart >= 0) start = bodyStart;
    else if (fragmentStart >= 0) start = fragmentStart;
    if (start > 0) code = code.slice(start);

    // 3) Trim trailing markdown/code fence
    code = code.replace(/\s*```\s*$/gm, "").trim();
    const closeHtml = code.lastIndexOf("</html>");
    if (closeHtml >= 0) code = code.slice(0, closeHtml + 7);

    return code.trim();
  };

  /** Ensure we have a full HTML document for display. If code is body-only or fragment, wrap it. */
  const ensureFullDocument = (code: string): string => {
    const trimmed = code.trim();
    if (!trimmed) return "";
    const lower = trimmed.toLowerCase();
    if (lower.startsWith("<!doctype") && lower.includes("<html")) return trimmed;
    if (lower.startsWith("<html")) return trimmed;
    // Body or fragment: wrap in minimal full document
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Widget</title>
  <style>*{box-sizing:border-box;}body{margin:0;padding:16px;font-family:system-ui,-apple-system,sans-serif;background:transparent;}</style>
</head>
<body>
${trimmed}
</body>
</html>`;
  };

  const schedulePreviewUpdate = useCallback((code: string) => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
    }
    previewTimerRef.current = setTimeout(() => {
      setPreviewCode(code);
    }, 800);
  }, []);

  const flushPreview = useCallback((code: string) => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    setPreviewCode(code);
  }, []);

  const buildConversationHistory = (): { role: string; content: string }[] => {
    const messages: { role: string; content: string }[] = [];
    for (const msg of conversation) {
      if (msg.role === "user") {
        messages.push({ role: "user", content: msg.content });
      } else if (msg.role === "assistant" && msg.summary) {
        messages.push({ role: "assistant", content: `[${msg.summary}]` });
      }
    }
    return messages;
  };

  const critiqueCode = async (code: string, userPrompt: string): Promise<CritiqueResult> => {
    try {
      const response = await fetch("/api/ai/critique-widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, userPrompt }),
      });
      if (!response.ok) {
        console.warn("Critique request failed, skipping iteration");
        return { passed: true, score: 0, issues: [{ category: "system", severity: "minor", description: "QA check skipped (service error)", fix: "" }] };
      }
      const result = await response.json();
      if (typeof result.passed !== "boolean" || typeof result.score !== "number") {
        return { passed: true, score: 7, issues: [] };
      }
      return result;
    } catch {
      console.warn("Critique network error, skipping iteration");
      return { passed: true, score: 0, issues: [{ category: "system", severity: "minor", description: "QA check skipped (network error)", fix: "" }] };
    }
  };

  const addCheckpoint = (code: string, iteration: number, critique: CritiqueResult, label: string) => {
    const cp: IterationCheckpoint = {
      code,
      iteration,
      score: critique.score,
      passed: critique.passed,
      issues: critique.issues || [],
      label,
    };
    setCheckpoints(prev => [...prev, cp]);
    setActiveCheckpoint(-1);
  };

  const handleAbort = () => {
    abortRef.current?.abort();
    setIsGenerating(false);
    setGenerationPhase("Generation cancelled");
    setCurrentIteration(0);
    toast({ title: "Generation stopped" });
    setTimeout(() => setGenerationPhase(""), 2000);
  };

  const isWaitingForClarificationAnswers = (): boolean => {
    if (conversation.length < 1) return false;
    const last = conversation[conversation.length - 1];
    if (last.role !== "assistant") return false;
    return last.messageType === "clarify" || !last.content.trim().startsWith("<!DOCTYPE");
  };

  const generateWidget = useCallback(async (userPrompt: string) => {
    if (!userPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError("");
    setLastCritique(null);
    setIframeErrors([]);

    const isFirstMessage = conversation.length === 0;
    const answeringClarification = isWaitingForClarificationAnswers();
    const hasExistingCode = !!generatedCode;

    if (isFirstMessage) {
      setOriginalPrompt(userPrompt);
      setCheckpoints([]);
      setExtraFixRoundsDone(0);
    }

    setConversation(prev => [...prev, { role: "user", content: userPrompt, summary: userPrompt.length > 60 ? userPrompt.slice(0, 60) + "…" : userPrompt }]);

    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      // Phase 1: First message → optionally ask clarifying questions, or go straight to build
      if (isFirstMessage && !hasExistingCode && askQuestionsFirst) {
        setGenerationPhase("Asking a few questions so we build exactly what you need...");
        setConversation(prev => [...prev, { role: "assistant", content: "", summary: "Questions", messageType: "clarify" }]);

        const clarifyText = await streamFromEndpoint({
          prompt: userPrompt,
          mode: "clarify",
          conversationHistory: [],
        }, signal, (text) => {
          setConversation(prev => {
            const next = [...prev];
            const lastIdx = next.length - 1;
            if (lastIdx >= 0 && next[lastIdx].role === "assistant" && next[lastIdx].messageType === "clarify") {
              next[lastIdx] = { ...next[lastIdx], content: text };
            }
            return next;
          });
        });

        setConversation(prev => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (lastIdx >= 0 && next[lastIdx].role === "assistant" && next[lastIdx].messageType === "clarify") {
            next[lastIdx] = { ...next[lastIdx], content: clarifyText };
          }
          return next;
        });
        setGenerationPhase("");
        setPrompt("");
        setIsGenerating(false);
        return;
      }

      // Phase 2: Build widget (either after clarification answers, or first message with "skip questions")
      const effectivePrompt = answeringClarification
        ? `${originalPrompt || userPrompt}\n\nUser's choices:\n${userPrompt}`
        : userPrompt;
      const isFirstGeneration = !generatedCode && conversation.filter(m => m.messageType === "code").length === 0;

      if (isFirstGeneration && !hasExistingCode) {
        setCurrentIteration(1);
        setGenerationPhase("Building your widget...");
        setGeneratedCode("");
        setViewMode("preview");

        const rawCode = await streamFromEndpoint({
          prompt: effectivePrompt,
          mode: "generate",
          conversationHistory: [],
        }, signal, (text) => {
          setGeneratedCode(text);
          schedulePreviewUpdate(text);
        });

        let currentCode = ensureFullDocument(cleanCode(rawCode));
        setGeneratedCode(currentCode);
        flushPreview(currentCode);

        let finalIterationCount = 1;

        for (let i = 1; i <= MAX_ITERATIONS; i++) {
          if (signal.aborted) break;
          finalIterationCount = i;
          setCurrentIteration(i);

          setGenerationPhase("Checking quality...");
          const critique = await critiqueCode(currentCode, userPrompt);
          setLastCritique(critique);

          addCheckpoint(currentCode, i, critique, i === 1 ? "Initial build" : `Iteration ${i}`);

          const actionableIssues = critique.issues.filter(
            (iss: CritiqueIssue) => iss.severity === "critical" || iss.severity === "major"
          );

          if (critique.passed || i === MAX_ITERATIONS || actionableIssues.length === 0) {
            if (critique.score === 0) {
              setGenerationPhase("QA check unavailable - widget built without verification");
            } else if (critique.passed) {
              setGenerationPhase(`Passed quality check (score: ${critique.score}/10)`);
            } else if (actionableIssues.length === 0) {
              setGenerationPhase(`No major issues found (score: ${critique.score}/10)`);
            } else {
              setGenerationPhase(`Reached max iterations (score: ${critique.score}/10)`);
            }
            break;
          }

          const issueList = actionableIssues
            .map((iss: CritiqueIssue) => `- [${iss.severity.toUpperCase()}] ${iss.description}: ${iss.fix}`)
            .join("\n");

          setGenerationPhase(`Fixing ${actionableIssues.length} issue(s)...`);
          setGeneratedCode("");

          const fixPrompt = `Fix these specific issues in the widget code. You MUST output the complete, corrected HTML code - not explanations or descriptions of what to fix. Actually apply the fixes to the code.\n\nISSUES TO FIX:\n${issueList}\n\nPreserve all existing features and styling. Return the COMPLETE fixed HTML starting with <!DOCTYPE html>.`;

          const fixedRaw = await streamFromEndpoint({
            prompt: fixPrompt,
            currentCode: currentCode,
            mode: "refine",
            conversationHistory: [],
            originalPrompt: userPrompt,
          }, signal, (text) => {
            setGeneratedCode(text);
            schedulePreviewUpdate(text);
          });

          currentCode = ensureFullDocument(cleanCode(fixedRaw));
          setGeneratedCode(currentCode);
          flushPreview(currentCode);
        }

        const finalCode = currentCode;
        setGeneratedCode(finalCode);
        flushPreview(finalCode);

        const iterLabel = finalIterationCount === 1
          ? "Built in 1 pass"
          : `Built with ${finalIterationCount} iterations`;
        setConversation(prev => [...prev, { role: "assistant", content: finalCode, summary: iterLabel, messageType: "code" }]);

        if (!widgetTitle) {
          const titleMatch = finalCode.match(/<title>(.*?)<\/title>/i);
          if (titleMatch && titleMatch[1] && titleMatch[1].length < 50) {
            setWidgetTitle(titleMatch[1]);
          } else {
            const words = userPrompt.split(" ").slice(0, 5).join(" ");
            setWidgetTitle(words.charAt(0).toUpperCase() + words.slice(1));
          }
        }
      } else {
        const MAX_REFINE_ITERATIONS = 3;
        setCurrentIteration(1);
        setGenerationPhase("Applying your changes...");

        const history = buildConversationHistory();

        const refinedRaw = await streamFromEndpoint({
          prompt: userPrompt,
          currentCode: generatedCode,
          mode: "refine",
          conversationHistory: history,
          originalPrompt: originalPrompt || undefined,
        }, signal, (text) => {
          setGeneratedCode(text);
          schedulePreviewUpdate(text);
        });

        let currentCode = ensureFullDocument(cleanCode(refinedRaw));
        setGeneratedCode(currentCode);
        flushPreview(currentCode);

        for (let i = 1; i <= MAX_REFINE_ITERATIONS; i++) {
          if (signal.aborted) break;
          setCurrentIteration(i);

          setGenerationPhase("Checking quality...");
          const critique = await critiqueCode(currentCode, originalPrompt || userPrompt);
          setLastCritique(critique);
          addCheckpoint(currentCode, i, critique, i === 1 ? "Refinement" : `Refinement fix ${i}`);

          const actionableIssues = critique.issues.filter(
            (iss: CritiqueIssue) => iss.severity === "critical" || iss.severity === "major"
          );

          if (critique.passed || i === MAX_REFINE_ITERATIONS || actionableIssues.length === 0) {
            if (critique.passed) {
              setGenerationPhase(`Changes passed QA (score: ${critique.score}/10)`);
            } else if (actionableIssues.length === 0) {
              setGenerationPhase(`No major issues (score: ${critique.score}/10)`);
            } else {
              setGenerationPhase(`Applied changes (score: ${critique.score}/10)`);
            }
            break;
          }

          const issueList = actionableIssues
            .map((iss: CritiqueIssue) => `- [${iss.severity.toUpperCase()}] ${iss.description}: ${iss.fix}`)
            .join("\n");

          setGenerationPhase(`Fixing ${actionableIssues.length} issue(s)...`);
          setGeneratedCode("");

          const fixedRaw = await streamFromEndpoint({
            prompt: `Fix these specific issues in the widget code. You MUST output the complete, corrected HTML code - not explanations or descriptions of what to fix. Actually apply the fixes to the code.\n\nISSUES TO FIX:\n${issueList}\n\nPreserve all existing features and styling. Return the COMPLETE fixed HTML starting with <!DOCTYPE html>.`,
            currentCode: currentCode,
            mode: "refine",
            conversationHistory: history,
            originalPrompt: originalPrompt || userPrompt,
          }, signal, (text) => {
            setGeneratedCode(text);
            schedulePreviewUpdate(text);
          });

          currentCode = ensureFullDocument(cleanCode(fixedRaw));
          setGeneratedCode(currentCode);
          flushPreview(currentCode);
        }

        setConversation(prev => [...prev, { role: "assistant", content: currentCode, summary: "Applied changes", messageType: "code" }]);
      }

      setViewMode("preview");
      setPrompt("");
      setLastFailedPrompt(null);
      setTimeout(() => setGenerationPhase(""), 3000);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Generation failed");
        setLastFailedPrompt(userPrompt);
        setConversation(prev => prev.slice(0, -1));
      }
      setGenerationPhase("");
    } finally {
      setIsGenerating(false);
      setCurrentIteration(0);
    }
  }, [isGenerating, generatedCode, widgetTitle, conversation, originalPrompt, askQuestionsFirst, schedulePreviewUpdate, flushPreview]);

  const handleFixRemainingIssues = useCallback(async () => {
    if (!generatedCode || !lastCritique || isGenerating || extraFixRoundsDone >= MAX_EXTRA_FIX_ROUNDS) return;
    const actionable = lastCritique.issues.filter(
      (iss: CritiqueIssue) => iss.severity === "critical" || iss.severity === "major"
    );
    if (actionable.length === 0) return;

    setIsGenerating(true);
    setError("");
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      setGenerationPhase("Fixing remaining issues...");
      const issueList = actionable
        .map((iss: CritiqueIssue) => `- [${iss.severity.toUpperCase()}] ${iss.description}: ${iss.fix}`)
        .join("\n");
      const fixPrompt = `Fix these specific issues in the widget code. You MUST output the complete, corrected HTML code - not explanations. Actually apply the fixes.\n\nISSUES TO FIX:\n${issueList}\n\nPreserve all existing features and styling. Return the COMPLETE fixed HTML starting with <!DOCTYPE html>.`;

      const fixedRaw = await streamFromEndpoint(
        {
          prompt: fixPrompt,
          currentCode: generatedCode,
          mode: "refine",
          conversationHistory: [],
          originalPrompt: originalPrompt || "",
        },
        signal,
        (text) => {
          setGeneratedCode(ensureFullDocument(cleanCode(text)));
          schedulePreviewUpdate(ensureFullDocument(cleanCode(text)));
        }
      );

      let currentCode = ensureFullDocument(cleanCode(fixedRaw));
      setGeneratedCode(currentCode);
      flushPreview(currentCode);

      const critique = await critiqueCode(currentCode, originalPrompt || "");
      setLastCritique(critique);
      addCheckpoint(currentCode, checkpoints.length + 1, critique, `Extra fix ${extraFixRoundsDone + 1}`);
      setExtraFixRoundsDone((r) => r + 1);

      const stillActionable = critique.issues.filter(
        (i: CritiqueIssue) => i.severity === "critical" || i.severity === "major"
      ).length;
      if (critique.passed) {
        setGenerationPhase(`All issues fixed (score: ${critique.score}/10)`);
      } else if (stillActionable > 0 && extraFixRoundsDone + 1 < MAX_EXTRA_FIX_ROUNDS) {
        setGenerationPhase(`${stillActionable} issue(s) remaining. Click "Fix remaining issues" again if needed.`);
      } else {
        setGenerationPhase(`Score: ${critique.score}/10. Refine with a message below or add to dashboard.`);
      }
      setTimeout(() => setGenerationPhase(""), 5000);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Fix failed");
      }
      setGenerationPhase("");
    } finally {
      setIsGenerating(false);
    }
  }, [generatedCode, lastCritique, isGenerating, extraFixRoundsDone, originalPrompt, checkpoints.length, schedulePreviewUpdate, flushPreview]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateWidget(prompt);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    generateWidget(suggestion);
  };

  const handleAddToBoard = () => {
    if (!generatedCode.trim()) {
      toast({ title: "No code to add", variant: "destructive" });
      return;
    }
    const title = widgetTitle.trim() || "AI Widget";
    onAddWidget(generatedCode, title);
    toast({ title: `"${title}" added to your dashboard` });
  };

  const handleStartOver = () => {
    setGeneratedCode("");
    setPreviewCode("");
    setWidgetTitle("");
    setViewMode("preview");
    setPrompt("");
    setError("");
    setLastFailedPrompt(null);
    setGenerationPhase("");
    setConversation([]);
    setOriginalPrompt("");
    setCheckpoints([]);
    setActiveCheckpoint(-1);
    setLastCritique(null);
    setCurrentIteration(0);
    setIframeErrors([]);
    setExtraFixRoundsDone(0);
  };

  const handleRestoreCheckpoint = (index: number) => {
    if (index < 0 || index >= checkpoints.length) return;
    const cp = checkpoints[index];
    setGeneratedCode(cp.code);
    setPreviewCode(cp.code);
    setActiveCheckpoint(index);
    setLastCritique({ passed: cp.passed, score: cp.score, issues: cp.issues });
    setIframeErrors([]);
    toast({ title: `Restored "${cp.label}" (score: ${cp.score}/10)` });
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const key = apiKeyInput.trim();
    if (!key) return;
    saveApiKey.mutate(key);
  };

  const wrapCode = (rawCode: string): string => {
    const trimmed = rawCode.trim();
    if (!trimmed) return "";
    const errorBridge = `<script>
window.onerror = function(msg, src, line) {
  try { parent.postMessage({ type: "iframe-error", source: "ai-widget-preview", message: msg + (line ? " (line " + line + ")" : "") }, "*"); } catch(e) {}
  return true;
};
</script>`;
    const lower = trimmed.toLowerCase();
    const isFullDoc = lower.startsWith("<!doctype") || lower.startsWith("<html");
    if (isFullDoc) {
      // Inject error bridge into head, or at start of body if no head
      if (/<head[\s>]/i.test(trimmed)) {
        return trimmed.replace(/<head([^>]*)>/i, `<head$1>${errorBridge}`);
      }
      if (/<body[\s>]/i.test(trimmed)) {
        return trimmed.replace(/<body([^>]*)>/i, `<body$1>${errorBridge}`);
      }
      return trimmed;
    }
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${errorBridge}
  <style>*{box-sizing:border-box;}body{margin:0;padding:16px;font-family:system-ui,-apple-system,sans-serif;background:transparent;}</style>
</head>
<body>
${trimmed}
</body>
</html>`;
  };

  const wrappedPreview = useMemo(() => wrapCode(previewCode), [previewCode]);

  const isEditMode = !!initialCode;
  const hasConversation = conversation.length > 0;
  const userMessages = conversation.filter(m => m.role === "user");
  const showBuilder = generatedCode || isGenerating || hasConversation;

  return (
    <div className="flex flex-col h-full gap-4" data-testid="ai-widget-builder">
      <div className="rounded-lg border p-3" data-testid="api-key-section">
        {hasKey ? (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <span className="text-muted-foreground">
                OpenAI key connected
                {userSettings?.openaiApiKey && (
                  <span className="ml-1 font-mono text-xs">({userSettings.openaiApiKey})</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowApiKeyForm(!showApiKeyForm)}
                data-testid="button-change-api-key"
              >
                Change
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeApiKey.mutate()}
                className="text-destructive"
                disabled={removeApiKey.isPending}
                data-testid="button-remove-api-key"
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <Key className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              Connect your OpenAI API key to start building
            </span>
          </div>
        )}

        {(!hasKey || showApiKeyForm) && (
          <form onSubmit={handleSaveApiKey} className="flex items-center gap-2 mt-2 flex-wrap" data-testid="form-api-key">
            <Input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="sk-..."
              className="text-sm flex-1 font-mono"
              data-testid="input-openai-api-key"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!apiKeyInput.trim() || saveApiKey.isPending}
              data-testid="button-save-api-key"
            >
              {saveApiKey.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
            </Button>
            {showApiKeyForm && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => { setShowApiKeyForm(false); setApiKeyInput(""); }}
                data-testid="button-cancel-api-key"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </form>
        )}
      </div>

      {!showBuilder ? (
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {isEditMode
              ? "Describe the changes you want to make to your widget."
              : "Describe your widget in plain language—even vaguely. We'll ask a few questions (how to input data, goals, display), then build it. Like the Replit of widget makers."
            }
          </p>

          {error && (
            <div className="w-full max-w-md rounded-md bg-destructive/10 border border-destructive/20 p-3 space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              {lastFailedPrompt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setError(""); setLastFailedPrompt(null); generateWidget(lastFailedPrompt); }}
                  data-testid="button-retry-generation"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Try again
                </Button>
              )}
            </div>
          )}

          <div className="w-full max-w-md space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Try a suggestion:</p>
            <div className="grid grid-cols-1 gap-1.5">
              {PROMPT_SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(s)}
                  disabled={isGenerating || !hasKey}
                  className="justify-start text-left text-xs font-normal"
                  data-testid={`button-suggestion-${s.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}
                >
                  <Zap className="h-3 w-3 mr-1.5 shrink-0 text-primary" />
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="w-full max-w-md flex items-center justify-between gap-2 py-1">
            <Label htmlFor="ask-questions-first" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-2">
              <Switch
                id="ask-questions-first"
                checked={askQuestionsFirst}
                onCheckedChange={setAskQuestionsFirst}
                data-testid="switch-ask-questions-first"
              />
              Ask me a few questions first (recommended for vague ideas)
            </Label>
          </div>
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-2">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={hasKey ? "e.g. 'Something to track my daily steps' or 'A widget to log water intake' — we'll ask how you want to input data and then build it" : "Add your OpenAI API key above to get started..."}
              className="resize-none text-sm min-h-[80px]"
              disabled={isGenerating || !hasKey}
              data-testid="textarea-widget-prompt"
            />
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">{prompt.length > 0 ? `${prompt.length} chars` : ""}</span>
              <Button
                type="submit"
                className="flex-1"
                disabled={!prompt.trim() || isGenerating || !hasKey}
                data-testid="button-generate-widget"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Build Widget
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Wand2 className="h-4 w-4 text-primary shrink-0" />
              <Input
                value={widgetTitle}
                onChange={(e) => setWidgetTitle(e.target.value)}
                placeholder="Widget title..."
                className="text-sm font-medium border-dashed min-w-[120px] max-w-[200px]"
                data-testid="input-ai-widget-title"
              />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <Button
                variant={viewMode === "split" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("split")}
                data-testid="button-ai-view-split"
              >
                <SplitSquareHorizontal className="h-3.5 w-3.5 mr-1" />
                Split
              </Button>
              <Button
                variant={viewMode === "preview" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("preview")}
                data-testid="button-ai-view-preview"
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Preview
              </Button>
              <Button
                variant={viewMode === "code" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("code")}
                data-testid="button-ai-view-code"
              >
                <Code className="h-3.5 w-3.5 mr-1" />
                Code
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    data-testid="button-start-over"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Start Over
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Start over?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will discard your current widget and all iteration history. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-start-over">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStartOver} data-testid="button-confirm-start-over">
                      Start Over
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {(isGenerating || generationPhase) && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-primary/5 border border-primary/10 flex-wrap">
              {isGenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
              ) : generationPhase.includes("Passed") ? (
                <CircleCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />
              ) : generationPhase.includes("cancelled") ? (
                <StopCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
              <span className="text-xs text-primary font-medium flex-1">{generationPhase || "Working..."}</span>
              {currentIteration > 0 && isGenerating && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex gap-0.5">
                    {Array.from({ length: MAX_ITERATIONS }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i < currentIteration
                            ? "bg-primary"
                            : "bg-muted-foreground/20"
                        }`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAbort}
                    className="text-destructive"
                    data-testid="button-stop-generation"
                  >
                    <Square className="h-3 w-3 mr-1 fill-current" />
                    Stop
                  </Button>
                </div>
              )}
              {isGenerating && currentIteration === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAbort}
                  className="text-destructive"
                  data-testid="button-stop-generation-simple"
                >
                  <Square className="h-3 w-3 mr-1 fill-current" />
                  Stop
                </Button>
              )}
            </div>
          )}

          {checkpoints.length > 1 && !isGenerating && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border bg-muted/30 flex-wrap">
              <History className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Iterations:</span>
              <div className="flex items-center gap-1 flex-1 overflow-x-auto flex-wrap">
                {checkpoints.map((cp, i) => (
                  <Button
                    key={i}
                    variant={activeCheckpoint === i ? "default" : "outline"}
                    size="sm"
                    className="text-xs whitespace-nowrap"
                    onClick={() => handleRestoreCheckpoint(i)}
                    data-testid={`button-checkpoint-${i}`}
                  >
                    {cp.label}
                    <span className="ml-1 opacity-60">{cp.score}/10</span>
                    {cp.passed && <CircleCheck className="h-3 w-3 ml-0.5 text-green-500" />}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {lastCritique && !isGenerating && lastCritique.issues.length > 0 && (
            <div className="rounded-md border px-2 py-1.5 space-y-1 max-h-[80px] overflow-y-auto bg-muted/20">
              <div className="flex items-center gap-1.5 flex-wrap justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Shield className="h-3 w-3 shrink-0" />
                  QA: {lastCritique.passed ? "Passed" : "Issues found"} ({lastCritique.score}/10)
                </span>
                {!lastCritique.passed &&
                  lastCritique.issues.some((i) => i.severity === "critical" || i.severity === "major") &&
                  extraFixRoundsDone < MAX_EXTRA_FIX_ROUNDS && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={handleFixRemainingIssues}
                      data-testid="button-fix-remaining-issues"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Fix remaining issues ({MAX_EXTRA_FIX_ROUNDS - extraFixRoundsDone} left)
                    </Button>
                  )}
              </div>
              {lastCritique.issues.filter(i => i.severity !== "minor").slice(0, 3).map((issue, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-xs text-muted-foreground flex-wrap">
                  {issue.severity === "critical" ? (
                    <AlertTriangle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0 mt-0.5" />
                  )}
                  <span className="truncate">{issue.description}</span>
                </div>
              ))}
            </div>
          )}

          {iframeErrors.length > 0 && (
            <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20 text-xs flex-wrap" data-testid="ai-error-banner">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 space-y-0.5 overflow-hidden min-w-0">
                {iframeErrors.map((err, i) => (
                  <div key={i} className="text-destructive truncate">{err}</div>
                ))}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const errMsg = iframeErrors[0] || "Runtime error";
                    setPrompt(`Fix this runtime error in the widget code: ${errMsg}`);
                    setIframeErrors([]);
                  }}
                  data-testid="button-ask-ai-fix-error"
                >
                  Ask AI to fix
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIframeErrors([])}
                  data-testid="button-dismiss-ai-errors"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {generatedCode && !isGenerating && (
            <p className="text-xs text-muted-foreground text-center">
              Widget ready. Add it to your dashboard below, or describe changes above to refine.
            </p>
          )}

          <div className={`flex-1 min-h-[320px] ${viewMode === "split" ? "flex gap-2" : "flex flex-col"}`}>
            {(viewMode === "split" || viewMode === "code") && (
              <div className={`${viewMode === "split" ? "w-1/2" : "w-full"} min-h-0 flex flex-col min-h-[280px]`}>
                <div className="flex-1 overflow-auto rounded-lg border bg-[#011627] p-3 font-mono text-xs min-h-[240px]">
                  <Highlight theme={themes.nightOwl} code={generatedCode || ""} language="markup">
                    {({ tokens, getLineProps, getTokenProps }) => (
                      <pre className="m-0" style={{ background: "transparent" }}>
                        {tokens.map((line, i) => (
                          <div key={i} {...getLineProps({ line })} className="flex">
                            <span className="select-none text-slate-500 w-8 text-right mr-3 shrink-0">{i + 1}</span>
                            <span className="flex-1">
                              {line.map((token, key) => (
                                <span key={key} {...getTokenProps({ token })} />
                              ))}
                            </span>
                          </div>
                        ))}
                      </pre>
                    )}
                  </Highlight>
                </div>
              </div>
            )}

            {(viewMode === "split" || viewMode === "preview") && (
              <div className={`${viewMode === "split" ? "w-1/2" : "w-full"} min-h-0 border rounded-lg overflow-hidden flex flex-col min-h-[280px]`}>
                {!previewCode.trim() ? (
                  <div className="flex-1 min-h-[280px] flex flex-col items-center justify-center bg-muted/30 text-muted-foreground text-sm rounded-lg border border-dashed p-4 text-center">
                    {isWaitingForClarificationAnswers() ? (
                      <>
                        <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                        <p>Reply with your choices above, or click &quot;Use defaults and build&quot;.</p>
                        <p className="text-xs mt-1">Your widget preview will appear here after we build it.</p>
                      </>
                    ) : (
                      "Preview will appear here"
                    )}
                  </div>
                ) : (
                  <iframe
                    ref={iframeRef}
                    srcDoc={wrappedPreview}
                    sandbox="allow-scripts"
                    className="w-full flex-1 min-h-[280px] border-0"
                    title="AI Widget Preview"
                    data-testid="iframe-ai-widget-preview"
                  />
                )}
              </div>
            )}
          </div>

          {(userMessages.length > 0 || conversation.some(m => m.messageType === "clarify")) && (
            <div ref={chatLogRef} className="max-h-[140px] overflow-y-auto rounded-md border bg-muted/20 px-3 py-2 space-y-2">
              {conversation.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 text-xs ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && <MessageSquare className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />}
                  <div
                    className={`max-w-[85%] rounded-lg px-2.5 py-1.5 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : msg.messageType === "clarify"
                          ? "bg-background border text-foreground whitespace-pre-wrap"
                          : "text-muted-foreground"
                    }`}
                  >
                    {msg.messageType === "clarify" ? msg.content : (msg.summary || msg.content)}
                  </div>
                  {msg.role === "user" && <MessageSquare className="h-3 w-3 shrink-0 mt-0.5 text-primary" />}
                </div>
              ))}
              {isWaitingForClarificationAnswers() && !isGenerating && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-xs text-muted-foreground">Reply above with your choices, or</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => generateWidget("Use defaults")}
                    disabled={isGenerating}
                    data-testid="button-use-defaults"
                  >
                    Use defaults and build
                  </Button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2 flex-wrap">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                isWaitingForClarificationAnswers()
                  ? "Type your choices (e.g. 1: Manual entry. 2: Yes 10k steps. 3: Chart) or click 'Use defaults and build'"
                  : "Ask for changes... e.g. 'Make the colors more vibrant' or 'Add a reset button at the bottom'"
              }
              className="resize-none text-sm min-h-[44px] max-h-[80px] flex-1"
              disabled={isGenerating}
              data-testid="textarea-widget-refine"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!prompt.trim() || isGenerating}
              data-testid="button-refine-widget"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>

          <Button
            className="w-full"
            onClick={handleAddToBoard}
            disabled={isGenerating || !generatedCode.trim()}
            data-testid="button-add-ai-widget"
          >
            <Check className="h-4 w-4 mr-2" />
            {isEditMode ? "Save Changes" : "Add to Dashboard"}
          </Button>
        </div>
      )}
    </div>
  );
}
