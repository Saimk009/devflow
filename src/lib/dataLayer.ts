import { DEMO_PIPELINES, getPipelineById, mockRunners, mockWorkflows } from "@/mock"
import type {
  GitHubProvider,
  GitLabProvider,
  Pipeline,
  Runner,
  Workflow,
} from "@/types"

import * as githubApi from "./githubApi"
import * as gitlabApi from "./gitlabApi"

type ConnectedProvider = GitHubProvider | GitLabProvider

type PipelineFilters = {
  status?: string
  branch?: string
  repoName?: string
}

const waitForMockNetwork = () =>
  new Promise((resolve) => {
    window.setTimeout(resolve, 400 + Math.random() * 300)
  })

const applyPipelineFilters = (
  pipelines: Pipeline[],
  filters?: PipelineFilters,
): Pipeline[] =>
  pipelines.filter((pipeline) => {
    const matchesStatus =
      !filters?.status ||
      filters.status === "all" ||
      pipeline.status === filters.status
    const matchesBranch =
      !filters?.branch ||
      filters.branch === "all" ||
      pipeline.branch === filters.branch
    const matchesRepoName =
      !filters?.repoName || pipeline.repoName === filters.repoName

    return matchesStatus && matchesBranch && matchesRepoName
  })

export async function fetchPipelines(
  provider: ConnectedProvider | null,
  filters?: PipelineFilters,
): Promise<Pipeline[]> {
  if (provider === null) {
    await waitForMockNetwork()
    return applyPipelineFilters(DEMO_PIPELINES, filters)
  }

  if (provider.type === "github") {
    return githubApi.fetchPipelines(provider, filters)
  }

  return gitlabApi.fetchPipelines(provider, filters)
}

export async function fetchWorkflows(
  provider: ConnectedProvider | null,
  repoName?: string,
): Promise<Workflow[]> {
  if (provider === null) {
    await waitForMockNetwork()
    return repoName
      ? mockWorkflows.filter((workflow) => workflow.repoName === repoName)
      : mockWorkflows
  }

  if (provider.type === "github") {
    return githubApi.fetchWorkflows(provider, repoName)
  }

  return gitlabApi.fetchWorkflows(provider, repoName)
}

export async function fetchRunners(
  provider: ConnectedProvider | null,
  repoName?: string,
): Promise<Runner[]> {
  if (provider === null) {
    await waitForMockNetwork()
    return repoName
      ? mockRunners.filter((runner) => runner.repoName === repoName || !runner.repoName)
      : mockRunners
  }

  if (provider.type === "github") {
    return githubApi.fetchRunners(provider, repoName)
  }

  return gitlabApi.fetchRunners(provider, repoName)
}

export async function fetchPipelineDetail(
  provider: ConnectedProvider | null,
  pipelineId: string,
): Promise<Pipeline | null> {
  if (provider === null) {
    await waitForMockNetwork()
    return getPipelineById(pipelineId) ?? null
  }

  if (provider.type === "github") {
    return githubApi.fetchPipelineDetail(provider, pipelineId)
  }

  return gitlabApi.fetchPipelineDetail(provider, pipelineId)
}

export async function triggerWorkflow(
  provider: ConnectedProvider,
  workflowId: string,
  params: { branch: string; inputs?: Record<string, string> },
): Promise<{ runId: string }> {
  if (provider.type === "github") {
    return githubApi.triggerWorkflow(provider, workflowId, params)
  }

  return gitlabApi.triggerWorkflow(provider, workflowId, params)
}

export async function rerunPipeline(
  provider: ConnectedProvider,
  pipelineId: string,
): Promise<void> {
  if (provider.type === "github") {
    return githubApi.rerunPipeline(provider, pipelineId)
  }

  return gitlabApi.rerunPipeline(provider, pipelineId)
}

export async function cancelPipeline(
  provider: ConnectedProvider,
  pipelineId: string,
): Promise<void> {
  if (provider.type === "github") {
    return githubApi.cancelPipeline(provider, pipelineId)
  }

  return gitlabApi.cancelPipeline(provider, pipelineId)
}
