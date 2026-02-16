import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Info, Sparkles, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: string;
  targetType: string;
  isActive: boolean;
  isRead: boolean;
  createdAt: string;
};

const TYPE_CONFIG: Record<string, { icon: typeof Info; color: string; bg: string }> = {
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
  update: { icon: Sparkles, color: "text-green-500", bg: "bg-green-500/10" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" },
};

export function NotificationsBell() {
  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    refetchInterval: 60000,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/announcements/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
    },
  });

  const unreadCount = announcements?.filter(a => !a.isRead).length || 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
              data-testid="badge-unread-count"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" data-testid="notifications-popover">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {(!announcements || announcements.length === 0) && (
            <div className="p-4 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          )}
          {announcements?.map(a => {
            const config = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
            const TypeIcon = config.icon;
            return (
              <div
                key={a.id}
                className={`px-4 py-3 border-b last:border-b-0 ${!a.isRead ? "bg-primary/5" : ""}`}
                data-testid={`notification-${a.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${config.bg}`}>
                    <TypeIcon className={`h-3.5 w-3.5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${!a.isRead ? "" : "text-muted-foreground"}`}>
                        {a.title}
                      </p>
                      {!a.isRead && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => markRead.mutate(a.id)}
                          title="Mark as read"
                          data-testid={`button-mark-read-${a.id}`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
