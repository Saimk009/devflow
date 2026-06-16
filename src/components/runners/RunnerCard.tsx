import { formatDistanceToNow } from "date-fns"
import { motion, useReducedMotion } from "framer-motion"
import { Apple, Monitor, Terminal, type LucideIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { formatDate } from "@/lib/formatDate"
import { cn } from "@/lib/utils"
import type { Runner } from "@/types"

type RunnerCardProps = {
  runner: Runner
  onClick: (runner: Runner) => void
}

const statusStyles = {
  online: {
    label: "Online",
    dot: "bg-pipeline-success",
    text: "text-pipeline-success",
  },
  busy: {
    label: "Busy",
    dot: "bg-pipeline-running",
    text: "text-pipeline-running",
  },
  offline: {
    label: "Offline",
    dot: "bg-pipeline-cancelled",
    text: "text-slate-400",
  },
  disabled: {
    label: "Disabled",
    dot: "bg-pipeline-failed",
    text: "text-pipeline-failed",
  },
}

const typeStyles: Record<Runner["runnerType"], string> = {
  "github-hosted": "text-slate-300",
  "self-hosted": "text-cyan-400",
  "gitlab-shared": "text-orange-400",
  "gitlab-specific": "text-orange-300",
}

const typeLabels: Record<Runner["runnerType"], string> = {
  "github-hosted": "GitHub-hosted",
  "self-hosted": "Self-hosted",
  "gitlab-shared": "GitLab Shared",
  "gitlab-specific": "GitLab Specific",
}

const osIcons: Record<Runner["os"], LucideIcon> = {
  linux: Terminal,
  windows: Monitor,
  macos: Apple,
}

const utilizationColor = (value: number) => {
  if (value > 80) return "bg-pipeline-failed"
  if (value >= 60) return "bg-amber-400"
  return "bg-pipeline-success"
}

function BusyElapsed({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(() =>
    formatDistanceToNow(new Date(startedAt), { addSuffix: false }),
  )

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setElapsed(formatDistanceToNow(new Date(startedAt), { addSuffix: false }))
    }, 1_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [startedAt])

  return <span>{elapsed}</span>
}

export function RunnerCard({ onClick, runner }: RunnerCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const OsIcon = osIcons[runner.os]
  const visibleLabels = runner.labels.slice(0, 4)
  const hiddenLabelCount = Math.max(0, runner.labels.length - visibleLabels.length)

  return (
    <motion.button
      animate={
        runner.status === "busy" && !shouldReduceMotion
          ? { borderColor: ["#21262d", "#22d3ee", "#21262d"] }
          : undefined
      }
      className="rounded-xl border border-terminal-700 bg-terminal-900 p-4 text-left shadow-lg shadow-black/20 transition hover:bg-terminal-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
      onClick={() => onClick(runner)}
      transition={{ duration: 2, repeat: Infinity }}
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <OsIcon className="h-5 w-5 shrink-0 text-cyan-400" />
          <h2 className="truncate text-base font-semibold text-white">
            {runner.name}
          </h2>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full border border-terminal-700 bg-terminal-950 px-2.5 py-1 text-xs font-medium",
            statusStyles[runner.status].text,
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              statusStyles[runner.status].dot,
              runner.status === "busy" &&
                !shouldReduceMotion &&
                "animate-pulse",
            )}
          />
          {statusStyles[runner.status].label}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={cn(
            "rounded-full border border-terminal-700 bg-terminal-950 px-2 py-1 text-xs",
            typeStyles[runner.runnerType],
          )}
        >
          {typeLabels[runner.runnerType]}
        </span>
        {visibleLabels.map((label) => (
          <span
            className="rounded-md border border-terminal-700 bg-terminal-950 px-2 py-1 font-mono text-xs text-slate-400"
            key={label}
          >
            {label}
          </span>
        ))}
        {hiddenLabelCount > 0 ? (
          <span className="rounded-md border border-terminal-700 bg-terminal-950 px-2 py-1 text-xs text-slate-500">
            +{hiddenLabelCount} more
          </span>
        ) : null}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs text-slate-500">
          <span>{runner.utilization}% utilized</span>
          <span>last 24h</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-terminal-950">
          <div
            className={cn("h-full rounded-full", utilizationColor(runner.utilization))}
            style={{ width: `${runner.utilization}%` }}
          />
        </div>
      </div>

      {runner.status === "busy" && runner.currentJob ? (
        <div className="mt-5 rounded-lg border border-terminal-700 bg-terminal-950 p-3 text-sm">
          <p className="text-slate-500">Currently running:</p>
          <p className="mt-1 font-medium text-slate-200">
            {runner.currentJob.jobName}
          </p>
          <p className="mt-1 text-slate-400">
            {runner.currentJob.pipelineName} ·{" "}
            <BusyElapsed startedAt={runner.currentJob.startedAt} />
          </p>
        </div>
      ) : null}

      {runner.status === "offline" ? (
        <p className="mt-5 text-sm text-slate-500">
          Last seen {formatDate(runner.lastSeenAt)}
        </p>
      ) : null}

      <div className="mt-5 flex items-center justify-between border-t border-terminal-700 pt-3">
        <span className="font-mono text-xs text-slate-500">v{runner.version}</span>
        <span className="rounded-md border border-terminal-700 bg-terminal-950 px-2 py-1 text-xs text-slate-400">
          {runner.arch}
        </span>
      </div>
    </motion.button>
  )
}
