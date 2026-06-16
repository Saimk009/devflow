import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Clock, GitCommit, GitPullRequest } from "lucide-react"

import type { Pipeline } from "@/types"

export type TriggerNodeData = {
  pipeline: Pipeline
  triggerType?: "commit" | "pull-request" | "scheduled"
}

const triggerIcons = {
  commit: GitCommit,
  "pull-request": GitPullRequest,
  scheduled: Clock,
}

export function TriggerNode({ data }: NodeProps) {
  const { pipeline, triggerType = "commit" } = data as TriggerNodeData
  const TriggerIcon = triggerIcons[triggerType]

  return (
    <div className="relative inline-flex min-w-[180px] items-center gap-3 rounded-full border border-cyan-400 bg-terminal-900 px-4 py-3 text-sm shadow-lg shadow-cyan-950/20">
      <Handle
        className="!h-3 !w-3 !border-terminal-950 !bg-cyan-400"
        position={Position.Right}
        type="source"
      />
      <TriggerIcon className="h-4 w-4 text-cyan-400" />
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-200">{pipeline.branch}</p>
        <p className="font-mono text-xs text-slate-500">
          {pipeline.commitSha.slice(0, 7)}
        </p>
      </div>
    </div>
  )
}
