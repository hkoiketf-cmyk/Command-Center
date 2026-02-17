import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Plus, LayoutGrid, Presentation, ExternalLink, Pencil, Trash2, MoreVertical, ChevronLeft, ChevronRight, Image, Globe, Eye, EyeOff } from "lucide-react";
import type { Ad, AdBoardContent } from "@shared/schema";

interface AdBoardWidgetProps {
  content: AdBoardContent;
  onContentChange: (content: AdBoardContent) => void;
  isAdmin?: boolean;
}

export function AdBoardWidget({ content, onContentChange, isAdmin = false }: AdBoardWidgetProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "spotlight">(content.viewMode || "grid");
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteAdId, setDeleteAdId] = useState<string | null>(null);
  const [isManaging, setIsManaging] = useState(false);

  const rotationInterval = content.rotationInterval || 5;
  const showOwnAds = content.showOwnAds !== false;
  const showGlobalAds = content.showGlobalAds !== false;

  const { data: userAds = [] } = useQuery<Ad[]>({
    queryKey: ["/api/ads"],
  });

  const { data: globalAds = [] } = useQuery<Ad[]>({
    queryKey: ["/api/ads/global"],
  });

  const allAds = [
    ...(showGlobalAds ? globalAds : []),
    ...(showOwnAds ? userAds.filter(a => !a.isGlobal) : []),
  ].filter(a => a.active);

  const createAd = useMutation({
    mutationFn: async (data: Partial<Ad>) => {
      const res = await apiRequest("POST", "/api/ads", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ads/global"] });
      setShowCreateDialog(false);
      toast({ title: "Ad created" });
    },
    onError: () => {
      toast({ title: "Failed to create ad", variant: "destructive" });
    },
  });

  const updateAd = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Ad> & { id: string }) => {
      const res = await apiRequest("PATCH", `/api/ads/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ads/global"] });
      setEditingAd(null);
      toast({ title: "Ad updated" });
    },
    onError: () => {
      toast({ title: "Failed to update ad", variant: "destructive" });
    },
  });

  const deleteAd = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/ads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ads/global"] });
      setDeleteAdId(null);
      toast({ title: "Ad deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete ad", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (viewMode === "spotlight" && allAds.length > 1) {
      const timer = setInterval(() => {
        setSpotlightIndex(prev => (prev + 1) % allAds.length);
      }, rotationInterval * 1000);
      return () => clearInterval(timer);
    }
  }, [viewMode, allAds.length, rotationInterval]);

  useEffect(() => {
    if (spotlightIndex >= allAds.length && allAds.length > 0) {
      setSpotlightIndex(0);
    }
  }, [allAds.length, spotlightIndex]);

  const toggleViewMode = useCallback(() => {
    const newMode = viewMode === "grid" ? "spotlight" : "grid";
    setViewMode(newMode);
    onContentChange({ ...content, viewMode: newMode });
  }, [viewMode, content, onContentChange]);

  const handlePrev = () => {
    setSpotlightIndex(prev => (prev - 1 + allAds.length) % allAds.length);
  };

  const handleNext = () => {
    setSpotlightIndex(prev => (prev + 1) % allAds.length);
  };

  if (isManaging) {
    return (
      <ManageAdsView
        userAds={userAds}
        isAdmin={isAdmin}
        onBack={() => setIsManaging(false)}
        onEdit={setEditingAd}
        onDelete={setDeleteAdId}
        onToggleActive={(ad) => {
          updateAd.mutate({ id: ad.id, active: !ad.active });
        }}
        showCreateDialog={showCreateDialog}
        setShowCreateDialog={setShowCreateDialog}
        createAd={createAd}
        editingAd={editingAd}
        setEditingAd={setEditingAd}
        updateAdMutation={updateAd}
        deleteAdId={deleteAdId}
        setDeleteAdId={setDeleteAdId}
        deleteAdMutation={deleteAd}
      />
    );
  }

  if (allAds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-4 text-center">
        <Image className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No ads to display</p>
        <div className="flex gap-2 flex-wrap justify-center">
          <Button size="sm" variant="outline" onClick={() => setIsManaging(true)} data-testid="button-manage-ads-empty">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Ad
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border flex-wrap">
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={viewMode === "grid" ? "default" : "ghost"}
            onClick={() => { setViewMode("grid"); onContentChange({ ...content, viewMode: "grid" }); }}
            className="h-7 px-2"
            data-testid="button-view-grid"
          >
            <LayoutGrid className="h-3.5 w-3.5 mr-1" />
            Grid
          </Button>
          <Button
            size="sm"
            variant={viewMode === "spotlight" ? "default" : "ghost"}
            onClick={() => { setViewMode("spotlight"); onContentChange({ ...content, viewMode: "spotlight" }); }}
            className="h-7 px-2"
            data-testid="button-view-spotlight"
          >
            <Presentation className="h-3.5 w-3.5 mr-1" />
            Spotlight
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {allAds.length} ad{allAds.length !== 1 ? "s" : ""}
          </Badge>
          <Button size="sm" variant="ghost" onClick={() => setIsManaging(true)} data-testid="button-manage-ads">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        ) : (
          <SpotlightView
            ads={allAds}
            currentIndex={spotlightIndex}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}
      </div>
    </div>
  );
}

function AdCard({ ad, compact = false }: { ad: Ad; compact?: boolean }) {
  return (
    <Card className="overflow-hidden flex flex-col" data-testid={`card-ad-${ad.id}`}>
      {ad.imageUrl && (
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <img
            src={ad.imageUrl}
            alt={ad.headline}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      )}
      <div className={`p-3 flex flex-col gap-1.5 flex-1 ${compact ? "p-2" : "p-3"}`}>
        <h3 className={`font-semibold leading-tight ${compact ? "text-sm" : "text-base"}`}>
          {ad.headline}
        </h3>
        {ad.description && (
          <p className={`text-muted-foreground leading-relaxed ${compact ? "text-xs line-clamp-2" : "text-sm line-clamp-3"}`}>
            {ad.description}
          </p>
        )}
        {ad.ctaLink && (
          <a
            href={ad.ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto pt-1.5"
            data-testid={`link-ad-cta-${ad.id}`}
          >
            <Button size="sm" className="w-full">
              {ad.ctaText || "Learn More"}
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </a>
        )}
        {ad.isGlobal && (
          <div className="flex items-center gap-1 mt-1">
            <Globe className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sponsored</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function SpotlightView({
  ads,
  currentIndex,
  onPrev,
  onNext,
}: {
  ads: Ad[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const ad = ads[currentIndex];
  if (!ad) return null;

  return (
    <div className="flex flex-col h-full gap-3" data-testid="spotlight-view">
      <div className="flex-1 flex flex-col">
        {ad.imageUrl && (
          <div className="relative w-full rounded-md overflow-hidden" style={{ paddingBottom: "50%" }}>
            <img
              src={ad.imageUrl}
              alt={ad.headline}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
        <div className="py-3 flex flex-col gap-2 flex-1">
          <h2 className="text-lg font-bold leading-tight">{ad.headline}</h2>
          {ad.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{ad.description}</p>
          )}
          {ad.ctaLink && (
            <a href={ad.ctaLink} target="_blank" rel="noopener noreferrer" className="mt-auto" data-testid={`link-spotlight-cta-${ad.id}`}>
              <Button className="w-full">
                {ad.ctaText || "Learn More"}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </a>
          )}
          {ad.isGlobal && (
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Sponsored</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        <Button size="icon" variant="ghost" onClick={onPrev} data-testid="button-spotlight-prev">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1.5">
          {ads.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === currentIndex ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
            />
          ))}
        </div>
        <Button size="icon" variant="ghost" onClick={onNext} data-testid="button-spotlight-next">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function AdForm({
  ad,
  isAdmin,
  onSubmit,
  isPending,
}: {
  ad?: Ad | null;
  isAdmin: boolean;
  onSubmit: (data: Partial<Ad>) => void;
  isPending: boolean;
}) {
  const [headline, setHeadline] = useState(ad?.headline || "");
  const [description, setDescription] = useState(ad?.description || "");
  const [imageUrl, setImageUrl] = useState(ad?.imageUrl || "");
  const [ctaText, setCtaText] = useState(ad?.ctaText || "Learn More");
  const [ctaLink, setCtaLink] = useState(ad?.ctaLink || "");
  const [isGlobal, setIsGlobal] = useState(ad?.isGlobal || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<Ad> = {
      ...(ad ? { id: ad.id } : {}),
      headline,
      description,
      imageUrl,
      ctaText,
      ctaLink,
    };
    if (isAdmin) {
      data.isGlobal = isGlobal;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="headline">Headline *</Label>
        <Input
          id="headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Your ad headline"
          required
          data-testid="input-ad-headline"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of your offer"
          className="resize-none"
          rows={3}
          data-testid="input-ad-description"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          data-testid="input-ad-image-url"
        />
        {imageUrl && (
          <div className="rounded-md overflow-hidden border border-border">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-24 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ctaText">Button Text</Label>
          <Input
            id="ctaText"
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            placeholder="Learn More"
            data-testid="input-ad-cta-text"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ctaLink">Button Link</Label>
          <Input
            id="ctaLink"
            value={ctaLink}
            onChange={(e) => setCtaLink(e.target.value)}
            placeholder="https://..."
            data-testid="input-ad-cta-link"
          />
        </div>
      </div>
      {isAdmin && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
          <Switch
            checked={isGlobal}
            onCheckedChange={setIsGlobal}
            data-testid="switch-ad-global"
          />
          <div>
            <Label className="text-sm font-medium">Global Ad</Label>
            <p className="text-xs text-muted-foreground">Show this ad on all users' Ad Boards</p>
          </div>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={!headline.trim() || isPending} data-testid="button-submit-ad">
        {isPending ? "Saving..." : (ad ? "Update Ad" : "Create Ad")}
      </Button>
    </form>
  );
}

function ManageAdsView({
  userAds,
  isAdmin,
  onBack,
  onEdit,
  onDelete,
  onToggleActive,
  showCreateDialog,
  setShowCreateDialog,
  createAd,
  editingAd,
  setEditingAd,
  updateAdMutation,
  deleteAdId,
  setDeleteAdId,
  deleteAdMutation,
}: {
  userAds: Ad[];
  isAdmin: boolean;
  onBack: () => void;
  onEdit: (ad: Ad) => void;
  onDelete: (id: string) => void;
  onToggleActive: (ad: Ad) => void;
  showCreateDialog: boolean;
  setShowCreateDialog: (v: boolean) => void;
  createAd: any;
  editingAd: Ad | null;
  setEditingAd: (ad: Ad | null) => void;
  updateAdMutation: any;
  deleteAdId: string | null;
  setDeleteAdId: (id: string | null) => void;
  deleteAdMutation: any;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border flex-wrap">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onBack} data-testid="button-back-from-manage">
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Back
          </Button>
          <span className="text-sm font-medium">Manage Ads</span>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-create-ad">
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Ad
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Ad</DialogTitle>
            </DialogHeader>
            <AdForm
              isAdmin={isAdmin}
              onSubmit={(data) => createAd.mutate(data)}
              isPending={createAd.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {userAds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-sm text-muted-foreground">No ads yet. Create your first ad!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {userAds.map((ad) => (
              <div
                key={ad.id}
                className="flex items-center gap-3 p-2.5 rounded-md border border-border"
                data-testid={`manage-ad-${ad.id}`}
              >
                {ad.imageUrl ? (
                  <img src={ad.imageUrl} alt="" className="w-12 h-12 rounded-md object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Image className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ad.headline}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {ad.isGlobal && <Badge variant="secondary" className="text-xs"><Globe className="h-2.5 w-2.5 mr-1" />Global</Badge>}
                    {!ad.active && <Badge variant="outline" className="text-xs"><EyeOff className="h-2.5 w-2.5 mr-1" />Hidden</Badge>}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" data-testid={`button-ad-menu-${ad.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(ad)} data-testid={`button-edit-ad-${ad.id}`}>
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleActive(ad)} data-testid={`button-toggle-ad-${ad.id}`}>
                      {ad.active ? <EyeOff className="h-3.5 w-3.5 mr-2" /> : <Eye className="h-3.5 w-3.5 mr-2" />}
                      {ad.active ? "Hide" : "Show"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(ad.id)} className="text-destructive" data-testid={`button-delete-ad-${ad.id}`}>
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editingAd} onOpenChange={(open) => !open && setEditingAd(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ad</DialogTitle>
          </DialogHeader>
          {editingAd && (
            <AdForm
              ad={editingAd}
              isAdmin={isAdmin}
              onSubmit={(data) => updateAdMutation.mutate(data)}
              isPending={updateAdMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteAdId} onOpenChange={(open) => !open && setDeleteAdId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ad</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ad? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-ad">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAdId && deleteAdMutation.mutate(deleteAdId)}
              data-testid="button-confirm-delete-ad"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
