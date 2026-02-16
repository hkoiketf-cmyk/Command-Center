import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Plus, Trash2, MessageSquare, Loader2 } from "lucide-react";
import type { AiConversation, AiMessage } from "@shared/schema";

export function AiChatWidget() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: conversations = [] } = useQuery<AiConversation[]>({
    queryKey: ["/api/ai/conversations"],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<AiMessage[]>({
    queryKey: [`/api/ai/conversations/${activeConversationId}/messages`],
    enabled: !!activeConversationId,
  });

  const createConversation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/conversations", { title: "New Chat" });
      return res.json();
    },
    onSuccess: (conv: AiConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
      setActiveConversationId(conv.id);
      setShowSidebar(false);
    },
  });

  const deleteConversation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/ai/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
      if (activeConversationId) {
        setActiveConversationId(null);
      }
    },
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;

    let convId = activeConversationId;

    if (!convId) {
      const res = await apiRequest("POST", "/api/ai/conversations", { title: inputValue.substring(0, 50) });
      const conv: AiConversation = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
      convId = conv.id;
      setActiveConversationId(conv.id);
    }

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch(`/api/ai/conversations/${convId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to send message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response stream");

      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) break;
              if (data.error) throw new Error(data.error);
              if (data.content) {
                accumulated += data.content;
                setStreamingContent(accumulated);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setStreamingContent(`Error: ${error.message}`);
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      queryClient.invalidateQueries({ queryKey: [`/api/ai/conversations/${convId}/messages`] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
    }
  };

  const formatMessage = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const code = part.slice(3, -3).replace(/^\w+\n/, "");
        return (
          <pre key={i} className="bg-muted rounded-md p-2 my-1 overflow-x-auto text-xs font-mono whitespace-pre-wrap">
            {code}
          </pre>
        );
      }
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={i}>
          {boldParts.map((bp, j) => {
            if (bp.startsWith("**") && bp.endsWith("**")) {
              return <strong key={j}>{bp.slice(2, -2)}</strong>;
            }
            return bp;
          })}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col h-full" data-testid="ai-chat-widget">
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border shrink-0">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowSidebar(!showSidebar)}
          data-testid="button-toggle-chat-sidebar"
          className="text-xs"
        >
          <MessageSquare className="h-3.5 w-3.5 mr-1" />
          Chats
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => createConversation.mutate()}
          data-testid="button-new-chat"
          className="text-xs ml-auto"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          New
        </Button>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {showSidebar && (
          <div className="w-40 border-r border-border shrink-0 overflow-y-auto bg-muted/30">
            {conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">No conversations</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer text-xs group hover-elevate ${
                    activeConversationId === conv.id ? "bg-accent" : ""
                  }`}
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    setShowSidebar(false);
                  }}
                  data-testid={`button-conversation-${conv.id}`}
                >
                  <span className="truncate flex-1">{conv.title}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 invisible group-hover:visible shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation.mutate(conv.id);
                    }}
                    data-testid={`button-delete-conversation-${conv.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex-1 overflow-y-auto px-2 py-1">
            {!activeConversationId && !isStreaming ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-2">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Start a conversation with your AI assistant
                </p>
                <p className="text-xs text-muted-foreground">
                  Type a message below to begin
                </p>
              </div>
            ) : messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2 pb-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${msg.role}-${msg.id}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-md px-2.5 py-1.5 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {formatMessage(msg.content)}
                    </div>
                  </div>
                ))}
                {isStreaming && streamingContent && (
                  <div className="flex justify-start" data-testid="message-streaming">
                    <div className="max-w-[85%] rounded-md px-2.5 py-1.5 text-xs leading-relaxed bg-muted">
                      {formatMessage(streamingContent)}
                      <span className="inline-block w-1.5 h-3 bg-foreground/50 animate-pulse ml-0.5" />
                    </div>
                  </div>
                )}
                {isStreaming && !streamingContent && (
                  <div className="flex justify-start" data-testid="message-thinking">
                    <div className="max-w-[85%] rounded-md px-2.5 py-1.5 text-xs bg-muted">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="px-2 py-1.5 border-t border-border shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-1"
              data-testid="form-chat-input"
            >
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
                disabled={isStreaming}
                className="text-xs h-8"
                data-testid="input-chat-message"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim() || isStreaming}
                data-testid="button-send-message"
                className="h-8 w-8 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}