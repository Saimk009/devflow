import { useReducedMotion } from "framer-motion"
import {
  ChevronLeft,
  Clock,
  FileCode,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Play,
  RotateCcw,
  XCircle,
} from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"
import { lazy, Suspense, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { JobDetailPanel } from "@/components/pipeline/JobDetailPanel"
import { PipelineDAGSkeleton } from "@/components/pipeline/PipelineDAGSkeleton"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/ErrorState"
import { Skeleton } from "@/components/ui/skeleton"
import { useDataLayer } from "@/hooks/useDataLayer"
import { usePipelineMachine } from "@/hooks/usePipelineMachine"
import { usePipeline } from "@/hooks/usePipelines"
import { formatDate } from "@/lib/formatDate"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Job, Pipeline, PipelineStatus } from "@/types"

const PipelineDAG = lazy(() =>
  import("@/components/pipeline/PipelineDAG").then((module) => ({
    default: module.PipelineDAG,
  })),
)

const statusStyles: Record<
  PipelineStatus,
  { badge: string; dot: string; label: string; text: string }
> = {
  queued: {
    badge: "border-pipeline-queued/40 text-pipeline-queued",
    dot: "bg-pipeline-queued",
    label: "Queued",
    text: "text-pipeline-queued",
  },
  running: {
    badge: "border-pipeline-running/40 text-pipeline-running",
    dot: "bg-pipeline-running",
    label: "Running",
    text: "text-pipeline-running",
  },
  success: {
    badge: "border-pipeline-success/40 text-pipeline-success",
    dot: "bg-pipeline-success",
    label: "Success",
    text: "text-pipeline-success",
  },
  failed: {
    badge: "border-pipeline-failed/40 text-pipeline-failed",
    dot: "bg-pipeline-failed",
    label: "Failed",
    text: "text-pipeline-failed",
  },
  cancelled: {
    badge: "border-pipeline-cancelled/40 text-pipeline-cancelled",
    dot: "bg-pipeline-cancelled",
    label: "Cancelled",
    text: "text-pipeline-cancelled",
  },
  skipped: {
    badge: "border-pipeline-skipped/40 text-pipeline-skipped",
    dot: "bg-pipeline-skipped",
    label: "Skipped",
    text: "text-pipeline-skipped",
  },
}

const countStatuses: PipelineStatus[] = ["success", "failed", "running", "queued"]

const formatDuration = (seconds?: number) => {
  if (!seconds) {
    return "In progress"
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) {
    return `${remainingSeconds}s`
  }

  return `${minutes}m ${remainingSeconds}s`
}

const getTriggerType = (pipeline: Pipeline) => {
  if (pipeline.workflowFile.includes("schedule")) {
    return "schedule"
  }

  return pipeline.branch === "main" ? "push" : "pull_request"
}

const getDisplayPipeline = (
  pipeline: Pipeline,
  rerunStatus: PipelineStatus | null,
): Pipeline => {
  if (!rerunStatus) {
    return pipeline
  }

  const startedAt = rerunStatus === "running" ? new Date().toISOString() : undefined

  return {
    ...pipeline,
    status: rerunStatus,
    completedAt: undefined,
    duration: undefined,
    jobs: pipeline.jobs.map((job, index) => ({
      ...job,
      status: index === 0 && rerunStatus === "running" ? "running" : "queued",
      startedAt: index === 0 && rerunStatus === "running" ? startedAt : undefined,
      completedAt: undefined,
      duration: undefined,
      steps: job.steps.map((step, stepIndex) => ({
        ...step,
        status:
          index === 0 && stepIndex === 0 && rerunStatus === "running"
            ? "running"
            : "queued",
        startedAt:
          index === 0 && stepIndex === 0 && rerunStatus === "running"
            ? startedAt
            : undefined,
        completedAt: undefined,
        duration: undefined,
      })),
    })),
  }
}

function StatusBadge({ status, size = "base" }: { status: PipelineStatus; size?: "base" | "lg" }) {
  const styles = statusStyles[status]
  const shouldReduceMotion = useReducedMotion()

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border bg-terminal-950 font-medium capitalize",
        styles.badge,
        size === "lg" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs",
      )}
    >
      <span
        className={cn(
          "rounded-full",
          styles.dot,
          size === "lg" ? "h-2.5 w-2.5" : "h-2 w-2",
          status === "running" && !shouldReduceMotion && "animate-pulse",
        )}
      />
      {styles.label}
    </span>
  )
}

export function PipelineDetailPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const dataLayer = useDataLayer()
  const { data: pipeline, isLoading } = usePipeline(id)
  const { send } = usePipelineMachine()
  const [selectedJobId, setSelectedJobId] = useQueryState(
    "job",
    parseAsString.withDefault(""),
  )
  const [localStatus, setLocalStatus] = useState<PipelineStatus | null>(null)
  const displayPipeline = pipeline
    ? getDisplayPipeline(pipeline, localStatus)
    : undefined
  const selectedJob = useMemo(
    () =>
      displayPipeline?.jobs.find((job) => job.id === selectedJobId) ?? null,
    [displayPipeline, selectedJobId],
  )
  const triggerType = displayPipeline ? getTriggerType(displayPipeline) : "push"
  const TriggerIcon =
    triggerType === "pull_request"
      ? GitPullRequest
      : triggerType === "schedule"
        ? Clock
        : GitCommit

  useEffect(() => {
    if (!displayPipeline || !selectedJobId) {
      return
    }

    if (!displayPipeline.jobs.some((job) => job.id === selectedJobId)) {
      void setSelectedJobId("")
    }
  }, [displayPipeline, selectedJobId, setSelectedJobId])

  const handleJobSelect = (job: Job) => {
    void setSelectedJobId(job.id)
  }

  const closeJobPanel = () => {
    void setSelectedJobId("")
  }

  const handleRerun = async () => {
    if (!pipeline) {
      return
    }

    try {
      if (!dataLayer.isMockMode) {
        await dataLayer.rerunPipeline(pipeline.id)
      }

      setLocalStatus("queued")
      send({ type: "TRIGGER", pipelineId: pipeline.id })
      toast.success(`Re-running ${pipeline.name}...`)

      window.setTimeout(() => {
        setLocalStatus("running")
        send({ type: "START" })
      }, 1_500)
    } catch (error) {
      toast.apiError(
        error,
        () => void handleRerun(),
        () => navigate("/settings?tab=providers"),
      )
    }
  }

  const handleCancel = async () => {
    if (!pipeline) {
      return
    }

    try {
      if (!dataLayer.isMockMode) {
        await dataLayer.cancelPipeline(pipeline.id)
      }

      setLocalStatus("cancelled")
      send({ type: "CANCEL" })
      toast.info(`${pipeline.name} cancelled`)
    } catch (error) {
      toast.apiError(
        error,
        () => void handleCancel(),
        () => navigate("/settings?tab=providers"),
      )
    }
  }

  if (isLoading) {
    return (
      <section className="h-full overflow-auto p-6">
        <Skeleton className="h-56 rounded-xl border border-terminal-700 bg-terminal-900" />
        <div className="mt-4">
          <PipelineDAGSkeleton />
        </div>
      </section>
    )
  }

  if (!pipeline || !displayPipeline) {
    return (
      <section className="h-full overflow-auto p-6">
        <ErrorState
          message="This pipeline may have been deleted or the URL is incorrect."
          title="Pipeline not found"
        />
        <Link
          className="mt-4 inline-flex h-9 items-center justify-center rounded-md border border-cyan-400/60 bg-terminal-900 px-3 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
          to="/pipelines"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to pipelines
        </Link>
      </section>
    )
  }

  const jobCounts = countStatuses.map((status) => ({
    status,
    count: displayPipeline.jobs.filter((job) => job.status === status).length,
  }))

  return (
    <section className="h-full overflow-auto p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link
          className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
          to="/pipelines"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to pipelines
        </Link>

        <Button
          className="border-cyan-400/60 text-cyan-400 hover:bg-cyan-400/10"
          onClick={() => void handleRerun()}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Re-run
        </Button>
        {displayPipeline.status === "running" ? (
          <Button
            className="ml-2 border-pipeline-failed/50 text-pipeline-failed hover:bg-pipeline-failed/10"
            onClick={() => void handleCancel()}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        ) : null}
      </div>

      <header className="rounded-xl border border-terminal-700 bg-terminal-900 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
              {displayPipeline.repoName}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              {displayPipeline.name}
            </h1>
          </div>
          <StatusBadge size="lg" status={displayPipeline.status} />
        </div>

        <div className="mt-5 flex flex-wrap gap-3 rounded-lg border border-terminal-700 bg-terminal-950 px-4 py-3 text-sm text-slate-400">
          <span className="inline-flex items-center gap-2 text-slate-300">
            <GitBranch className="h-4 w-4 text-cyan-400" />
            {displayPipeline.branch}
          </span>
          <span className="font-mono text-slate-300">
            {displayPipeline.commitSha.slice(0, 7)}
          </span>
          <span>{displayPipeline.commitMessage}</span>
        </div>
      </header>

      <div className="mt-4 grid gap-3 rounded-xl border border-terminal-700 bg-terminal-900 p-4 text-sm text-slate-400 xl:grid-cols-5">
        <div className="inline-flex items-center gap-2">
          <FileCode className="h-4 w-4 text-cyan-400" />
          <span className="font-mono text-slate-300">
            {displayPipeline.workflowFile}
          </span>
        </div>
        <div className="inline-flex items-center gap-2">
          <img
            alt={`${displayPipeline.author} avatar`}
            className="h-6 w-6 rounded-full border border-terminal-700"
            src={displayPipeline.avatarUrl}
          />
          <span>Triggered by {displayPipeline.author}</span>
        </div>
        <div className="inline-flex items-center gap-2">
          <TriggerIcon className="h-4 w-4 text-cyan-400" />
          <span>{triggerType}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {jobCounts.map(({ status, count }) => (
            <span className={statusStyles[status].text} key={status}>
              {count} {status}
            </span>
          ))}
        </div>
        <div className="inline-flex items-center gap-2">
          <Play className="h-4 w-4 text-cyan-400" />
          <span>
            {displayPipeline.duration
              ? formatDuration(displayPipeline.duration)
              : formatDate(displayPipeline.triggeredAt)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-4">
        <div className="min-w-0 flex-1">
          <Suspense fallback={<PipelineDAGSkeleton />}>
            <PipelineDAG
              onJobSelect={handleJobSelect}
              pipeline={displayPipeline}
              selectedJobId={selectedJob?.id ?? null}
            />
          </Suspense>
        </div>
        {selectedJob ? (
          <div className="w-[420px] shrink-0" aria-hidden="true" />
        ) : null}
      </div>

      <JobDetailPanel job={selectedJob} onClose={closeJobPanel} />
    </section>
  )
}
