import type { Pipeline } from "@/types"

import { mockPipelines } from "./generators"

const demoPipelineIds = [
  "pipe-1001", // Successful full deployment pipeline.
  "pipe-1004", // Failed pipeline with test stage failure.
  "pipe-1006", // Running pipeline mid-deploy.
  "pipe-1008", // Queued pipeline waiting for a runner.
  "pipe-1012", // Complex DAG with six jobs and parallel tracks.
  "pipe-1010", // Cancelled pipeline.
]

export const DEMO_PIPELINES: Pipeline[] = demoPipelineIds
  .map((id) => mockPipelines.find((pipeline) => pipeline.id === id))
  .filter((pipeline): pipeline is Pipeline => Boolean(pipeline))
