import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { type ScheduleReport } from "@/lib/carbonData";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

interface CarbonIntensityChartProps {
  report: ScheduleReport;
}

export default function CarbonIntensityChart({ report }: CarbonIntensityChartProps) {
  const chartData = useMemo(() => {
    // Use optimized candidate's intensity profile for chart
    const points = report.optimized.intensityProfile;
    if (points.length === 0) return [];

    // Also show baseline region data if different
    const baselinePoints = report.baseline.intensityProfile;

    // Merge into chart-friendly format
    const allTimestamps = new Set<number>();
    points.forEach(p => allTimestamps.add(p.timestamp.getTime()));
    baselinePoints.forEach(p => allTimestamps.add(p.timestamp.getTime()));

    const sorted = Array.from(allTimestamps).sort((a, b) => a - b);

    return sorted.map(ts => {
      const opt = points.find(p => p.timestamp.getTime() === ts);
      const base = baselinePoints.find(p => p.timestamp.getTime() === ts);
      return {
        time: new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
        timestamp: ts,
        optimized: opt?.intensity ?? null,
        baseline: base?.intensity ?? null,
      };
    });
  }, [report]);

  if (chartData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="gradient-card rounded-lg border border-border p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Carbon Intensity Over Time</h3>
      </div>

      <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 rounded-full bg-primary" />
          <span>Optimized slot ({report.optimized.regionName})</span>
        </div>
        {report.baseline.region !== report.optimized.region && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded-full bg-destructive opacity-50" />
            <span>Baseline ({report.baseline.regionName})</span>
          </div>
        )}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 75%, 55%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(0, 75%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
            <XAxis
              dataKey="time"
              tick={{ fill: "hsl(215, 12%, 55%)", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(220, 14%, 18%)" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "hsl(215, 12%, 55%)", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(220, 14%, 18%)" }}
              label={{
                value: "gCO₂/kWh",
                angle: -90,
                position: "insideLeft",
                fill: "hsl(215, 12%, 55%)",
                fontSize: 10,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 10%)",
                border: "1px solid hsl(220, 14%, 18%)",
                borderRadius: "8px",
                fontSize: 12,
                fontFamily: "JetBrains Mono, monospace",
              }}
              labelStyle={{ color: "hsl(210, 20%, 92%)" }}
            />
            {report.baseline.region !== report.optimized.region && (
              <Area
                type="monotone"
                dataKey="baseline"
                stroke="hsl(0, 75%, 55%)"
                strokeWidth={1.5}
                strokeOpacity={0.5}
                fill="url(#redGrad)"
                connectNulls={false}
                dot={false}
                name="Baseline"
              />
            )}
            <Area
              type="monotone"
              dataKey="optimized"
              stroke="hsl(142, 70%, 45%)"
              strokeWidth={2}
              fill="url(#greenGrad)"
              connectNulls={false}
              dot={false}
              name="Optimized"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
