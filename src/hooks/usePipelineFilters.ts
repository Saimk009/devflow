import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { useMemo } from "react"

import type { Pipeline, PipelineStatus } from "@/types"

export const pipelineStatusFilterValues = [
  "all",
  "queued",
  "running",
  "success",
  "failed",
  "cancelled",
  "skipped",
] as const

export type PipelineStatusFilter = (typeof pipelineStatusFilterValues)[number]

export function usePipelineFilters(pipelines: Pipeline[] = []) {
  const [status] = useQueryState(
    "status",
    parseAsStringLiteral(pipelineStatusFilterValues).withDefault("all"),
  )
  const [branch] = useQueryState("branch", parseAsString.withDefault("all"))
  const [search] = useQueryState("search", parseAsString.withDefault(""))

  const normalizedSearch = search.trim().toLowerCase()
  const activeFilterCount = [status !== "all", branch !== "all", normalizedSearch !== ""].filter(
    Boolean,
  ).length

  const filteredPipelines = useMemo(
    () =>
      pipelines.filter((pipeline) => {
        const matchesStatus =
          status === "all" || pipeline.status === (status as PipelineStatus)
        const matchesBranch = branch === "all" || pipeline.branch === branch
        const matchesSearch =
          normalizedSearch === "" ||
          pipeline.commitMessage.toLowerCase().includes(normalizedSearch) ||
          pipeline.author.toLowerCase().includes(normalizedSearch)

        return matchesStatus && matchesBranch && matchesSearch
      }),
    [branch, normalizedSearch, pipelines, status],
  )

  return {
    status,
    branch,
    search,
    activeFilterCount,
    filteredPipelines,
  }
}
