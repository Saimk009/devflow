import { Skeleton } from "@/components/ui/skeleton"

export function PipelineDAGSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-14 rounded-xl border border-terminal-700 bg-terminal-900" />
      <div className="relative h-[480px] overflow-hidden rounded-xl border border-terminal-700 bg-terminal-900 p-8">
        <div className="grid h-full grid-cols-2 gap-8">
          <div className="space-y-12">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
          <div className="space-y-12 pt-12">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
        <div className="absolute left-[48%] top-20 h-40 w-24 border-t border-dashed border-terminal-700" />
        <div className="absolute left-[48%] top-52 h-40 w-24 border-t border-dashed border-terminal-700" />
      </div>
    </div>
  )
}
