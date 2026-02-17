import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, Eye, Gauge, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WeatherContent } from "@shared/schema";

interface WeatherWidgetProps {
  widgetId: string;
  content: WeatherContent;
  onContentChange: (content: WeatherContent) => void;
}

interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  icon: string;
}

export function WeatherWidget({ widgetId, content, onContentChange }: WeatherWidgetProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [location, setLocation] = useState(content.location || "New York");
  const [units, setUnits] = useState<"metric" | "imperial">(content.units || "imperial");

  // Mock weather data - in production, this would call a real weather API
  const { data: weather, isLoading, refetch } = useQuery<WeatherData>({
    queryKey: ["/api/weather", location, units],
    queryFn: async () => {
      // This is mock data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const temp = units === "metric" ? 22 : 72;
      const windSpeedUnit = units === "metric" ? 15 : 9;
      
      return {
        location: location,
        temperature: temp,
        feelsLike: temp - 2,
        condition: "Partly Cloudy",
        humidity: 65,
        windSpeed: windSpeedUnit,
        pressure: 1013,
        visibility: 10,
        icon: "partly-cloudy",
      };
    },
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
  });

  const handleSaveSettings = () => {
    onContentChange({
      location,
      units,
    });
    setIsSettingsOpen(false);
  };

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes("rain")) return <CloudRain className="h-16 w-16" />;
    if (lower.includes("snow")) return <CloudSnow className="h-16 w-16" />;
    if (lower.includes("cloud")) return <Cloud className="h-16 w-16" />;
    return <Sun className="h-16 w-16" />;
  };

  return (
    <div className="flex flex-col h-full p-4" data-testid="widget-weather">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-muted-foreground">Loading weather...</div>
        </div>
      ) : weather ? (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{weather.location}</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
                className="h-8"
              >
                Settings
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center flex-1">
            <div className="text-primary/80 mb-2">
              {getWeatherIcon(weather.condition)}
            </div>
            <div className="text-5xl font-bold mb-1">
              {Math.round(weather.temperature)}°{units === "metric" ? "C" : "F"}
            </div>
            <div className="text-sm text-muted-foreground mb-1">
              Feels like {Math.round(weather.feelsLike)}°{units === "metric" ? "C" : "F"}
            </div>
            <div className="text-base text-muted-foreground mb-6">
              {weather.condition}
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              <WeatherStat 
                icon={<Droplets className="h-4 w-4" />}
                label="Humidity"
                value={`${weather.humidity}%`}
              />
              <WeatherStat 
                icon={<Wind className="h-4 w-4" />}
                label="Wind"
                value={`${weather.windSpeed} ${units === "metric" ? "km/h" : "mph"}`}
              />
              <WeatherStat 
                icon={<Gauge className="h-4 w-4" />}
                label="Pressure"
                value={`${weather.pressure} mb`}
              />
              <WeatherStat 
                icon={<Eye className="h-4 w-4" />}
                label="Visibility"
                value={`${weather.visibility} ${units === "metric" ? "km" : "mi"}`}
              />
            </div>
          </div>

          <div className="text-xs text-center text-muted-foreground mt-auto">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <p className="text-sm text-muted-foreground">Unable to load weather data</p>
          <Button size="sm" onClick={() => setIsSettingsOpen(true)}>
            Configure Settings
          </Button>
        </div>
      )}

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Weather Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter city name"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter a city name (e.g., "New York", "London", "Tokyo")
              </p>
            </div>
            <div>
              <Label htmlFor="units">Temperature Units</Label>
              <Select value={units} onValueChange={(value: "metric" | "imperial") => setUnits(value)}>
                <SelectTrigger id="units">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="imperial">Fahrenheit (°F)</SelectItem>
                  <SelectItem value="metric">Celsius (°C)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This widget currently displays sample data. 
                To use real weather data, you would need to configure a weather API key 
                (such as OpenWeatherMap or WeatherAPI) in your user settings.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WeatherStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
