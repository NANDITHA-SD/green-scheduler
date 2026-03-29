import { motion } from "framer-motion";
import { REGIONS, generateCarbonIntensity, type JobConfig, formatEmissions } from "@/lib/carbonData";
import { useMemo } from "react";
import { Globe, ArrowRight } from "lucide-react";

interface RegionComparisonProps {
  config: JobConfig;
}

export default function RegionComparison({ config }: RegionComparisonProps) {
  const regionData = useMemo(() => {
    return config.regions.map(regionId => {
      const region = REGIONS.find(r => r.id === regionId)!;
      const forecast = generateCarbonIntensity(
        region,
        config.earliestStart,
        config.latestFinish
      );
      const avgIntensity = forecast.length > 0
        ? Math.round(forecast.reduce((s, p) => s + p.intensity, 0) / forecast.length)
        : region.baselineIntensity;
      const durationHours = config.durationMinutes / 60;
      const emissions = Math.round(avgIntensity * config.powerDrawKW * durationHours);

      return { region, avgIntensity, emissions };
    }).sort((a, b) => a.avgIntensity - b.avgIntensity);
  }, [config]);

  const maxIntensity = Math.max(...regionData.map(r => r.avgIntensity));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="gradient-card rounded-lg border border-border p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-accent" />
        <h3 className="font-semibold">Location Shifting — Region Comparison</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Average carbon intensity across the scheduling window per region. Consider relocating workloads to lower-carbon grids.
      </p>

      <div className="space-y-3">
        {regionData.map((r, i) => {
          const barWidth = maxIntensity > 0 ? (r.avgIntensity / maxIntensity) * 100 : 0;
          const isLowest = i === 0;

          return (
            <motion.div
              key={r.region.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className={`rounded-md p-3 border ${
                isLowest ? "border-primary/40 bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isLowest && <span className="text-xs font-mono text-primary">★ BEST</span>}
                  <span className="text-sm font-medium">{r.region.name}</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  {r.region.renewablePercent}% renewable
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.6, delay: 0.5 + i * 0.05 }}
                    className={`h-full rounded-full ${
                      isLowest
                        ? "bg-primary"
                        : r.avgIntensity < 200
                        ? "bg-primary/60"
                        : r.avgIntensity < 400
                        ? "bg-carbon-medium"
                        : "bg-carbon-high"
                    }`}
                  />
                </div>
                <span className="text-xs font-mono w-28 text-right">
                  {r.avgIntensity} gCO₂/kWh
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-mono">
                Est. {formatEmissions(r.emissions)} total
              </div>
            </motion.div>
          );
        })}
      </div>

      {regionData.length >= 2 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
          <ArrowRight className="h-3.5 w-3.5 text-primary" />
          Shifting from {regionData[regionData.length - 1].region.name} to {regionData[0].region.name} saves{" "}
          <span className="font-mono text-primary">
            {formatEmissions(regionData[regionData.length - 1].emissions - regionData[0].emissions)}
          </span>
        </div>
      )}
    </motion.div>
  );
}
