import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AccessCode = {
  id: string;
  code: string;
  label: string | null;
  maxUses: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
};

export function AdminCodesDialog() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const { toast } = useToast();

  const { data: codes, isLoading } = useQuery<AccessCode[]>({
    queryKey: ["/api/access-codes"],
    enabled: open,
    retry: false,
  });

  const createCode = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/access-codes", {
        label: label || null,
        maxUses: parseInt(maxUses) || 1,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-codes"] });
      setLabel("");
      setMaxUses("1");
      toast({ title: "Access code created" });
    },
    onError: (error: any) => {
      if (error?.message?.includes("403")) {
        toast({ title: "Admin access required", description: "Set your user ID in ADMIN_USER_IDS.", variant: "destructive" });
      } else {
        toast({ title: "Error creating code", variant: "destructive" });
      }
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: `Code ${code} copied to clipboard.` });
  };

  const isAdmin = codes !== undefined || isLoading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Access Codes"
          data-testid="button-admin-codes"
        >
          <KeyRound className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Access Codes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Label (optional)</Label>
            <Input
              placeholder="e.g. Mom, Friend John"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              data-testid="input-code-label"
            />
          </div>
          <div className="space-y-2">
            <Label>Max uses</Label>
            <Input
              type="number"
              min="1"
              max="100"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              data-testid="input-code-max-uses"
            />
          </div>
          <Button
            onClick={() => createCode.mutate()}
            disabled={createCode.isPending}
            className="w-full"
            data-testid="button-generate-code"
          >
            {createCode.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate Code
          </Button>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : codes && codes.length > 0 ? (
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-muted-foreground">Existing Codes</Label>
              {codes.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold tracking-wider">{c.code}</span>
                      {c.label && <span className="text-sm text-muted-foreground truncate">{c.label}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {c.usedCount}/{c.maxUses} used
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {!c.active || c.usedCount >= c.maxUses ? (
                      <Badge variant="secondary" className="text-xs">Used</Badge>
                    ) : (
                      <Badge variant="default" className="text-xs">Active</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyCode(c.code)}
                      data-testid={`button-copy-code-${c.code}`}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
