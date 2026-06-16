import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

import { PipelineFilters } from "@/components/pipeline/PipelineFilters"
import { PipelineList } from "@/components/pipeline/PipelineList"
import { RepoSelector } from "@/components/shared/RepoSelector"
import { ErrorState } from "@/components/ui/ErrorState"
import { usePipelineFilters } from "@/hooks/usePipelineFilters"
import { usePipelines } from "@/hooks/usePipelines"
import { useRepoContext } from "@/hooks/useRepoContext"
import { toast } from "@/lib/toast"

export function PipelinesPage() {
  const navigate = useNavigate()
  const { selectedRepo } = useRepoContext()
  const {
    data: pipelines = [],
    error,
    isError,
    isLoading,
    refetch,
  } = usePipelines(selectedRepo)
  const { filteredPipelines } = usePipelineFilters(pipelines)

  useEffect(() => {
    if (isError) {
      toast.apiError(
        error,
        () => void refetch(),
        () => navigate("/settings?tab=providers"),
      )
    }
  }, [error, isError, navigate, refetch])

  return (
    <section className="h-full overflow-auto p-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
            Pipelines
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-white">
            Recent pipeline runs
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Mock data refreshes every 10 seconds through TanStack Query polling.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RepoSelector />
          <div className="rounded-full border border-terminal-700 bg-terminal-900 px-3 py-1 text-sm text-slate-400">
            Showing {filteredPipelines.length} of {pipelines.length} pipelines
          </div>
        </div>
      </div>

      <PipelineFilters pipelines={pipelines} />
      {isError ? (
        <ErrorState
          message="DevFlow could not load pipeline runs. Try again to refresh the mock API request."
          onRetry={() => void refetch()}
          title="Unable to load pipelines"
        />
      ) : (
        <PipelineList isLoading={isLoading} pipelines={filteredPipelines} />
      )}
    </section>
  )
}
