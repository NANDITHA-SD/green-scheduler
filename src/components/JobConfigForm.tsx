import { useState } from "react";
import { REGIONS, type JobConfig } from "@/lib/carbonData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Zap, MapPin, Play } from "lucide-react";

interface JobConfigFormProps {
  onSubmit: (config: JobConfig) => void;
  isRunning: boolean;
}

export default function JobConfigForm({ onSubmit, isRunning }: JobConfigFormProps) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [durationMinutes, setDurationMinutes] = useState(120);
  const [powerDrawKW, setPowerDrawKW] = useState(2.5);
  const [earliestStart, setEarliestStart] = useState(
    formatDateTimeLocal(now)
  );
  const [latestFinish, setLatestFinish] = useState(
    formatDateTimeLocal(tomorrow)
  );
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["westus", "norwayeast", "francecentral"]);

  function toggleRegion(regionId: string) {
    setSelectedRegions(prev =>
      prev.includes(regionId)
        ? prev.filter(r => r !== regionId)
        : [...prev, regionId]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedRegions.length === 0) return;

    onSubmit({
      durationMinutes,
      earliestStart: new Date(earliestStart),
      latestFinish: new Date(latestFinish),
      regions: selectedRegions,
      powerDrawKW,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="gradient-card rounded-lg border border-border p-6 space-y-5">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Job Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-muted-foreground text-sm">
              Job Duration (minutes)
            </Label>
            <Input
              id="duration"
              type="number"
              min={15}
              max={1440}
              value={durationMinutes}
              onChange={e => setDurationMinutes(Number(e.target.value))}
              className="bg-muted border-border font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="power" className="text-muted-foreground text-sm">
              Power Draw (kW)
            </Label>
            <Input
              id="power"
              type="number"
              min={0.1}
              max={100}
              step={0.1}
              value={powerDrawKW}
              onChange={e => setPowerDrawKW(Number(e.target.value))}
              className="bg-muted border-border font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="earliest" className="text-muted-foreground text-sm flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Earliest Start
            </Label>
            <Input
              id="earliest"
              type="datetime-local"
              value={earliestStart}
              onChange={e => setEarliestStart(e.target.value)}
              className="bg-muted border-border font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="latest" className="text-muted-foreground text-sm flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Latest Finish
            </Label>
            <Input
              id="latest"
              type="datetime-local"
              value={latestFinish}
              onChange={e => setLatestFinish(e.target.value)}
              className="bg-muted border-border font-mono text-sm"
            />
          </div>
        </div>
      </div>

      <div className="gradient-card rounded-lg border border-border p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-accent" />
          Candidate Regions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REGIONS.map(region => (
            <label
              key={region.id}
              className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-all ${
                selectedRegions.includes(region.id)
                  ? "border-primary/50 bg-primary/5"
                  : "border-border bg-muted/30 hover:border-muted-foreground/30"
              }`}
            >
              <Checkbox
                checked={selectedRegions.includes(region.id)}
                onCheckedChange={() => toggleRegion(region.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{region.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                  ~{region.baselineIntensity} gCO₂/kWh · {region.renewablePercent}% renewable
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isRunning || selectedRegions.length === 0}
        className="w-full h-12 text-base font-semibold gradient-primary hover:opacity-90 transition-opacity glow-green"
        size="lg"
      >
        <Play className="h-5 w-5 mr-2" />
        {isRunning ? "Computing Schedule..." : "Compute Optimal Schedule"}
      </Button>
    </form>
  );
}

function formatDateTimeLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}
