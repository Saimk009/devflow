import { Handle, Position, type NodeProps } from "@xyflow/react"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"
import type { Job } from "@/types"

import { statusStyles } from "./styles"

export type JobNodeData = {
  job: Job
  isFocused?: boolean
  isSelected: boolean
  onClick: (job: Job) => void
}

const formatDuration = (duration?: number, startedAt?: string) => {
  const secondsFromStart = startedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1_000))
    : undefined
  const totalSeconds = duration ?? secondsFromStart

  if (!totalSeconds) {
    return "Live"
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) {
    return `${seconds}s`
  }

  return `${minutes}m ${seconds}s`
}

export function JobNode({ data }: NodeProps) {
  const { job, isFocused, isSelected, onClick } = data as JobNodeData
  const shouldReduceMotion = useReducedMotion()
  const styles = statusStyles[job.status]
  const isRunning = job.status === "running"

  return (
    <motion.button
      className={cn(
        "relative w-[200px] overflow-hidden rounded-lg border border-l-4 border-terminal-700 bg-terminal-800 p-3 text-left shadow-lg shadow-black/20 transition focus:outline-none focus:ring-2 focus:ring-cyan-400",
        styles.border,
        isSelected && "ring-2 ring-cyan-400",
        isFocused && "outline outline-2 outline-offset-2 outline-cyan-400",
      )}
      onClick={() => onClick(job)}
      type="button"
      whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
    >
      {isRunning && !shouldReduceMotion ? (
        <motion.div
          animate={{ opacity: [0.15, 0.35, 0.15], x: ["-40%", "120%"] }}
          className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
          transition={{ duration: 2, ease: "linear", repeat: Infinity }}
        />
      ) : null}

      <Handle
        className="!h-3 !w-3 !border-terminal-950 !bg-cyan-400"
        position={Position.Left}
        type="target"
      />
      <Handle
        className="!h-3 !w-3 !border-terminal-950 !bg-cyan-400"
        position={Position.Right}
        type="source"
      />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <h3 className="truncate font-mono text-sm font-semibold text-slate-100">
            {job.name}
          </h3>
          <span
            className={cn(
              "h-2.5 w-2.5 shrink-0 rounded-full",
              styles.dot,
              isRunning && !shouldReduceMotion && "animate-pulse",
            )}
          />
        </div>

        <dl className="mt-3 space-y-2 text-xs text-slate-400">
          <div className="flex justify-between gap-3">
            <dt>Runner</dt>
            <dd className="truncate text-slate-300">{job.runnerName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>{isRunning ? "Elapsed" : "Duration"}</dt>
            <dd className="text-slate-300">
              {formatDuration(job.duration, job.startedAt)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Steps</dt>
            <dd className="text-slate-300">{job.steps.length}</dd>
          </div>
        </dl>
      </div>
    </motion.button>
  )
}
