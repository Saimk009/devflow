import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { fetchPipelineDetail, fetchPipelines } from "@/lib/dataLayer"
import type { Pipeline } from "@/types"

import { useProviders } from "./useProviders"

const selectPipelines = (pipelines: Pipeline[]) =>
  [...pipelines].sort(
    (a, b) =>
      new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime(),
  )

export const usePipelines = (repoName?: string | null) => {
  const { activeProvider } = useProviders()

  return useQuery({
    placeholderData: keepPreviousData,
    queryKey: ["pipelines", activeProvider?.id ?? "mock", repoName ?? "all"],
    queryFn: () =>
      fetchPipelines(activeProvider, {
        repoName: repoName ?? undefined,
      }),
    select: selectPipelines,
  })
}

export const usePipeline = (id: string) => {
  const { activeProvider } = useProviders()

  return useQuery({
    queryKey: ["pipeline", activeProvider?.id ?? "mock", id],
    queryFn: () => fetchPipelineDetail(activeProvider, id),
    enabled: Boolean(id),
  })
}
