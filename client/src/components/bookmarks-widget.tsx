import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Trash2, Edit, Star, ExternalLink, Plus, X as XIcon, Save, Tag, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Bookmark, BookmarksContent } from "@shared/schema";

interface BookmarksWidgetProps {
  widgetId: string;
  content: BookmarksContent;
  onContentChange: (content: BookmarksContent) => void;
}

export function BookmarksWidget({ widgetId, content, onContentChange }: BookmarksWidgetProps) {
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
    category: "General",
    tags: "",
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const { data: bookmarks = [], isLoading } = useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks", widgetId],
    queryFn: () => fetch(`/api/bookmarks?widgetId=${widgetId}`).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/bookmarks", { ...data, widgetId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks", widgetId] });
      setIsAddDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/bookmarks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks", widgetId] });
      setEditingBookmark(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/bookmarks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/bookmarks", widgetId] }),
  });

  const toggleStarMutation = useMutation({
    mutationFn: ({ id, starred }: { id: string; starred: boolean }) =>
      apiRequest("PATCH", `/api/bookmarks/${id}`, { starred: !starred }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/bookmarks", widgetId] }),
  });

  const resetForm = () => {
    setFormData({ title: "", url: "", description: "", category: "General", tags: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = formData.tags.split(",").map(t => t.trim()).filter(Boolean);
    
    if (editingBookmark) {
      updateMutation.mutate({
        id: editingBookmark.id,
        title: formData.title,
        url: formData.url,
        description: formData.description,
        category: formData.category,
        tags,
      });
    } else {
      createMutation.mutate({
        title: formData.title,
        url: formData.url,
        description: formData.description,
        category: formData.category,
        tags,
      });
    }
  };

  const openEditDialog = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setFormData({
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.description || "",
      category: bookmark.category || "General",
      tags: bookmark.tags?.join(", ") || "",
    });
  };

  const categories = ["All", ...Array.from(new Set(bookmarks.map(b => b.category || "General")))];
  const filteredBookmarks = selectedCategory === "All" 
    ? bookmarks 
    : bookmarks.filter(b => b.category === selectedCategory);
  
  const starredBookmarks = filteredBookmarks.filter(b => b.starred);
  const regularBookmarks = filteredBookmarks.filter(b => !b.starred);

  return (
    <div className="flex flex-col h-full gap-3 p-3" data-testid="widget-bookmarks">
      <div className="flex items-center gap-2">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          size="sm" 
          onClick={() => setIsAddDialogOpen(true)}
          className="ml-auto"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
        
        {starredBookmarks.length > 0 && (
          <div className="space-y-2">
            {starredBookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={openEditDialog}
                onDelete={deleteMutation.mutate}
                onToggleStar={toggleStarMutation.mutate}
              />
            ))}
          </div>
        )}

        {regularBookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            onEdit={openEditDialog}
            onDelete={deleteMutation.mutate}
            onToggleStar={toggleStarMutation.mutate}
          />
        ))}

        {filteredBookmarks.length === 0 && !isLoading && (
          <div className="text-sm text-muted-foreground text-center py-8">
            No bookmarks yet. Click Add to create one.
          </div>
        )}
      </div>

      <Dialog open={isAddDialogOpen || !!editingBookmark} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingBookmark(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBookmark ? "Edit Bookmark" : "Add Bookmark"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="My Favorite Site"
                required
              />
            </div>
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="General, Work, Learning, etc."
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="productivity, tools, reference"
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingBookmark(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingBookmark ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookmarkCard({ 
  bookmark, 
  onEdit, 
  onDelete, 
  onToggleStar 
}: { 
  bookmark: Bookmark; 
  onEdit: (b: Bookmark) => void;
  onDelete: (id: string) => void;
  onToggleStar: (data: { id: string; starred: boolean }) => void;
}) {
  return (
    <div className="flex flex-col gap-2 p-3 rounded-md border border-border group hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => onToggleStar({ id: bookmark.id, starred: bookmark.starred || false })}
        >
          <Star className={`h-4 w-4 ${bookmark.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
        </Button>
        <div className="flex-1 min-w-0">
          <a 
            href={bookmark.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-medium text-sm hover:underline flex items-center gap-1 group/link"
          >
            <span className="truncate">{bookmark.title}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </a>
          {bookmark.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{bookmark.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {bookmark.category && (
              <Badge variant="outline" className="text-xs h-5">
                <FolderOpen className="h-3 w-3 mr-1" />
                {bookmark.category}
              </Badge>
            )}
            {bookmark.tags?.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs h-5">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(bookmark)}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDelete(bookmark.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
