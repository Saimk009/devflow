import { useCallback, useMemo } from "react"

import * as dataLayer from "@/lib/dataLayer"

import { useProviders } from "./useProviders"

const missingProviderError = () =>
  new Error("A connected provider is required for this action.")

export function useDataLayer() {
  const { activeProvider: provider } = useProviders()
  const requireProvider = useCallback(() => {
    if (!provider) {
      throw missingProviderError()
    }

    return provider
  }, [provider])

  return useMemo(
    () => ({
      provider,
      isMockMode: provider === null,
      fetchPipelines: (
        filters?: Parameters<typeof dataLayer.fetchPipelines>[1],
      ) => dataLayer.fetchPipelines(provider, filters),
      fetchWorkflows: (repoName?: string) =>
        dataLayer.fetchWorkflows(provider, repoName),
      fetchRunners: (repoName?: string) =>
        dataLayer.fetchRunners(provider, repoName),
      fetchPipelineDetail: (pipelineId: string) =>
        dataLayer.fetchPipelineDetail(provider, pipelineId),
      triggerWorkflow: (
        workflowId: string,
        params: { branch: string; inputs?: Record<string, string> },
      ) => dataLayer.triggerWorkflow(requireProvider(), workflowId, params),
      rerunPipeline: (pipelineId: string) =>
        dataLayer.rerunPipeline(requireProvider(), pipelineId),
      cancelPipeline: (pipelineId: string) =>
        dataLayer.cancelPipeline(requireProvider(), pipelineId),
    }),
    [provider, requireProvider],
  )
}
