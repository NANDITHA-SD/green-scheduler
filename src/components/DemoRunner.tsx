import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type ScheduleReport, formatEmissions } from "@/lib/carbonData";
import { Play, CheckCircle, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface DemoRunnerProps {
  report: ScheduleReport;
}

type RunState = "idle" | "baseline" | "optimized" | "done";

export default function DemoRunner({ report }: DemoRunnerProps) {
  const [runState, setRunState] = useState<RunState>("idle");
  const [baselineProgress, setBaselineProgress] = useState(0);
  const [optimizedProgress, setOptimizedProgress] = useState(0);

  async function runDemo() {
    setRunState("baseline");
    setBaselineProgress(0);
    setOptimizedProgress(0);

    // Simulate baseline run
    for (let i = 0; i <= 100; i += 5) {
      await sleep(80);
      setBaselineProgress(i);
    }

    await sleep(300);
    setRunState("optimized");

    // Simulate optimized run
    for (let i = 0; i <= 100; i += 5) {
      await sleep(80);
      setOptimizedProgress(i);
    }

    await sleep(300);
    setRunState("done");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="gradient-card rounded-lg border border-border p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Demo: Baseline vs Optimized Run
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Simulates running the same workload twice — once immediately (baseline) and once at the carbon-optimal time
          </p>
        </div>
        {runState === "idle" && (
          <Button onClick={runDemo} variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10">
            <Play className="h-4 w-4 mr-1.5" /> Run Demo
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {runState !== "idle" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-4"
          >
            {/* Baseline Run */}
            <div className={`rounded-md border p-4 space-y-2 ${
              runState === "baseline" ? "border-carbon-high/50" : "border-border"
            }`}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {baselineProgress < 100 && runState === "baseline" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-carbon-high" />
                  ) : baselineProgress >= 100 ? (
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  <span className="font-medium">Baseline Run</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    ({report.baseline.regionName})
                  </span>
                </span>
                <span className="font-mono text-xs text-carbon-high">
                  {formatEmissions(report.baseline.estimatedEmissions)}
                </span>
              </div>
              <Progress value={baselineProgress} className="h-1.5" />
            </div>

            {/* Optimized Run */}
            <div className={`rounded-md border p-4 space-y-2 ${
              runState === "optimized" ? "border-primary/50 glow-green" : "border-border"
            }`}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  {runState === "optimized" && optimizedProgress < 100 ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : optimizedProgress >= 100 ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  <span className="font-medium">Optimized Run</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    ({report.optimized.regionName})
                  </span>
                </span>
                <span className="font-mono text-xs text-primary">
                  {formatEmissions(report.optimized.estimatedEmissions)}
                </span>
              </div>
              <Progress value={optimizedProgress} className="h-1.5" />
            </div>

            {/* Results */}
            {runState === "done" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md border border-primary/40 bg-primary/5 p-4 text-center glow-green"
              >
                <p className="text-sm font-medium">
                  ✅ Demo complete — optimized run saved{" "}
                  <span className="font-mono text-primary font-bold">
                    {formatEmissions(report.emissionsReduction)}
                  </span>{" "}
                  ({report.reductionPercent}% reduction)
                </p>
                <Button
                  onClick={() => { setRunState("idle"); setBaselineProgress(0); setOptimizedProgress(0); }}
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs text-muted-foreground"
                >
                  Reset Demo
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
