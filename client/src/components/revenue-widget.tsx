import { useQuery } from "@tanstack/react-query";
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
import { Circle, BarChart3, LineChart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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

interface RevenueWidgetProps {
  content: RevenueContent;
  onContentChange: (content: RevenueContent) => void;
}

export function RevenueWidget({ content, onContentChange }: RevenueWidgetProps) {
  const selectedVentureId = content?.ventureId || "";
  const chartType = content?.chartType || "line";

  const { data: ventures = [] } = useQuery<Venture[]>({
    queryKey: ["/api/ventures"],
  });

  const { data: revenueData = [] } = useQuery<RevenueData[]>({
    queryKey: ["/api/revenue", selectedVentureId],
    enabled: !!selectedVentureId,
  });

  const selectedVenture = ventures.find((v) => v.id === selectedVentureId);

  const sortedData = [...revenueData].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.indexOf(a.month) - months.indexOf(b.month);
  });

  const chartData = {
    labels: sortedData.map((d) => `${d.month} ${d.year}`),
    datasets: [
      {
        label: "Revenue",
        data: sortedData.map((d) => d.amount),
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

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Select value={selectedVentureId} onValueChange={handleVentureChange}>
          <SelectTrigger className="flex-1" data-testid="select-revenue-venture">
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
      </div>

      <div className="flex-1 min-h-[200px]">
        {selectedVentureId ? (
          sortedData.length > 0 ? (
            chartType === "line" ? (
              <Line data={chartData} options={options} />
            ) : (
              <Bar data={chartData} options={options} />
            )
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No revenue data available
            </div>
          )
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Select a venture to view revenue
          </div>
        )}
      </div>

      {selectedVentureId && sortedData.length > 0 && (
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: selectedVenture?.color }}>
            ${sortedData.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Total Revenue</p>
        </div>
      )}
    </div>
  );
}
