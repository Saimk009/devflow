import { useQuery } from "@tanstack/react-query"
import { RefreshCw, Workflow } from "lucide-react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

import { RepoSelector } from "@/components/shared/RepoSelector"
import { EmptyState } from "@/components/ui/EmptyState"
import { Button } from "@/components/ui/button"
import {
  WorkflowCard,
  WorkflowCardSkeleton,
} from "@/components/workflows/WorkflowCard"
import { useDataLayer } from "@/hooks/useDataLayer"
import { useRepoContext } from "@/hooks/useRepoContext"
import { toast } from "@/lib/toast"

export function WorkflowsPage() {
  const navigate = useNavigate()
  const { selectedRepo } = useRepoContext()
  const dataLayer = useDataLayer()
  const {
    data: workflows = [],
    error,
    isFetching,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["workflows", dataLayer.provider?.id ?? "mock", selectedRepo ?? "all"],
    queryFn: () => dataLayer.fetchWorkflows(selectedRepo ?? undefined),
  })

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
            Workflows
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Workflows</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <RepoSelector />
          <Button
            aria-label="Refresh workflows"
            className="h-9 w-9 p-0"
            onClick={() => void refetch()}
          >
            <RefreshCw
              className={
                isFetching
                  ? "h-4 w-4 animate-spin text-cyan-400 motion-reduce:animate-none"
                  : "h-4 w-4"
              }
            />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <WorkflowCardSkeleton key={index} />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <EmptyState
          description="No workflows found for this repository."
          icon={Workflow}
          title="No workflows found"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              provider={dataLayer.provider}
              workflow={workflow}
            />
          ))}
        </div>
      )}
    </section>
  )
}
