import { ArrowLeft, GitBranch } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { usePipeline } from "@/hooks/usePipelines"
import { formatDate } from "@/lib/formatDate"

export function PipelineDetailPage() {
  const { id = "" } = useParams()
  const { data: pipeline, isLoading } = usePipeline(id)

  if (isLoading) {
    return (
      <section className="h-full overflow-auto p-6">
        <div className="h-48 animate-pulse rounded-xl border border-terminal-700 bg-terminal-900" />
      </section>
    )
  }

  if (!pipeline) {
    return (
      <section className="h-full overflow-auto p-6">
        <div className="rounded-xl border border-terminal-700 bg-terminal-900 p-6">
          <h1 className="text-xl font-semibold text-white">Pipeline not found</h1>
          <Link
            className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
            to="/pipelines"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to pipelines
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="h-full overflow-auto p-6">
      <Link
        className="mb-6 inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
        to="/pipelines"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to pipelines
      </Link>

      <div className="rounded-xl border border-terminal-700 bg-terminal-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
              {pipeline.repoName}
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-white">
              {pipeline.name}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {pipeline.commitMessage}
            </p>
          </div>
          <span className="rounded-full border border-terminal-700 bg-terminal-950 px-3 py-1 text-sm capitalize text-slate-300">
            {pipeline.status}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2 text-slate-400">
            <GitBranch className="h-4 w-4 text-cyan-400" />
            {pipeline.branch}
          </span>
          <span className="font-mono">{pipeline.commitSha.slice(0, 7)}</span>
          <span>{formatDate(pipeline.triggeredAt)}</span>
          <span>{pipeline.jobs.length} jobs</span>
        </div>
      </div>
    </section>
  )
}
