import { Skeleton } from "./skeleton"

export function PipelineSkeleton() {
  return (
    <div className="rounded-xl border border-l-4 border-l-terminal-700 border-terminal-700 bg-terminal-900 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-5 w-56" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-4 w-3/4" />
      <div className="mt-4 flex gap-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="mt-4 h-6 w-40" />
    </div>
  )
}

export function PipelineListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }, (_, index) => (
        <PipelineSkeleton key={index} />
      ))}
    </div>
  )
}
