import {
  Background,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type EdgeTypes,
  type Node,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useReducedMotion } from "framer-motion"
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Job, Pipeline, PipelineStatus } from "@/types"
import type { KeyboardEvent } from "react"

import {
  JobNode,
  pipelineToFlow,
  StatusEdge,
  TriggerNode,
} from "./dag"
import type { JobNodeData } from "./dag"
import { statusStyles } from "./dag/styles"

type PipelineDAGProps = {
  pipeline: Pipeline
  onJobSelect: (job: Job) => void
  selectedJobId: string | null
}

type SimulatedPipelineState = {
  sourceId: string
  pipeline: Pipeline
}

const nodeTypes = {
  jobNode: JobNode,
  triggerNode: TriggerNode,
} satisfies NodeTypes

const edgeTypes = {
  statusEdge: StatusEdge,
} satisfies EdgeTypes

const statuses: PipelineStatus[] = [
  "success",
  "failed",
  "running",
  "queued",
  "cancelled",
  "skipped",
]

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

const getDurationFromStart = (startedAt?: string) => {
  if (!startedAt) {
    return undefined
  }

  return Math.max(1, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1_000))
}

const advanceRunningPipeline = (pipeline: Pipeline): Pipeline => {
  const runningJob = pipeline.jobs.find((job) => job.status === "running")

  if (!runningJob) {
    return pipeline
  }

  const completedAt = new Date().toISOString()
  const completedJobs = pipeline.jobs.map((job) =>
    job.id === runningJob.id
      ? {
          ...job,
          status: "success" as const,
          completedAt,
          duration: job.duration ?? getDurationFromStart(job.startedAt),
          steps: job.steps.map((step) =>
            step.status === "running"
              ? {
                  ...step,
                  status: "success" as const,
                  completedAt,
                  duration: step.duration ?? getDurationFromStart(step.startedAt),
                }
              : step,
          ),
        }
      : job,
  )
  const completedJobIds = new Set(
    completedJobs
      .filter((job) => job.status === "success")
      .map((job) => job.id),
  )
  const nextJob = completedJobs.find(
    (job) =>
      job.status === "queued" &&
      job.dependsOn.includes(runningJob.id) &&
      job.dependsOn.every((dependencyId) => completedJobIds.has(dependencyId)),
  )
  const nextStartedAt = new Date().toISOString()
  const jobs = completedJobs.map((job) =>
    job.id === nextJob?.id
      ? {
          ...job,
          status: "running" as const,
          startedAt: nextStartedAt,
          steps: job.steps.map((step, index) =>
            index === 0
              ? {
                  ...step,
                  status: "running" as const,
                  startedAt: nextStartedAt,
                }
              : step,
          ),
        }
      : job,
  )
  const hasRunningOrQueuedJobs = jobs.some(
    (job) => job.status === "running" || job.status === "queued",
  )

  return {
    ...pipeline,
    status: hasRunningOrQueuedJobs ? "running" : "success",
    completedAt: hasRunningOrQueuedJobs ? undefined : completedAt,
    duration: hasRunningOrQueuedJobs
      ? pipeline.duration
      : jobs.reduce((total, job) => total + (job.duration ?? 0), 0),
    jobs,
  }
}

function FlowControls() {
  const { fitView, zoomIn, zoomOut } = useReactFlow()

  return (
    <Panel className="flex gap-2" position="top-right">
      <Button
        aria-label="Zoom in"
        className="h-8 w-8 bg-terminal-950 p-0"
        onClick={() => void zoomIn()}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        aria-label="Zoom out"
        className="h-8 w-8 bg-terminal-950 p-0"
        onClick={() => void zoomOut()}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        aria-label="Fit view"
        className="h-8 w-8 bg-terminal-950 p-0"
        onClick={() => void fitView({ padding: 0.25 })}
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </Panel>
  )
}

function PipelineFlowCanvas({
  onJobSelect,
  pipeline,
  selectedJobId,
}: PipelineDAGProps) {
  const shouldReduceMotion = useReducedMotion()
  const jobIds = useMemo(() => pipeline.jobs.map((job) => job.id), [pipeline.jobs])
  const [focusedJobId, setFocusedJobId] = useState<string | null>(
    selectedJobId ?? jobIds[0] ?? null,
  )
  const flow = useMemo(() => pipelineToFlow(pipeline), [pipeline])
  const { nodes, edges } = useMemo(() => {
    return {
      edges: flow.edges,
      nodes: flow.nodes.map((node) => {
        if (node.type !== "jobNode") {
          return node
        }

        const data = node.data as JobNodeData

        return {
          ...node,
          data: {
            ...data,
            isFocused: data.job.id === focusedJobId,
            isSelected: data.job.id === selectedJobId,
            onClick: onJobSelect,
          },
        }
      }),
    }
  }, [flow, focusedJobId, onJobSelect, selectedJobId])

  const moveFocusedJob = (direction: 1 | -1) => {
    if (jobIds.length === 0) {
      return
    }

    const currentIndex = focusedJobId ? jobIds.indexOf(focusedJobId) : -1
    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex + direction + jobIds.length) % jobIds.length

    setFocusedJobId(jobIds[nextIndex])
  }

  const openFocusedJob = () => {
    const focusedJob = pipeline.jobs.find((job) => job.id === focusedJobId)

    if (focusedJob) {
      onJobSelect(focusedJob)
    }
  }

  const handleCanvasKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key === "ArrowRight" ||
      event.key === "ArrowDown" ||
      event.key === "ArrowLeft" ||
      event.key === "ArrowUp"
    ) {
      event.preventDefault()
      moveFocusedJob(
        event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1,
      )
      return
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      openFocusedJob()
    }
  }

  const getNodeColor = (node: Node) => {
    if (node.type === "triggerNode") {
      return "#22d3ee"
    }

    const job = (node.data as Partial<JobNodeData>).job
    return job ? statusStyles[job.status].stroke : "#6b7280"
  }

  return (
    <ReactFlow
      aria-label={`Pipeline DAG for ${pipeline.name}`}
      edgeTypes={edgeTypes}
      edges={edges}
      fitView
      maxZoom={1.5}
      minZoom={0.4}
      nodeTypes={nodeTypes}
      nodes={nodes}
      nodesDraggable={false}
      onFocus={() => setFocusedJobId((current) => current ?? jobIds[0] ?? null)}
      onKeyDown={handleCanvasKeyDown}
      onlyRenderVisibleElements
      proOptions={{ hideAttribution: true }}
      tabIndex={0}
    >
      <Background color="#21262d" gap={20} />
      <FlowControls />
      <MiniMap
        className="!bg-terminal-800"
        maskColor="rgba(10, 14, 20, 0.65)"
        nodeBorderRadius={8}
        nodeColor={getNodeColor}
        pannable
        position="bottom-right"
        zoomable={!shouldReduceMotion}
      />
    </ReactFlow>
  )
}

export function PipelineDAG({
  pipeline,
  onJobSelect,
  selectedJobId,
}: PipelineDAGProps) {
  const [simulatedPipelineState, setSimulatedPipelineState] =
    useState<SimulatedPipelineState>({
      sourceId: pipeline.id,
      pipeline,
    })
  const flowPipeline =
    simulatedPipelineState.sourceId === pipeline.id
      ? simulatedPipelineState.pipeline
      : pipeline
  const shouldReduceMotion = useReducedMotion()
  const styles = statusStyles[flowPipeline.status]
  const jobCounts = statuses.map((status) => ({
    status,
    count: flowPipeline.jobs.filter((job) => job.status === status).length,
  }))

  useEffect(() => {
    if (flowPipeline.status !== "running") {
      return
    }

    const intervalId = window.setInterval(() => {
      setSimulatedPipelineState((currentState) => {
        const currentPipeline =
          currentState.sourceId === pipeline.id ? currentState.pipeline : pipeline

        return {
          sourceId: pipeline.id,
          pipeline:
            currentPipeline.status === "running"
              ? advanceRunningPipeline(currentPipeline)
              : currentPipeline,
        }
      })
    }, 3_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [flowPipeline.status, pipeline])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-terminal-700 bg-terminal-900 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border bg-terminal-950 px-2.5 py-1 text-xs font-medium capitalize",
              styles.text,
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                styles.dot,
                flowPipeline.status === "running" &&
                  !shouldReduceMotion &&
                  "animate-pulse",
              )}
            />
            {flowPipeline.status}
          </span>
          <span className="text-sm text-slate-400">
            Duration: {formatDuration(flowPipeline.duration)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {jobCounts.map(({ status, count }) => (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-terminal-700 bg-terminal-950 px-2 py-1 text-xs text-slate-400"
              key={status}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  statusStyles[status].dot,
                )}
              />
              {status}: {count}
            </span>
          ))}
        </div>
      </div>

      <div className="h-[480px] w-full overflow-hidden rounded-xl border border-terminal-700 bg-terminal-900">
        <ReactFlowProvider>
          <PipelineFlowCanvas
            onJobSelect={onJobSelect}
            pipeline={flowPipeline}
            selectedJobId={selectedJobId}
          />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
