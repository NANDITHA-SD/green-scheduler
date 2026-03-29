import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { type JobConfig, type ScheduleReport, computeSchedule } from "@/lib/carbonData";
import JobConfigForm from "@/components/JobConfigForm";
import EmissionsReport from "@/components/EmissionsReport";
import CandidateTable from "@/components/CandidateTable";
import CarbonIntensityChart from "@/components/CarbonIntensityChart";
import RegionComparison from "@/components/RegionComparison";
import DemoRunner from "@/components/DemoRunner";
import { Leaf } from "lucide-react";

export default function Index() {
  const [report, setReport] = useState<ScheduleReport | null>(null);
  const [config, setConfig] = useState<JobConfig | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleSubmit = useCallback((jobConfig: JobConfig) => {
    setIsRunning(true);
    setConfig(jobConfig);

    // Simulate computation delay for UX
    setTimeout(() => {
      const result = computeSchedule(jobConfig);
      setReport(result);
      setIsRunning(false);
    }, 800);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center glow-green">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Carbon-Aware Scheduler</h1>
            <p className="text-xs text-muted-foreground">
              Shift workloads to greener time slots & regions · Powered by Carbon Aware SDK patterns
            </p>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Config */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <JobConfigForm onSubmit={handleSubmit} isRunning={isRunning} />
            </motion.div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-7 space-y-6">
            {!report && !isRunning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="gradient-card rounded-lg border border-border p-12 text-center"
              >
                <Leaf className="h-12 w-12 mx-auto text-primary/30 mb-4 carbon-pulse" />
                <h2 className="text-lg font-semibold text-muted-foreground">Configure & Run</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  Set your job parameters, scheduling window, and candidate regions.
                  The scheduler will find the lowest-carbon time slot and compare against running immediately.
                </p>
              </motion.div>
            )}

            {isRunning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="gradient-card rounded-lg border border-primary/30 p-12 text-center glow-green"
              >
                <div className="h-12 w-12 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">
                  Computing candidate schedules across regions...
                </p>
              </motion.div>
            )}

            {report && !isRunning && (
              <>
                <EmissionsReport report={report} />
                <CarbonIntensityChart report={report} />
                {config && <RegionComparison config={config} />}
                <CandidateTable candidates={report.allCandidates} />
                <DemoRunner report={report} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
