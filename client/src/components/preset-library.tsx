import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Library, Plus, Globe, Lock, Trash2, LayoutTemplate, Loader2 } from "lucide-react";
import type { DashboardPreset } from "@shared/schema";

interface PresetLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeDesktopId: string | null;
  isAdmin: boolean;
  onPresetApplied: (desktopId: string) => void;
}

export function PresetLibrary({ open, onOpenChange, activeDesktopId, isAdmin, onPresetApplied }: PresetLibraryProps) {
  const { toast } = useToast();
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [saveCategory, setSaveCategory] = useState("");
  const [savePublic, setSavePublic] = useState(false);

  const { data: presets = [], isLoading } = useQuery<DashboardPreset[]>({
    queryKey: ["/api/presets"],
    enabled: open,
  });

  const applyPreset = useMutation({
    mutationFn: async ({ presetId, desktopName }: { presetId: string; desktopName?: string }) => {
      const res = await apiRequest("POST", `/api/presets/${presetId}/apply`, { desktopName });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/desktops"] });
      queryClient.invalidateQueries({ queryKey: ["/api/widgets"] });
      toast({ title: "Preset applied!", description: `Created new desktop with ${data.widgetCount} widgets.` });
      onOpenChange(false);
      if (data.desktop?.id) {
        onPresetApplied(data.desktop.id);
      }
    },
    onError: () => {
      toast({ title: "Failed to apply preset", variant: "destructive" });
    },
  });

  const saveDesktopAsPreset = useMutation({
    mutationFn: async (data: { name: string; description: string; category: string; isPublic: boolean }) => {
      const res = await apiRequest("POST", `/api/presets/save-desktop/${activeDesktopId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      toast({ title: "Preset saved!" });
      setShowSaveForm(false);
      setSaveName("");
      setSaveDescription("");
      setSaveCategory("");
      setSavePublic(false);
    },
    onError: () => {
      toast({ title: "Failed to save preset", variant: "destructive" });
    },
  });

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/presets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      toast({ title: "Preset deleted" });
    },
  });

  const publicPresets = presets.filter(p => p.isPublic);
  const myPresets = presets.filter(p => !p.isPublic);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="preset-library-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            Preset Library
          </DialogTitle>
          <DialogDescription>
            Browse templates or save your current desktop as a reusable preset.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap">
          {activeDesktopId && (
            <Button
              variant="outline"
              onClick={() => setShowSaveForm(!showSaveForm)}
              data-testid="button-save-as-preset"
            >
              <Plus className="h-4 w-4 mr-1" />
              Save Current Desktop as Preset
            </Button>
          )}
        </div>

        {showSaveForm && (
          <Card className="p-4 space-y-3" data-testid="save-preset-form">
            <div className="space-y-1.5">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g., Content Creator Dashboard"
                data-testid="input-preset-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preset-description">Description</Label>
              <Textarea
                id="preset-description"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="What this preset includes..."
                className="resize-none"
                data-testid="input-preset-description"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preset-category">Category</Label>
              <Input
                id="preset-category"
                value={saveCategory}
                onChange={(e) => setSaveCategory(e.target.value)}
                placeholder="e.g., Content, Business, Personal"
                data-testid="input-preset-category"
              />
            </div>
            {isAdmin && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={savePublic}
                  onChange={(e) => setSavePublic(e.target.checked)}
                  className="rounded"
                  data-testid="checkbox-preset-public"
                />
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Make available to all users</span>
              </label>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowSaveForm(false)} data-testid="button-cancel-save-preset">
                Cancel
              </Button>
              <Button
                onClick={() => saveDesktopAsPreset.mutate({ name: saveName, description: saveDescription, category: saveCategory, isPublic: savePublic })}
                disabled={!saveName.trim() || saveDesktopAsPreset.isPending}
                data-testid="button-confirm-save-preset"
              >
                {saveDesktopAsPreset.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Save Preset
              </Button>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {publicPresets.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  Public Templates
                </h3>
                <div className="grid gap-3">
                  {publicPresets.map((preset) => (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      onApply={() => applyPreset.mutate({ presetId: preset.id })}
                      onDelete={isAdmin ? () => deletePreset.mutate(preset.id) : undefined}
                      isApplying={applyPreset.isPending}
                    />
                  ))}
                </div>
              </div>
            )}

            {myPresets.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-4 w-4" />
                  My Presets
                </h3>
                <div className="grid gap-3">
                  {myPresets.map((preset) => (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      onApply={() => applyPreset.mutate({ presetId: preset.id })}
                      onDelete={() => deletePreset.mutate(preset.id)}
                      isApplying={applyPreset.isPending}
                    />
                  ))}
                </div>
              </div>
            )}

            {publicPresets.length === 0 && myPresets.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <LayoutTemplate className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No presets yet.</p>
                <p className="text-xs mt-1">Save your current desktop layout as a reusable preset.</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PresetCard({ preset, onApply, onDelete, isApplying }: {
  preset: DashboardPreset;
  onApply: () => void;
  onDelete?: () => void;
  isApplying: boolean;
}) {
  const widgetList = preset.widgets as any[];

  return (
    <Card className="p-3 space-y-2" data-testid={`preset-card-${preset.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm" data-testid={`text-preset-name-${preset.id}`}>{preset.name}</span>
            {preset.category && (
              <Badge variant="secondary" className="text-xs" data-testid={`badge-preset-category-${preset.id}`}>
                {preset.category}
              </Badge>
            )}
            {preset.isPublic && (
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-0.5" />
                Public
              </Badge>
            )}
          </div>
          {preset.description && (
            <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {widgetList.length} widget{widgetList.length !== 1 ? "s" : ""}:
            {" "}{widgetList.map(w => w.title || w.type).join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            onClick={onApply}
            disabled={isApplying}
            data-testid={`button-apply-preset-${preset.id}`}
          >
            {isApplying ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <LayoutTemplate className="h-3 w-3 mr-1" />}
            Use
          </Button>
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              data-testid={`button-delete-preset-${preset.id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
