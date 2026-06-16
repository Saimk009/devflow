import type { Edge, Node } from "@xyflow/react"

import type { Job, Pipeline, PipelineStatus } from "@/types"

import type { JobNodeData } from "./JobNode"
import type { StatusEdgeData } from "./StatusEdge"
import type { TriggerNodeData } from "./TriggerNode"

const columnWidth = 240
const rowGap = 120
const triggerNodeId = "trigger"

type FlowNode = Node<JobNodeData | TriggerNodeData>
type FlowEdge = Edge<StatusEdgeData>

const getDependencyDepth = (
  job: Job,
  jobsById: Map<string, Job>,
  depthCache: Map<string, number>,
): number => {
  const cachedDepth = depthCache.get(job.id)

  if (cachedDepth !== undefined) {
    return cachedDepth
  }

  if (job.dependsOn.length === 0) {
    depthCache.set(job.id, 1)
    return 1
  }

  const dependencyDepths = job.dependsOn.map((dependencyId) => {
    const dependency = jobsById.get(dependencyId)
    return dependency ? getDependencyDepth(dependency, jobsById, depthCache) : 0
  })
  const depth = Math.max(...dependencyDepths) + 1

  depthCache.set(job.id, depth)
  return depth
}

const getEdgeStatus = (sourceJob: Job | undefined, targetJob: Job): PipelineStatus => {
  if (targetJob.status === "queued" || targetJob.status === "skipped") {
    return targetJob.status
  }

  return sourceJob?.status ?? targetJob.status
}

export function pipelineToFlow(pipeline: Pipeline): {
  nodes: FlowNode[]
  edges: FlowEdge[]
} {
  const jobsById = new Map(pipeline.jobs.map((job) => [job.id, job]))
  const depthCache = new Map<string, number>()
  const jobsByColumn = new Map<number, Job[]>()

  for (const job of pipeline.jobs) {
    const column = getDependencyDepth(job, jobsById, depthCache)
    const columnJobs = jobsByColumn.get(column) ?? []
    columnJobs.push(job)
    jobsByColumn.set(column, columnJobs)
  }

  const triggerNode: FlowNode = {
    id: triggerNodeId,
    type: "triggerNode",
    position: { x: 0, y: 0 },
    data: {
      pipeline,
      triggerType: pipeline.branch === "main" ? "commit" : "pull-request",
    },
  }

  const jobNodes: FlowNode[] = Array.from(jobsByColumn.entries()).flatMap(
    ([column, jobs]) =>
      jobs.map((job, rowIndex) => ({
        id: job.id,
        type: "jobNode",
        position: {
          x: column * columnWidth,
          y: rowIndex * rowGap - ((jobs.length - 1) * rowGap) / 2,
        },
        data: {
          job,
          isSelected: false,
          onClick: () => undefined,
        },
      })),
  )

  const triggerEdges: FlowEdge[] = pipeline.jobs
    .filter((job) => job.dependsOn.length === 0)
    .map((job) => ({
      id: `${triggerNodeId}-${job.id}`,
      source: triggerNodeId,
      target: job.id,
      type: "statusEdge",
      data: {
        status: job.status,
      },
    }))

  const dependencyEdges: FlowEdge[] = pipeline.jobs.flatMap((job) =>
    job.dependsOn.map((dependencyId) => ({
      id: `${dependencyId}-${job.id}`,
      source: dependencyId,
      target: job.id,
      type: "statusEdge",
      data: {
        status: getEdgeStatus(jobsById.get(dependencyId), job),
      },
    })),
  )

  return {
    nodes: [triggerNode, ...jobNodes],
    edges: [...triggerEdges, ...dependencyEdges],
  }
}
