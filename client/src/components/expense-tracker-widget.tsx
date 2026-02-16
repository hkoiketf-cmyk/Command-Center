import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { RecurringExpense, VariableExpense } from "@shared/schema";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ExpenseTrackerWidget() {
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [showAddVariable, setShowAddVariable] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const { data: recurring = [] } = useQuery<RecurringExpense[]>({ queryKey: ["/api/recurring-expenses"] });
  const { data: variable = [] } = useQuery<VariableExpense[]>({ queryKey: ["/api/variable-expenses"] });

  const createRecurring = useMutation({
    mutationFn: (data: { name: string; amount: number; category: string }) =>
      apiRequest("POST", "/api/recurring-expenses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-expenses"] });
      setNewName("");
      setNewAmount("");
      setNewCategory("");
      setShowAddRecurring(false);
    },
  });

  const deleteRecurring = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/recurring-expenses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/recurring-expenses"] }),
  });

  const createVariable = useMutation({
    mutationFn: (data: { name: string; amount: number; date: string; category: string }) =>
      apiRequest("POST", "/api/variable-expenses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/variable-expenses"] });
      setNewName("");
      setNewAmount("");
      setNewCategory("");
      setShowAddVariable(false);
    },
  });

  const deleteVariable = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/variable-expenses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/variable-expenses"] }),
  });

  const monthlyBurn = recurring.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthVariable = variable
    .filter((e) => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex flex-col h-full gap-3 p-3" data-testid="widget-expense-tracker">
      <div className="text-center p-3 rounded-md" style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}>
        <div className="text-2xl font-bold text-destructive">${monthlyBurn.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">Monthly Burn Rate</div>
        {thisMonthVariable > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            + ${thisMonthVariable.toLocaleString()} variable this month
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-medium text-muted-foreground">Recurring ({recurring.length})</div>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowAddRecurring(!showAddRecurring)} data-testid="button-add-recurring">
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>

          {showAddRecurring && (
            <form
              className="flex gap-1 mb-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (newName.trim()) createRecurring.mutate({ name: newName.trim(), amount: parseFloat(newAmount) || 0, category: newCategory.trim() });
              }}
            >
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="flex-1" autoFocus data-testid="input-recurring-name" />
              <Input value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="$" type="number" className="w-20" data-testid="input-recurring-amount" />
              <Button type="submit" size="sm" disabled={!newName.trim()} data-testid="button-confirm-recurring">Add</Button>
            </form>
          )}

          {recurring.map((exp) => (
            <div key={exp.id} className="flex items-center justify-between py-1 px-1 group" data-testid={`recurring-${exp.id}`}>
              <span className="text-sm truncate">{exp.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-medium">${exp.amount.toLocaleString()}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  style={{ visibility: "hidden" }}
                  onClick={() => deleteRecurring.mutate(exp.id)}
                  data-testid={`button-delete-recurring-${exp.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-medium text-muted-foreground">Variable Expenses</div>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowAddVariable(!showAddVariable)} data-testid="button-add-variable">
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>

          {showAddVariable && (
            <form
              className="flex gap-1 mb-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (newName.trim()) createVariable.mutate({ name: newName.trim(), amount: parseFloat(newAmount) || 0, date: new Date().toISOString().split("T")[0], category: newCategory.trim() });
              }}
            >
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="flex-1" autoFocus data-testid="input-variable-name" />
              <Input value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="$" type="number" className="w-20" data-testid="input-variable-amount" />
              <Button type="submit" size="sm" disabled={!newName.trim()} data-testid="button-confirm-variable">Add</Button>
            </form>
          )}

          {variable.slice(0, 10).map((exp) => (
            <div key={exp.id} className="flex items-center justify-between py-1 px-1 group" data-testid={`variable-${exp.id}`}>
              <div className="min-w-0">
                <span className="text-sm truncate block">{exp.name}</span>
                <span className="text-[10px] text-muted-foreground">{formatDate(exp.date)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-medium">${exp.amount.toLocaleString()}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  style={{ visibility: "hidden" }}
                  onClick={() => deleteVariable.mutate(exp.id)}
                  data-testid={`button-delete-variable-${exp.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
