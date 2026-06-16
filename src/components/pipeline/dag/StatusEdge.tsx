import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react"

import type { PipelineStatus } from "@/types"

import { statusStyles } from "./styles"

export type StatusEdgeData = {
  status: PipelineStatus
}

const blockedStatuses: PipelineStatus[] = ["queued", "skipped", "cancelled"]

export function StatusEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<Edge<StatusEdgeData>>) {
  const status = data?.status ?? "queued"
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })
  const isRunning = status === "running"
  const isBlocked = blockedStatuses.includes(status)

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        animation: isRunning ? "dashdraw 0.8s linear infinite" : undefined,
        opacity: isBlocked ? 0.45 : 1,
        stroke: isBlocked ? "#6b7280" : statusStyles[status].stroke,
        strokeDasharray: isRunning ? "6 6" : undefined,
        strokeWidth: 2,
      }}
    />
  )
}
