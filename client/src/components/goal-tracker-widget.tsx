import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Trash2, Edit, Plus, Check, Target as TargetIcon, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Goal, GoalTrackerContent } from "@shared/schema";

interface GoalTrackerWidgetProps {
  widgetId: string;
  content: GoalTrackerContent;
  onContentChange: (content: GoalTrackerContent) => void;
}

export function GoalTrackerWidget({ widgetId, content, onContentChange }: GoalTrackerWidgetProps) {
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetDate: "",
    progress: 0,
    category: "Personal",
    color: "#3B82F6",
  });

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals", widgetId],
    queryFn: () => fetch(`/api/goals?widgetId=${widgetId}`).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/goals", { ...data, widgetId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals", widgetId] });
      setIsAddDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals", widgetId] });
      setEditingGoal(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/goals/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/goals", widgetId] }),
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      apiRequest("PATCH", `/api/goals/${id}`, { completed: !completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/goals", widgetId] }),
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      targetDate: "",
      progress: 0,
      category: "Personal",
      color: "#3B82F6",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingGoal) {
      updateMutation.mutate({
        id: editingGoal.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      targetDate: goal.targetDate || "",
      progress: goal.progress,
      category: goal.category || "Personal",
      color: goal.color,
    });
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  const showCompleted = content.showCompleted ?? true;

  return (
    <div className="flex flex-col h-full gap-3 p-3" data-testid="widget-goal-tracker">
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          onClick={() => setIsAddDialogOpen(true)}
          className="ml-auto"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Goal
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
        
        {activeGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onEdit={openEditDialog}
            onDelete={deleteMutation.mutate}
            onToggleComplete={toggleCompleteMutation.mutate}
            onUpdateProgress={(id, progress) => updateMutation.mutate({ id, progress })}
          />
        ))}

        {activeGoals.length === 0 && !isLoading && (
          <div className="text-sm text-muted-foreground text-center py-8">
            No active goals. Click Add Goal to create one.
          </div>
        )}

        {showCompleted && completedGoals.length > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Completed ({completedGoals.length})
            </div>
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={openEditDialog}
                onDelete={deleteMutation.mutate}
                onToggleComplete={toggleCompleteMutation.mutate}
                onUpdateProgress={(id, progress) => updateMutation.mutate({ id, progress })}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={isAddDialogOpen || !!editingGoal} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingGoal(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Edit Goal" : "Add Goal"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Goal Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Launch new product"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional details about this goal..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Personal, Business, etc."
                />
              </div>
              <div>
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="progress">Progress (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <span className="text-sm text-muted-foreground">{formData.color}</span>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingGoal(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingGoal ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GoalCard({ 
  goal, 
  onEdit, 
  onDelete, 
  onToggleComplete,
  onUpdateProgress
}: { 
  goal: Goal; 
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (data: { id: string; completed: boolean }) => void;
  onUpdateProgress: (id: string, progress: number) => void;
}) {
  // Normalize dates to midnight for accurate day-level comparison
  const isOverdue = goal.targetDate && 
    new Date(goal.targetDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0) && 
    !goal.completed;
  
  return (
    <div 
      className="flex flex-col gap-2 p-3 rounded-md border border-border group hover:bg-accent/50 transition-colors"
      style={{ borderLeftWidth: '4px', borderLeftColor: goal.color }}
    >
      <div className="flex items-start gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 mt-0.5"
          onClick={() => onToggleComplete({ id: goal.id, completed: goal.completed || false })}
        >
          <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
            goal.completed ? 'bg-green-500 border-green-500' : 'border-muted-foreground'
          }`}>
            {goal.completed && <Check className="h-3 w-3 text-white" />}
          </div>
        </Button>
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-sm ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
            {goal.title}
          </h4>
          {goal.description && (
            <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {goal.category && (
              <Badge variant="outline" className="text-xs h-5">
                {goal.category}
              </Badge>
            )}
            {goal.targetDate && (
              <Badge variant={isOverdue ? "destructive" : "secondary"} className="text-xs h-5">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(goal.targetDate).toLocaleDateString()}
              </Badge>
            )}
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} className="h-2" />
            {!goal.completed && (
              <div className="flex gap-1 pt-1">
                {[25, 50, 75, 100].map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs flex-1"
                    onClick={() => onUpdateProgress(goal.id, value)}
                  >
                    {value}%
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(goal)}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
