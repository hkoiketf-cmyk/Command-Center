import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Trash2, Check, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CaptureItem } from "@shared/schema";

export function QuickCaptureWidget({ widgetId }: { widgetId: string }) {
  const [input, setInput] = useState("");

  const { data: items = [], isLoading } = useQuery<CaptureItem[]>({
    queryKey: ["/api/capture-items", widgetId],
    queryFn: () => fetch(`/api/capture-items?widgetId=${widgetId}`).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (text: string) => apiRequest("POST", "/api/capture-items", { text, widgetId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/capture-items", widgetId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, processed }: { id: string; processed: boolean }) =>
      apiRequest("PATCH", `/api/capture-items/${id}`, { processed, widgetId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/capture-items", widgetId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/capture-items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/capture-items", widgetId] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      createMutation.mutate(input.trim());
      setInput("");
    }
  };

  const unprocessed = items.filter((i) => !i.processed);
  const processed = items.filter((i) => i.processed);

  return (
    <div className="flex flex-col h-full gap-3 p-3" data-testid="widget-quick-capture">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Capture a thought..."
          className="flex-1"
          data-testid="input-capture"
          autoComplete="off"
        />
        <Button type="submit" size="sm" disabled={!input.trim() || createMutation.isPending} data-testid="button-capture-add">
          Add
        </Button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
        {unprocessed.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-2 rounded-md border border-border group"
            data-testid={`capture-item-${item.id}`}
          >
            <span className="flex-1 text-sm break-words">{item.text}</span>
            <div className="flex gap-1 shrink-0 visibility-hidden group-hover:visibility-visible" style={{ visibility: "hidden" }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => updateMutation.mutate({ id: item.id, processed: true })}
                data-testid={`button-process-${item.id}`}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => deleteMutation.mutate(item.id)}
                data-testid={`button-delete-capture-${item.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {unprocessed.length === 0 && !isLoading && (
          <div className="text-sm text-muted-foreground text-center py-4">
            Inbox empty. Type a thought and hit enter.
          </div>
        )}

        {processed.length > 0 && (
          <div className="pt-3 border-t border-border mt-3">
            <div className="text-xs text-muted-foreground mb-2">Processed ({processed.length})</div>
            {processed.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-1.5 opacity-50"
                data-testid={`capture-processed-${item.id}`}
              >
                <Check className="h-3 w-3 shrink-0" />
                <span className="flex-1 text-xs line-through break-words">{item.text}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => deleteMutation.mutate(item.id)}
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground text-right">
        {unprocessed.length} item{unprocessed.length !== 1 ? "s" : ""} in inbox
      </div>
    </div>
  );
}
