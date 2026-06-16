import type { PipelineStatus } from "@/types"

export const statusStyles: Record<
  PipelineStatus,
  {
    border: string
    dot: string
    text: string
    stroke: string
  }
> = {
  queued: {
    border: "border-l-pipeline-queued",
    dot: "bg-pipeline-queued",
    text: "text-pipeline-queued",
    stroke: "#94a3b8",
  },
  running: {
    border: "border-l-pipeline-running",
    dot: "bg-pipeline-running",
    text: "text-pipeline-running",
    stroke: "#3b82f6",
  },
  success: {
    border: "border-l-pipeline-success",
    dot: "bg-pipeline-success",
    text: "text-pipeline-success",
    stroke: "#22c55e",
  },
  failed: {
    border: "border-l-pipeline-failed",
    dot: "bg-pipeline-failed",
    text: "text-pipeline-failed",
    stroke: "#ef4444",
  },
  cancelled: {
    border: "border-l-pipeline-cancelled",
    dot: "bg-pipeline-cancelled",
    text: "text-pipeline-cancelled",
    stroke: "#6b7280",
  },
  skipped: {
    border: "border-l-pipeline-skipped",
    dot: "bg-pipeline-skipped",
    text: "text-pipeline-skipped",
    stroke: "#a855f7",
  },
}
