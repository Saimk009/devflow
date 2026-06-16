import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { X } from "lucide-react"
import { useEffect, useMemo } from "react"

import { Button } from "@/components/ui/button"
import { UtilizationChart } from "@/components/runners/UtilizationChart"
import { formatDate } from "@/lib/formatDate"
import { cn } from "@/lib/utils"
import type { PipelineStatus, Runner } from "@/types"

type RunnerDetailPanelProps = {
  runner: Runner | null
  onClose: () => void
}

const statusDot: Record<PipelineStatus, string> = {
  queued: "bg-pipeline-queued",
  running: "bg-pipeline-running",
  success: "bg-pipeline-success",
  failed: "bg-pipeline-failed",
  cancelled: "bg-pipeline-cancelled",
  skipped: "bg-pipeline-skipped",
}

const runnerStatusText = {
  online: "text-pipeline-success",
  busy: "text-pipeline-running",
  offline: "text-slate-400",
  disabled: "text-pipeline-failed",
}

const createRecentJobs = (runner: Runner) =>
  Array.from({ length: 10 }, (_, index) => ({
    id: `${runner.id}-job-${index}`,
    jobName: index === 0 && runner.currentJob ? runner.currentJob.jobName : `job-${index + 1}`,
    pipeline: index === 0 && runner.currentJob ? runner.currentJob.pipelineName : "CI Pipeline",
    duration: `${Math.floor(2 + index * 1.7)}m ${10 + index}s`,
    status: (index % 5 === 0 ? "failed" : "success") as PipelineStatus,
    date: new Date(Date.now() - (index + 1) * 3 * 60 * 60 * 1_000).toISOString(),
  }))

export function RunnerDetailPanel({ onClose, runner }: RunnerDetailPanelProps) {
  const shouldReduceMotion = useReducedMotion()
  const recentJobs = useMemo(
    () => (runner ? createRecentJobs(runner) : []),
    [runner],
  )

  useEffect(() => {
    const closePanel = () => onClose()

    window.addEventListener("devflow:close-panel", closePanel)

    return () => {
      window.removeEventListener("devflow:close-panel", closePanel)
    }
  }, [onClose])

  return (
    <AnimatePresence initial={!shouldReduceMotion}>
      {runner ? (
        <motion.aside
          animate={{ x: 0 }}
          className="fixed right-0 top-0 z-50 flex h-screen w-[460px] flex-col border-l border-terminal-700 bg-terminal-900 shadow-2xl shadow-black/40"
          exit={shouldReduceMotion ? undefined : { x: "100%" }}
          initial={shouldReduceMotion ? false : { x: "100%" }}
          transition={
            shouldReduceMotion ? undefined : { duration: 0.3, ease: "easeOut" }
          }
        >
          <header className="border-b border-terminal-700 p-5">
            <Button
              aria-label="Close runner details"
              className="absolute right-4 top-4 h-8 w-8 bg-terminal-950 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            <h2 className="pr-10 text-lg font-semibold text-white">{runner.name}</h2>
            <span
              className={cn(
                "mt-3 inline-flex rounded-full border border-terminal-700 bg-terminal-950 px-2.5 py-1 text-xs font-medium capitalize",
                runnerStatusText[runner.status],
              )}
            >
              {runner.status}
            </span>
          </header>

          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            <section>
              <h3 className="text-sm font-medium text-slate-200">Labels</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {runner.labels.map((label) => (
                  <span
                    className="rounded-md border border-terminal-700 bg-terminal-950 px-2 py-1 font-mono text-xs text-slate-400"
                    key={label}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </section>

            <UtilizationChart runnerId={runner.id} runnerName={runner.name} />

            <section>
              <h3 className="text-sm font-medium text-slate-200">Recent jobs</h3>
              <div className="mt-3 overflow-hidden rounded-xl border border-terminal-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-terminal-950 text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Job</th>
                      <th className="px-3 py-2">Pipeline</th>
                      <th className="px-3 py-2">Duration</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-terminal-700">
                    {recentJobs.map((job) => (
                      <tr className="text-slate-400" key={job.id}>
                        <td className="px-3 py-2 text-slate-200">{job.jobName}</td>
                        <td className="px-3 py-2">{job.pipeline}</td>
                        <td className="px-3 py-2">{job.duration}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-2">
                            <span className={cn("h-2 w-2 rounded-full", statusDot[job.status])} />
                            {job.status}
                          </span>
                          <p className="mt-1 text-[10px] text-slate-600">
                            {formatDate(job.date)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {runner.runnerType === "self-hosted" ? (
              <section className="rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-4">
                <h3 className="text-sm font-medium text-cyan-400">
                  Registration token hint
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Self-hosted runner registration tokens will be generated from the
                  provider API in a later phase. Never paste real runner tokens into
                  shared screenshots.
                </p>
              </section>
            ) : null}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
