import { GitBranch } from "lucide-react"
import { memo } from "react"
import { useNavigate } from "react-router-dom"

import { formatDate } from "@/lib/formatDate"
import type { Pipeline, PipelineStatus } from "@/types"
import type { KeyboardEvent } from "react"

type PipelineCardProps = {
  pipeline: Pipeline
}

const statusStyles: Record<
  PipelineStatus,
  { border: string; dot: string; badge: string; label: string }
> = {
  queued: {
    border: "border-l-pipeline-queued",
    dot: "bg-pipeline-queued",
    badge: "border-pipeline-queued/40 text-pipeline-queued",
    label: "Queued",
  },
  running: {
    border: "border-l-pipeline-running",
    dot: "bg-pipeline-running",
    badge: "border-pipeline-running/40 text-pipeline-running",
    label: "Running",
  },
  success: {
    border: "border-l-pipeline-success",
    dot: "bg-pipeline-success",
    badge: "border-pipeline-success/40 text-pipeline-success",
    label: "Success",
  },
  failed: {
    border: "border-l-pipeline-failed",
    dot: "bg-pipeline-failed",
    badge: "border-pipeline-failed/40 text-pipeline-failed",
    label: "Failed",
  },
  cancelled: {
    border: "border-l-pipeline-cancelled",
    dot: "bg-pipeline-cancelled",
    badge: "border-pipeline-cancelled/40 text-pipeline-cancelled",
    label: "Cancelled",
  },
  skipped: {
    border: "border-l-pipeline-skipped",
    dot: "bg-pipeline-skipped",
    badge: "border-pipeline-skipped/40 text-pipeline-skipped",
    label: "Skipped",
  },
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

function PipelineCardComponent({ pipeline }: PipelineCardProps) {
  const navigate = useNavigate()
  const styles = statusStyles[pipeline.status]
  const pipelinePath = `/pipeline/${pipeline.id}`
  const triggeredTime = formatDate(pipeline.triggeredAt)

  const openPipeline = () => {
    navigate(pipelinePath)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      openPipeline()
    }
  }

  return (
    <article
      aria-label={`${pipeline.name} — ${styles.label} — triggered ${triggeredTime}`}
      className={`cursor-pointer rounded-xl border border-l-4 border-terminal-700 ${styles.border} bg-terminal-900 p-4 transition hover:scale-[1.005] hover:bg-terminal-800 focus:outline-none focus:ring-2 focus:ring-cyan-400`}
      onClick={openPipeline}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            {pipeline.repoName}
          </p>
          <h2 className="mt-1 truncate text-lg font-semibold text-white">
            {pipeline.name}
          </h2>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-2 rounded-full border bg-terminal-950 px-2.5 py-1 text-xs font-medium ${styles.badge}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${styles.dot} ${
              pipeline.status === "running" ? "animate-pulse motion-reduce:animate-none" : ""
            }`}
          />
          {styles.label}
        </span>
      </div>

      <p className="mt-3 line-clamp-1 text-sm text-slate-300">
        {pipeline.commitMessage}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5 text-slate-400">
          <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
          {pipeline.branch}
        </span>
        <span className="font-mono text-slate-400">
          {pipeline.commitSha.slice(0, 7)}
        </span>
        <span>{triggeredTime}</span>
        <span>{formatDuration(pipeline.duration)}</span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <img
          alt={`${pipeline.author} avatar`}
          className="h-6 w-6 rounded-full border border-terminal-700"
          src={pipeline.avatarUrl}
        />
        <span className="text-sm text-slate-400">{pipeline.author}</span>
      </div>
    </article>
  )
}

export const PipelineCard = memo(
  PipelineCardComponent,
  (previousProps, nextProps) =>
    previousProps.pipeline.id === nextProps.pipeline.id &&
    previousProps.pipeline.status === nextProps.pipeline.status,
)
