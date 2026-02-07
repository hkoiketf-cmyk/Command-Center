import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { Circle, BarChart3, LineChart, Plus, Pencil, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Venture, RevenueData, RevenueContent } from "@shared/schema";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface RevenueWidgetProps {
  content: RevenueContent;
  onContentChange: (content: RevenueContent) => void;
}

export function RevenueWidget({ content, onContentChange }: RevenueWidgetProps) {
  const selectedVentureId = content?.ventureId || "";
  const chartType = content?.chartType || "line";
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newMonth, setNewMonth] = useState(months[new Date().getMonth()]);
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());
  const [newAmount, setNewAmount] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; label: string }>({
    open: false,
    id: "",
    label: "",
  });

  const { data: ventures = [] } = useQuery<Venture[]>({
    queryKey: ["/api/ventures"],
  });

  const { data: revenueData = [] } = useQuery<RevenueData[]>({
    queryKey: ["/api/revenue", selectedVentureId],
    enabled: !!selectedVentureId,
  });

  const addRevenue = useMutation({
    mutationFn: async (data: { ventureId: string; month: string; year: number; amount: number; description?: string; date?: string }) => {
      return apiRequest("POST", "/api/revenue", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/revenue", selectedVentureId] });
      setAddDialogOpen(false);
      setNewAmount("");
      setNewDescription("");
    },
  });

  const updateRevenue = useMutation({
    mutationFn: async ({ id, amount, description }: { id: string; amount?: number; description?: string }) => {
      return apiRequest("PATCH", `/api/revenue/${id}`, { amount, description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/revenue", selectedVentureId] });
    },
  });

  const deleteRevenue = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/revenue/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/revenue", selectedVentureId] });
    },
  });

  const selectedVenture = ventures.find((v) => v.id === selectedVentureId);

  const sortedData = [...revenueData].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return months.indexOf(a.month) - months.indexOf(b.month);
  });

  const monthlyTotals = sortedData.reduce((acc, entry) => {
    const key = `${entry.month} ${entry.year}`;
    acc[key] = (acc[key] || 0) + entry.amount;
    return acc;
  }, {} as Record<string, number>);

  const uniqueMonths = Array.from(new Set(sortedData.map((d) => `${d.month} ${d.year}`)));

  const chartData = {
    labels: uniqueMonths,
    datasets: [
      {
        label: "Revenue",
        data: uniqueMonths.map((m) => monthlyTotals[m]),
        borderColor: selectedVenture?.color || "hsl(217, 91%, 35%)",
        backgroundColor: chartType === "line" 
          ? `${selectedVenture?.color || "hsl(217, 91%, 35%)"}33`
          : selectedVenture?.color || "hsl(217, 91%, 35%)",
        fill: chartType === "line",
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `$${context.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `$${value.toLocaleString()}`,
        },
        grid: {
          color: "rgba(128, 128, 128, 0.1)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const handleVentureChange = (ventureId: string) => {
    onContentChange({ ...content, ventureId });
  };

  const toggleChartType = () => {
    onContentChange({
      ...content,
      chartType: chartType === "line" ? "bar" : "line",
    });
  };

  const handleAddRevenue = () => {
    if (newAmount && selectedVentureId) {
      addRevenue.mutate({
        ventureId: selectedVentureId,
        month: newMonth,
        year: parseInt(newYear),
        amount: parseFloat(newAmount),
        description: newDescription || undefined,
      });
    }
  };

  const handleDeleteClick = (data: RevenueData) => {
    const label = data.description || `${data.month} ${data.year}`;
    setDeleteConfirm({ open: true, id: data.id, label });
  };

  const confirmDelete = () => {
    deleteRevenue.mutate(deleteConfirm.id);
    setDeleteConfirm({ open: false, id: "", label: "" });
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <>
      <div className="h-full flex flex-col gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedVentureId || undefined} onValueChange={handleVentureChange}>
            <SelectTrigger className="flex-1 min-w-[150px]" data-testid="select-revenue-venture">
              <SelectValue placeholder="Select a venture..." />
            </SelectTrigger>
            <SelectContent>
              {ventures.map((venture) => (
                <SelectItem key={venture.id} value={venture.id}>
                  <div className="flex items-center gap-2">
                    <Circle
                      className="h-3 w-3"
                      style={{ fill: venture.color, color: venture.color }}
                    />
                    {venture.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleChartType}
            data-testid="button-toggle-chart-type"
          >
            {chartType === "line" ? (
              <BarChart3 className="h-4 w-4" />
            ) : (
              <LineChart className="h-4 w-4" />
            )}
          </Button>
          {selectedVentureId && (
            <>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" data-testid="button-add-revenue">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Customer Payment</DialogTitle>
                    <DialogDescription>
                      Add a customer payment for {selectedVenture?.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">Customer Name</Label>
                      <Input
                        id="description"
                        placeholder="e.g., Acme Corp"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        data-testid="input-revenue-description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Month</Label>
                        <Select value={newMonth} onValueChange={setNewMonth}>
                          <SelectTrigger data-testid="select-revenue-month">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Select value={newYear} onValueChange={setNewYear}>
                          <SelectTrigger data-testid="select-revenue-year">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {yearOptions.map((y) => (
                              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="text"
                        inputMode="decimal"
                        placeholder="10000"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                        data-testid="input-revenue-amount"
                      />
                    </div>
                    <Button 
                      onClick={handleAddRevenue} 
                      disabled={!newAmount || addRevenue.isPending}
                      data-testid="button-submit-revenue"
                    >
                      Add Payment
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant={editMode ? "default" : "outline"}
                size="icon"
                onClick={() => setEditMode(!editMode)}
                data-testid="button-edit-revenue"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {editMode && selectedVentureId && sortedData.length > 0 ? (
          <div className="flex-1 overflow-auto">
            <div className="space-y-2">
              {sortedData.map((entry) => (
                <div 
                  key={entry.id} 
                  className="flex items-center gap-2 p-2 rounded-md border border-border"
                >
                  <span className="text-xs text-muted-foreground shrink-0 w-[60px]">
                    {entry.month} {entry.year}
                  </span>
                  <Input
                    type="text"
                    defaultValue={entry.description || ""}
                    placeholder="Customer name..."
                    className="flex-1 h-8 text-sm"
                    onBlur={(e) => {
                      if (e.target.value !== (entry.description || "")) {
                        updateRevenue.mutate({ id: entry.id, description: e.target.value });
                      }
                    }}
                    data-testid={`input-revenue-desc-${entry.id}`}
                  />
                  <div className="flex items-center shrink-0">
                    <span className="text-xs text-muted-foreground mr-1">$</span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      defaultValue={entry.amount}
                      className="w-24 h-8 text-sm"
                      onBlur={(e) => {
                        const newValue = parseFloat(e.target.value);
                        if (!isNaN(newValue) && newValue !== entry.amount) {
                          updateRevenue.mutate({ id: entry.id, amount: newValue });
                        }
                      }}
                      data-testid={`input-revenue-edit-${entry.id}`}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive shrink-0 h-8 w-8"
                    onClick={() => handleDeleteClick(entry)}
                    data-testid={`button-delete-revenue-${entry.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-[200px]">
            {selectedVentureId ? (
              sortedData.length > 0 ? (
                chartType === "line" ? (
                  <Line data={chartData} options={options} />
                ) : (
                  <Bar data={chartData} options={options} />
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                  <p>No revenue data available</p>
                  <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Entry
                  </Button>
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Select a venture to view revenue
              </div>
            )}
          </div>
        )}

        {selectedVentureId && sortedData.length > 0 && !editMode && (
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: selectedVenture?.color }}>
              ${sortedData.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title="Delete Revenue Entry"
        description={`Are you sure you want to delete the revenue entry for ${deleteConfirm.label}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
      />
    </>
  );
}
