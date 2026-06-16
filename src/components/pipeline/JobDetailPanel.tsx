import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  Ban,
  CheckCircle2,
  Clock,
  Loader2,
  SkipForward,
  X,
  XCircle,
} from "lucide-react"
import { useEffect } from "react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import useLogStream from "@/hooks/useLogStream"
import { cn } from "@/lib/utils"
import type { Job, LogLine, PipelineStatus, Step } from "@/types"

import { LogTerminal } from "./LogTerminal"

type JobDetailPanelProps = {
  job: Job | null
  onClose: () => void
}

const statusStyles: Record<
  PipelineStatus,
  { badge: string; dot: string; icon: typeof CheckCircle2; label: string }
> = {
  success: {
    badge: "border-pipeline-success/40 text-pipeline-success",
    dot: "bg-pipeline-success",
    icon: CheckCircle2,
    label: "Success",
  },
  failed: {
    badge: "border-pipeline-failed/40 text-pipeline-failed",
    dot: "bg-pipeline-failed",
    icon: XCircle,
    label: "Failed",
  },
  running: {
    badge: "border-pipeline-running/40 text-pipeline-running",
    dot: "bg-pipeline-running",
    icon: Loader2,
    label: "Running",
  },
  queued: {
    badge: "border-pipeline-queued/40 text-pipeline-queued",
    dot: "bg-pipeline-queued",
    icon: Clock,
    label: "Queued",
  },
  cancelled: {
    badge: "border-pipeline-cancelled/40 text-pipeline-cancelled",
    dot: "bg-pipeline-cancelled",
    icon: Ban,
    label: "Cancelled",
  },
  skipped: {
    badge: "border-pipeline-skipped/40 text-pipeline-skipped",
    dot: "bg-pipeline-skipped",
    icon: SkipForward,
    label: "Skipped",
  },
}

const formatDateTime = (timestamp?: string) => {
  if (!timestamp) {
    return "Not started"
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp))
}

const formatDuration = (seconds?: number) => {
  if (!seconds) {
    return "In progress"
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) {
    return `${remainingSeconds}s`
  }

  return `${minutes}m ${remainingSeconds}s`
}

function StepStatusIcon({ status }: { status: PipelineStatus }) {
  const Icon = statusStyles[status].icon
  const shouldReduceMotion = useReducedMotion()

  return (
    <Icon
      className={cn(
        "h-4 w-4",
        statusStyles[status].badge.split(" ").find((token) => token.startsWith("text-")),
        status === "running" && !shouldReduceMotion && "animate-spin",
      )}
    />
  )
}

function StepLogs({ jobId, step }: { jobId: string; step: Step }) {
  const shouldStream = step.status === "running"
  const stream = useLogStream(jobId, step.id, { enabled: shouldStream })
  const lines: LogLine[] = shouldStream ? stream.lines : step.logs

  return (
    <LogTerminal
      isStreaming={shouldStream && stream.isStreaming}
      lines={lines}
      stepName={step.name}
    />
  )
}

export function JobDetailPanel({ job, onClose }: JobDetailPanelProps) {
  const shouldReduceMotion = useReducedMotion()
  const expandedStepIds =
    job?.steps
      .filter((step) => step.status === "running" || step.status === "failed")
      .map((step) => step.id) ?? []

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }
    const handleClosePanel = () => onClose()

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("devflow:close-panel", handleClosePanel)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("devflow:close-panel", handleClosePanel)
    }
  }, [onClose])

  return (
    <AnimatePresence initial={!shouldReduceMotion}>
      {job ? (
        <motion.aside
          animate={{ x: 0 }}
          className="fixed right-0 top-0 z-50 flex h-screen w-[420px] flex-col border-l border-terminal-700 bg-terminal-900 shadow-2xl shadow-black/40"
          exit={shouldReduceMotion ? undefined : { x: "100%" }}
          initial={shouldReduceMotion ? false : { x: "100%" }}
          transition={
            shouldReduceMotion ? undefined : { duration: 0.3, ease: "easeOut" }
          }
        >
          <header className="border-b border-terminal-700 p-5">
            <Button
              aria-label="Close job details"
              className="absolute right-4 top-4 h-8 w-8 bg-terminal-950 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="pr-10">
              <h2 className="text-lg font-semibold text-white">{job.name}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border bg-terminal-950 px-2.5 py-1 text-xs font-medium",
                    statusStyles[job.status].badge,
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      statusStyles[job.status].dot,
                      job.status === "running" &&
                        !shouldReduceMotion &&
                        "animate-pulse",
                    )}
                  />
                  {statusStyles[job.status].label}
                </span>
                <span className="text-sm text-slate-400">{job.runnerName}</span>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Started</dt>
                <dd className="mt-1 text-slate-300">{formatDateTime(job.startedAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Duration</dt>
                <dd className="mt-1 text-slate-300">{formatDuration(job.duration)}</dd>
              </div>
            </dl>
          </header>

          <div className="flex-1 overflow-y-auto p-5">
            <Accordion
              className="rounded-xl border border-terminal-700 bg-terminal-950 px-4"
              defaultValue={expandedStepIds}
              key={job.id}
              type="multiple"
            >
              {job.steps.map((step) => (
                <AccordionItem key={step.id} value={step.id}>
                  <AccordionTrigger>
                    <div className="flex min-w-0 flex-1 items-center gap-3 pr-3">
                      <StepStatusIcon status={step.status} />
                      <span className="truncate text-left">{step.name}</span>
                    </div>
                    <span className="mr-3 shrink-0 text-xs text-slate-500">
                      {formatDuration(step.duration)}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <StepLogs jobId={job.id} step={step} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
