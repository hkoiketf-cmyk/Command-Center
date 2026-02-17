import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Blocks, Plus, Pencil, Trash2, Eye, Code, X } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WidgetTemplate } from "@shared/schema";

export function AdminWidgetTemplates() {
  const [open, setOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WidgetTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const { data: templates, isLoading } = useQuery<WidgetTemplate[]>({
    queryKey: ["/api/widget-templates"],
    enabled: open,
  });

  const createTemplate = useMutation({
    mutationFn: (data: { name: string; description: string; code: string; isPublic: boolean }) =>
      apiRequest("POST", "/api/widget-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/widget-templates"] });
      toast({ title: "Template created" });
      resetEditor();
    },
  });

  const updateTemplate = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; description: string; code: string; isPublic: boolean }) =>
      apiRequest("PATCH", `/api/widget-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/widget-templates"] });
      toast({ title: "Template updated" });
      resetEditor();
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/widget-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/widget-templates"] });
      toast({ title: "Template deleted" });
    },
  });

  const resetEditor = () => {
    setShowEditor(false);
    setEditingTemplate(null);
    setName("");
    setDescription("");
    setCode("");
    setIsPublic(false);
    setShowPreview(false);
  };

  const openEditor = (template?: WidgetTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setName(template.name);
      setDescription(template.description);
      setCode(template.code);
      setIsPublic(template.isPublic);
    } else {
      setEditingTemplate(null);
      setName("");
      setDescription("");
      setCode(DEFAULT_TEMPLATE_CODE);
      setIsPublic(false);
    }
    setShowEditor(true);
    setShowPreview(false);
  };

  const handleSave = () => {
    if (!name.trim() || !code.trim()) {
      toast({ title: "Name and code are required", variant: "destructive" });
      return;
    }
    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate.id, name: name.trim(), description: description.trim(), code: code.trim(), isPublic });
    } else {
      createTemplate.mutate({ name: name.trim(), description: description.trim(), code: code.trim(), isPublic });
    }
  };

  const wrapCode = (rawCode: string): string => {
    const trimmed = rawCode.trim();
    if (trimmed.toLowerCase().startsWith("<!doctype") || trimmed.toLowerCase().startsWith("<html")) {
      return rawCode;
    }
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; background: transparent; }
  </style>
</head>
<body>
${rawCode}
</body>
</html>`;
  };

  const isPending = createTemplate.isPending || updateTemplate.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetEditor(); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-admin-widget-templates">
          <Blocks className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Blocks className="h-5 w-5" />
            Widget Template Builder
          </DialogTitle>
        </DialogHeader>

        {!showEditor ? (
          <div className="space-y-4">
            <Button onClick={() => openEditor()} data-testid="button-new-template">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Loading templates...</div>
            ) : !templates?.length ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No templates yet. Create your first one.</div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Blocks className="h-4 w-4" />
                        {template.name}
                        {template.isPublic ? (
                          <Badge variant="default" className="text-xs">Public</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Draft</Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditor(template)}
                          data-testid={`button-edit-template-${template.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-delete-template-${template.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Template</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove this template. Existing widgets using it will keep their code.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteTemplate.mutate(template.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    {template.description && (
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={resetEditor} data-testid="button-back-to-templates">
                <X className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant={showPreview ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  data-testid="button-toggle-preview"
                >
                  {showPreview ? <Code className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showPreview ? "Code" : "Preview"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Name</Label>
                <Input
                  id="template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Widget"
                  data-testid="input-template-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Input
                  id="template-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What this widget does..."
                  data-testid="input-template-description"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="template-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                data-testid="switch-template-public"
              />
              <Label htmlFor="template-public" className="text-sm">
                Make public (visible to all users)
              </Label>
            </div>

            {showPreview ? (
              <div className="border rounded-lg overflow-hidden" style={{ height: "300px" }}>
                <iframe
                  srcDoc={wrapCode(code)}
                  sandbox="allow-scripts allow-same-origin"
                  className="w-full h-full border-0"
                  title="Widget Preview"
                  data-testid="iframe-template-preview"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>HTML / CSS / JS Code</Label>
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="font-mono text-xs min-h-[300px] resize-y"
                  placeholder="Enter your widget HTML/CSS/JS code..."
                  data-testid="textarea-template-code"
                />
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={isPending || !name.trim() || !code.trim()}
              data-testid="button-save-template"
            >
              {isPending ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const DEFAULT_TEMPLATE_CODE = `<div style="text-align: center; padding: 20px;">
  <h2 style="margin: 0 0 10px; font-size: 18px;">My Custom Widget</h2>
  <p style="color: #888; font-size: 14px;">Edit this code to build your widget</p>
</div>

<style>
  h2 { color: #fff; }
</style>`;
