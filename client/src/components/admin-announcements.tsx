import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Trash2, Eye, EyeOff, Info, AlertTriangle, Sparkles, Users, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: string;
  targetType: string;
  targetUserIds: string[] | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
};

type UserInfo = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Info; color: string }> = {
  info: { label: "Info", icon: Info, color: "text-blue-500" },
  update: { label: "Update", icon: Sparkles, color: "text-green-500" },
  warning: { label: "Warning", icon: AlertTriangle, color: "text-yellow-500" },
};

export function AdminAnnouncementsDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("info");
  const [targetType, setTargetType] = useState("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements/admin"],
    enabled: open,
    retry: false,
  });

  const { data: allUsers } = useQuery<UserInfo[]>({
    queryKey: ["/api/admin/users"],
    enabled: open && targetType === "specific",
    retry: false,
  });

  const createAnnouncement = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/announcements", {
        title,
        content,
        type,
        targetType,
        targetUserIds: targetType === "specific" ? selectedUserIds : null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/admin"] });
      toast({ title: "Announcement published" });
      setTitle("");
      setContent("");
      setType("info");
      setTargetType("all");
      setSelectedUserIds([]);
    },
    onError: () => {
      toast({ title: "Failed to create announcement", variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/announcements/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/admin"] });
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/admin"] });
      toast({ title: "Announcement deleted" });
    },
  });

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Manage Announcements" data-testid="button-admin-announcements">
          <Megaphone className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" data-testid="admin-announcements-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Platform Announcements
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's new..."
                data-testid="input-announcement-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ann-content">Message</Label>
              <Textarea
                id="ann-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe the update, feature, or notice..."
                rows={3}
                data-testid="input-announcement-content"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-[120px]" data-testid="select-announcement-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Send to</Label>
                <Select value={targetType} onValueChange={(v) => { setTargetType(v); setSelectedUserIds([]); }}>
                  <SelectTrigger className="w-[150px]" data-testid="select-announcement-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="specific">Specific Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {targetType === "specific" && allUsers && (
              <div className="space-y-2">
                <Label>Select Users ({selectedUserIds.length} selected)</Label>
                <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                  {allUsers.map(u => (
                    <label
                      key={u.id}
                      className="flex items-center gap-2 text-sm cursor-pointer hover-elevate rounded px-2 py-1"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={() => toggleUserSelection(u.id)}
                        className="rounded"
                      />
                      <span className="truncate">
                        {u.firstName} {u.lastName}
                      </span>
                      <span className="text-muted-foreground text-xs truncate">
                        {u.email}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => createAnnouncement.mutate()}
              disabled={!title.trim() || !content.trim() || createAnnouncement.isPending || (targetType === "specific" && selectedUserIds.length === 0)}
              data-testid="button-publish-announcement"
            >
              {createAnnouncement.isPending ? "Publishing..." : "Publish Announcement"}
            </Button>
          </Card>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Existing Announcements</h3>
            {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {announcements?.length === 0 && (
              <p className="text-sm text-muted-foreground">No announcements yet</p>
            )}
            {announcements?.map(a => {
              const config = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
              const TypeIcon = config.icon;
              return (
                <Card key={a.id} className={`p-3 space-y-1 ${!a.isActive ? "opacity-50" : ""}`} data-testid={`announcement-${a.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TypeIcon className={`h-4 w-4 shrink-0 ${config.color}`} />
                      <span className="text-sm font-medium truncate">{a.title}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="secondary" className="text-[10px]">
                        {a.targetType === "all" ? (
                          <><Globe className="h-3 w-3 mr-0.5" /> All</>
                        ) : (
                          <><Users className="h-3 w-3 mr-0.5" /> {a.targetUserIds?.length}</>
                        )}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleActive.mutate({ id: a.id, isActive: !a.isActive })}
                        title={a.isActive ? "Deactivate" : "Activate"}
                        data-testid={`button-toggle-announcement-${a.id}`}
                      >
                        {a.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteAnnouncement.mutate(a.id)}
                        data-testid={`button-delete-announcement-${a.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.content}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
