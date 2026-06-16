import { PipelineDAGSkeleton } from "@/components/pipeline/PipelineDAGSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export function PipelineDetailPageFallback() {
  return (
    <section className="h-full overflow-auto p-6">
      <Skeleton className="h-56 rounded-xl border border-terminal-700 bg-terminal-900" />
      <div className="mt-4">
        <PipelineDAGSkeleton />
      </div>
    </section>
  )
}
