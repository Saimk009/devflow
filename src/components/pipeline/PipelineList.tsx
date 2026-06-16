import { GitBranch } from "lucide-react"

import { EmptyState } from "@/components/ui/EmptyState"
import { PipelineListSkeleton } from "@/components/ui/PipelineSkeleton"

import { PipelineCard } from "./PipelineCard"

import type { Pipeline } from "@/types"

type PipelineListProps = {
  pipelines: Pipeline[]
  isLoading?: boolean
}

export function PipelineList({ pipelines, isLoading = false }: PipelineListProps) {
  if (isLoading) {
    return <PipelineListSkeleton />
  }

  if (pipelines.length === 0) {
    return (
      <EmptyState
        description="Adjust your filters or wait for the next polling refresh."
        icon={GitBranch}
        title="No pipelines found"
      />
    )
  }

  return (
    <div className="space-y-3">
      {pipelines.map((pipeline) => (
        <PipelineCard key={pipeline.id} pipeline={pipeline} />
      ))}
    </div>
  )
}
