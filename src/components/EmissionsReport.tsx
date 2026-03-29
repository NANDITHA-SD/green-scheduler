import { motion } from "framer-motion";
import { type ScheduleReport, formatEmissions, getIntensityLevel } from "@/lib/carbonData";
import { ArrowDown, Leaf, AlertTriangle, TrendingDown, Clock, MapPin } from "lucide-react";

interface EmissionsReportProps {
  report: ScheduleReport;
}

export default function EmissionsReport({ report }: EmissionsReportProps) {
  const { baseline, optimized, reductionPercent, emissionsReduction } = report;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Headline Savings */}
      <div className="gradient-card rounded-lg border border-primary/30 p-6 glow-green text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">Emissions Reduction</h3>
        </div>
        <div className="text-5xl font-bold text-gradient-primary font-mono mt-3">
          {reductionPercent}%
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Saved <span className="font-mono text-primary">{formatEmissions(emissionsReduction)}</span> by shifting workload
        </p>
      </div>

      {/* Baseline vs Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ComparisonCard
          label="Baseline (Run Now)"
          icon={<AlertTriangle className="h-5 w-5 text-carbon-high" />}
          schedule={baseline}
          variant="baseline"
        />
        <ComparisonCard
          label="Optimized (Shifted)"
          icon={<TrendingDown className="h-5 w-5 text-primary" />}
          schedule={optimized}
          variant="optimized"
        />
      </div>

      {/* Methodology Note */}
      <div className="rounded-lg border border-border p-4 bg-muted/30 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-sm text-secondary-foreground">Methodology</p>
        <p>
          Emissions estimated as: <span className="font-mono">intensity (gCO₂/kWh) × power (kW) × duration (h)</span>.
          Carbon intensity data modeled from regional grid mix with diurnal/seasonal patterns,
          simulating the <span className="font-mono">Carbon Aware SDK</span> forecast API.
        </p>
        <p>
          Time shifting selects the lowest average-intensity window within the user-defined flexibility window.
          Location shifting compares across candidate regions.
        </p>
      </div>
    </motion.div>
  );
}

function ComparisonCard({
  label,
  icon,
  schedule,
  variant,
}: {
  label: string;
  icon: React.ReactNode;
  schedule: ScheduleReport["baseline"];
  variant: "baseline" | "optimized";
}) {
  const level = getIntensityLevel(schedule.avgIntensity);
  const borderClass = variant === "optimized" ? "border-primary/40" : "border-border";
  const glowClass = variant === "optimized" ? "glow-green" : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: variant === "optimized" ? 0.2 : 0 }}
      className={`gradient-card rounded-lg border ${borderClass} p-5 space-y-4 ${glowClass}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="font-semibold text-sm">{label}</h4>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Region:</span>
          <span className="font-mono text-xs">{schedule.regionName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Start:</span>
          <span className="font-mono text-xs">
            {schedule.startTime.toLocaleString()}
          </span>
        </div>

        <div className="pt-2 border-t border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Avg Intensity</span>
            <span className={`font-mono font-semibold text-carbon-${level}`}>
              {schedule.avgIntensity} gCO₂/kWh
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Emissions</span>
            <span className="font-mono font-semibold">
              {formatEmissions(schedule.estimatedEmissions)}
            </span>
          </div>
        </div>
      </div>

      {variant === "optimized" && schedule.savingsVsBaseline > 0 && (
        <div className="flex items-center gap-1.5 text-primary text-sm font-medium pt-1">
          <ArrowDown className="h-4 w-4" />
          {schedule.savingsVsBaseline}% less than baseline
        </div>
      )}
    </motion.div>
  );
}
