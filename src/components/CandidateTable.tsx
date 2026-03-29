import { motion } from "framer-motion";
import { type CandidateSchedule, formatEmissions, getIntensityLevel } from "@/lib/carbonData";
import { Trophy } from "lucide-react";

interface CandidateTableProps {
  candidates: CandidateSchedule[];
}

export default function CandidateTable({ candidates }: CandidateTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="gradient-card rounded-lg border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Candidate Schedules (ranked by emissions)
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Top {candidates.length} time/region combinations sorted by estimated carbon emissions
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs">
              <th className="px-4 py-3 text-left font-medium">#</th>
              <th className="px-4 py-3 text-left font-medium">Region</th>
              <th className="px-4 py-3 text-left font-medium">Start Time</th>
              <th className="px-4 py-3 text-right font-medium">Avg Intensity</th>
              <th className="px-4 py-3 text-right font-medium">Emissions</th>
              <th className="px-4 py-3 text-right font-medium">vs Baseline</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, i) => {
              const level = getIntensityLevel(c.avgIntensity);
              return (
                <motion.tr
                  key={`${c.region}-${c.startTime.getTime()}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.03 }}
                  className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                    i === 0 ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    {i === 0 ? (
                      <span className="inline-flex items-center gap-1 text-primary font-semibold">
                        🏆 1
                      </span>
                    ) : (
                      c.rank
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">{c.regionName}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {c.startTime.toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-xs text-carbon-${level}`}>
                    {c.avgIntensity} gCO₂/kWh
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {formatEmissions(c.estimatedEmissions)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {c.savingsVsBaseline > 0 ? (
                      <span className="text-primary">-{c.savingsVsBaseline}%</span>
                    ) : c.savingsVsBaseline < 0 ? (
                      <span className="text-destructive">+{Math.abs(c.savingsVsBaseline)}%</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
