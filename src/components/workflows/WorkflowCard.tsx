import {
  Clock,
  GitBranch,
  GitPullRequest,
  MoreVertical,
  Play,
  Tag,
  Zap,
} from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/formatDate"
import { cn } from "@/lib/utils"
import type {
  GitHubProvider,
  GitLabProvider,
  Workflow,
  WorkflowTrigger,
  WorkflowTriggerType,
} from "@/types"

import { TriggerWorkflowModal } from "./TriggerWorkflowModal"

type WorkflowCardProps = {
  provider: GitHubProvider | GitLabProvider | null
  workflow: Workflow
}

const triggerIcons: Record<WorkflowTriggerType, typeof GitBranch> = {
  push: GitBranch,
  pull_request: GitPullRequest,
  schedule: Clock,
  workflow_dispatch: Play,
  tag: Tag,
  merge_request: GitPullRequest,
}

const statusDot = {
  queued: "bg-pipeline-queued",
  running: "bg-pipeline-running",
  success: "bg-pipeline-success",
  failed: "bg-pipeline-failed",
  cancelled: "bg-pipeline-cancelled",
  skipped: "bg-pipeline-skipped",
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`
}

const successRateClass = (rate: number) => {
  if (rate > 90) return "text-pipeline-success"
  if (rate >= 70) return "text-amber-400"
  return "text-pipeline-failed"
}

const getTriggerTitle = (trigger: WorkflowTrigger) => {
  if (trigger.type === "schedule") {
    return trigger.schedule ?? "Scheduled workflow"
  }

  if (trigger.type === "push") {
    return trigger.branches?.join(", ") ?? "All branches"
  }

  return trigger.type
}

export function WorkflowCard({ provider, workflow }: WorkflowCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isTriggerOpen, setIsTriggerOpen] = useState(false)
  const isActive = workflow.state === "active"

  return (
    <article className="relative rounded-xl border border-terminal-700 bg-terminal-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{workflow.name}</h2>
          <p className="mt-1 font-mono text-sm text-slate-500">{workflow.path}</p>
        </div>
        <span
          className={
            isActive
              ? "rounded-full border border-pipeline-success/40 bg-terminal-950 px-2.5 py-1 text-xs text-pipeline-success"
              : "rounded-full border border-terminal-700 bg-terminal-950 px-2.5 py-1 text-xs text-slate-400"
          }
        >
          {isActive ? "Active" : "Disabled"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {workflow.triggers.map((trigger) => {
          const TriggerIcon = triggerIcons[trigger.type]

          return (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-terminal-700 bg-terminal-950 px-2.5 py-1 text-xs text-slate-400"
              key={`${trigger.type}-${getTriggerTitle(trigger)}`}
              title={getTriggerTitle(trigger)}
            >
              <TriggerIcon className="h-3.5 w-3.5 text-cyan-400" />
              {trigger.type}
            </span>
          )
        })}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 rounded-lg border border-terminal-700 bg-terminal-950 p-3 text-sm">
        <div>
          <p className="text-slate-500">Runs</p>
          <p className="mt-1 text-slate-200">{workflow.totalRuns}</p>
        </div>
        <div>
          <p className="text-slate-500">Avg</p>
          <p className="mt-1 text-slate-200">{formatDuration(workflow.avgDuration)}</p>
        </div>
        <div>
          <p className="text-slate-500">Success</p>
          <p className={cn("mt-1 font-semibold", successRateClass(workflow.successRate))}>
            {workflow.successRate}%
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
        {workflow.lastRunStatus ? (
          <span className={cn("h-2 w-2 rounded-full", statusDot[workflow.lastRunStatus])} />
        ) : null}
        <span>
          Last run {workflow.lastRunAt ? formatDate(workflow.lastRunAt) : "never"}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-terminal-700 pt-4">
        <Link
          className="text-sm text-cyan-400 hover:text-cyan-300"
          to={`/pipelines?workflow=${encodeURIComponent(workflow.fileName)}`}
        >
          View Runs →
        </Link>
        <div className="flex items-center gap-2">
          <Button
            className="border-cyan-400/60 text-cyan-400 hover:bg-cyan-400/10"
            onClick={() => setIsTriggerOpen(true)}
          >
            <Zap className="mr-2 h-4 w-4" />
            Trigger Run
          </Button>
          <div className="relative">
            <Button
              aria-label="Workflow actions"
              className="h-9 w-9 p-0"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            {isMenuOpen ? (
              <div className="absolute right-0 top-10 z-10 w-44 rounded-lg border border-terminal-700 bg-terminal-950 p-1 shadow-xl shadow-black/40">
                {[
                  isActive ? "Disable workflow" : "Enable workflow",
                  "View YAML",
                ].map((label) => (
                  <button
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-400 hover:bg-terminal-800 hover:text-cyan-400"
                    key={label}
                    onClick={() => {
                      toast.info(`${label} is mocked for now`)
                      setIsMenuOpen(false)
                    }}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {isTriggerOpen ? (
        <TriggerWorkflowModal
          onClose={() => setIsTriggerOpen(false)}
          provider={provider}
          workflow={workflow}
        />
      ) : null}
    </article>
  )
}

export function WorkflowCardSkeleton() {
  return (
    <div className="rounded-xl border border-terminal-700 bg-terminal-900 p-5">
      <div className="flex justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-20 w-full" />
      <Skeleton className="mt-4 h-4 w-40" />
    </div>
  )
}

