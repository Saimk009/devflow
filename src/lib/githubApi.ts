import type {
  GitHubProvider,
  Job,
  Pipeline,
  PipelineStatus,
  Runner,
  Workflow,
  WorkflowTrigger,
} from "@/types"

type PipelineFilters = {
  status?: string
  branch?: string
  repoName?: string
}

type GitHubUserResponse = {
  avatar_url: string
  email: string | null
  login: string
  name: string | null
}

type GitHubRepoResponse = {
  default_branch: string
  full_name: string
  name: string
  owner: {
    avatar_url: string
    login: string
  }
  private: boolean
  pushed_at?: string
}

type GitHubWorkflowResponse = {
  id: number
  name: string
  path: string
  state: "active" | "disabled_manually" | "disabled_inactivity" | "deleted"
  updated_at?: string
}

type GitHubWorkflowRunResponse = {
  id: number
  name: string | null
  status: string | null
  conclusion: string | null
  head_branch: string | null
  head_sha: string
  event: string
  run_started_at?: string | null
  created_at: string
  updated_at: string
  html_url: string
  run_duration_ms?: number
  display_title?: string
  head_commit?: {
    message?: string
    author?: {
      name?: string
    }
  } | null
  actor?: {
    avatar_url?: string
    login?: string
  } | null
  repository?: {
    full_name?: string
  }
  path?: string
  workflow_id?: number
}

type GitHubJobResponse = {
  id: number
  name: string
  status: string | null
  conclusion: string | null
  runner_name: string | null
  started_at: string | null
  completed_at: string | null
  steps?: Array<{
    completed_at: string | null
    conclusion: string | null
    name: string
    number: number
    started_at: string | null
    status: string | null
  }>
}

type GitHubRunnerResponse = {
  id: number
  name: string
  os: string
  status: "online" | "offline"
  busy: boolean
  labels: Array<{ name: string }>
}

type GitHubErrorResponse = {
  documentation_url?: string
  message?: string
}

const DEFAULT_GITHUB_API_BASE = "https://api.github.com"

export class GitHubApiError extends Error {
  status: number
  documentation_url?: string

  constructor(status: number, message: string, documentationUrl?: string) {
    super(message)
    this.name = "GitHubApiError"
    this.status = status
    this.documentation_url = documentationUrl
  }
}

const trimBaseUrl = (baseUrl = DEFAULT_GITHUB_API_BASE) => baseUrl.replace(/\/+$/u, "")

const buildQuery = (params?: Record<string, number | string | undefined>) => {
  const query = new URLSearchParams()

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value))
    }
  })

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ""
}

const splitRepoName = (repoName: string) => {
  const [owner, repo] = repoName.split("/")

  if (!owner || !repo) {
    throw new GitHubApiError(400, "Repository name must be in owner/repo format.")
  }

  return { owner, repo }
}

const buildPipelineId = (owner: string, repo: string, runId: number | string) =>
  `github~${owner}~${repo}~${runId}`

const parsePipelineId = (pipelineId: string) => {
  const [prefix, owner, repo, runId] = pipelineId.split("~")

  if (prefix !== "github" || !owner || !repo || !runId) {
    return null
  }

  return { owner, repo, runId: Number(runId) }
}

const durationInSeconds = (start?: string | null, end?: string | null) => {
  if (!start || !end) {
    return undefined
  }

  return Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 1_000))
}

const normalizeGithubStatus = (
  status?: string | null,
  conclusion?: string | null,
): PipelineStatus => {
  if (status !== "completed") {
    if (status === "in_progress") return "running"
    if (status === "queued" || status === "requested" || status === "waiting" || status === "pending") {
      return "queued"
    }
  }

  if (conclusion === "success") return "success"
  if (conclusion === "cancelled") return "cancelled"
  if (conclusion === "skipped" || conclusion === "neutral") return "skipped"
  if (
    conclusion === "failure" ||
    conclusion === "timed_out" ||
    conclusion === "action_required"
  ) {
    return "failed"
  }

  return status === "completed" ? "success" : "queued"
}

const getRetryAfterMinutes = (headers: Headers) => {
  const retryAfter = headers.get("retry-after")

  if (!retryAfter) {
    return 1
  }

  const seconds = Number(retryAfter)

  if (Number.isFinite(seconds)) {
    return Math.max(1, Math.ceil(seconds / 60))
  }

  const retryDate = Date.parse(retryAfter)

  if (Number.isNaN(retryDate)) {
    return 1
  }

  return Math.max(1, Math.ceil((retryDate - Date.now()) / 60_000))
}

async function readGitHubError(response: Response): Promise<GitHubErrorResponse> {
  try {
    return (await response.json()) as GitHubErrorResponse
  } catch {
    return {}
  }
}

async function githubRequest<T>(
  token: string,
  path: string,
  options?: {
    baseUrl?: string
    body?: unknown
    method?: string
    responseType?: "json" | "text" | "empty"
  },
): Promise<T> {
  const response = await fetch(`${trimBaseUrl(options?.baseUrl)}${path}`, {
    body: options?.body ? JSON.stringify(options.body) : undefined,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    method: options?.method ?? "GET",
  })

  if (!response.ok) {
    const error = await readGitHubError(response)
    const message =
      response.status === 401
        ? "Token expired or revoked. Please reconnect in Settings."
        : response.status === 403
          ? "Insufficient token scopes. Required: repo, workflow."
          : response.status === 404
            ? "Repository not found or access denied."
            : response.status === 429
              ? `GitHub API rate limit reached. Try again in ${getRetryAfterMinutes(response.headers)} minutes.`
              : error.message || `GitHub API request failed with ${response.status}.`

    throw new GitHubApiError(response.status, message, error.documentation_url)
  }

  if (options?.responseType === "empty" || response.status === 204) {
    return undefined as T
  }

  if (options?.responseType === "text") {
    return (await response.text()) as T
  }

  return (await response.json()) as T
}

const workflowState = (state: GitHubWorkflowResponse["state"]): Workflow["state"] => {
  if (state === "deleted") return "deleted"
  if (state === "active") return "active"
  return "disabled"
}

const inferWorkflowTriggers = (run?: GitHubWorkflowRunResponse): WorkflowTrigger[] => {
  if (!run?.event) {
    return [{ type: "workflow_dispatch" }]
  }

  if (run.event === "pull_request") return [{ type: "pull_request" }]
  if (run.event === "schedule") return [{ type: "schedule" }]
  if (run.event === "workflow_dispatch") return [{ type: "workflow_dispatch" }]
  if (run.event === "push") return [{ type: "push", branches: [run.head_branch ?? "main"] }]

  return [{ type: "workflow_dispatch" }]
}

/**
 * GitHub user -> DevFlow auth payload
 * - login/name/email/avatar_url become the connected account identity shown in Settings.
 * - x-oauth-scopes response header becomes the confirmed scope list stored on provider.
 */
export async function validateGitHubToken(
  token: string,
  baseUrl = DEFAULT_GITHUB_API_BASE,
): Promise<{
  user: { login: string; name: string; avatarUrl: string; email: string }
  scopes: string[]
}> {
  const response = await fetch(`${trimBaseUrl(baseUrl)}/user`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  })

  if (!response.ok) {
    const error = await readGitHubError(response)
    throw new GitHubApiError(
      response.status,
      response.status === 401
        ? "Token expired or revoked. Please reconnect in Settings."
        : response.status === 403
          ? "Insufficient token scopes. Required: repo, workflow."
          : error.message || "Invalid token or insufficient scopes. Check your token and try again.",
      error.documentation_url,
    )
  }

  const user = (await response.json()) as GitHubUserResponse
  const scopes =
    response.headers
      .get("x-oauth-scopes")
      ?.split(",")
      .map((scope) => scope.trim())
      .filter(Boolean) ?? []

  return {
    user: {
      login: user.login,
      name: user.name ?? user.login,
      avatarUrl: user.avatar_url,
      email: user.email ?? "",
    },
    scopes,
  }
}

/**
 * GitHub repository -> DevFlow pinned/search repo shape
 * - full_name is used as the stable owner/repo display name.
 * - private/default_branch map directly to pin metadata.
 * - owner.avatar_url represents the org/user avatar beside the repository.
 */
export async function listUserRepos(
  token: string,
  params?: { sort?: "updated" | "pushed"; per_page?: number; page?: number },
  baseUrl = DEFAULT_GITHUB_API_BASE,
): Promise<
  {
    name: string
    fullName: string
    private: boolean
    defaultBranch: string
    avatarUrl: string
  }[]
> {
  const repos = await githubRequest<GitHubRepoResponse[]>(
    token,
    `/user/repos${buildQuery({
      sort: params?.sort ?? "updated",
      per_page: params?.per_page ?? 100,
      page: params?.page ?? 1,
    })}`,
    { baseUrl },
  )

  return repos.map((repo) => ({
    name: repo.name,
    fullName: repo.full_name,
    private: repo.private,
    defaultBranch: repo.default_branch,
    avatarUrl: repo.owner.avatar_url,
  }))
}

/**
 * GitHub workflow + recent run summary -> DevFlow Workflow
 * - id/name/path/state map directly from the workflow endpoint.
 * - fileName is derived from path for filtering and display.
 * - lastRunAt/lastRunStatus come from the newest workflow run because the workflow
 *   list endpoint does not expose run status directly.
 * - totalRuns/successRate/avgDuration are estimated from the sampled recent runs.
 * - triggers are inferred from recent run events; GitHub requires reading YAML for
 *   complete trigger metadata, so workflow_dispatch is used as a safe fallback.
 */
function mapWorkflow(
  workflow: GitHubWorkflowResponse,
  owner: string,
  repo: string,
  recentRuns: GitHubWorkflowRunResponse[] = [],
): Workflow {
  const completedRuns = recentRuns.filter((run) => run.status === "completed")
  const successfulRuns = completedRuns.filter((run) => run.conclusion === "success")
  const durations = completedRuns
    .map((run) => durationInSeconds(run.run_started_at ?? run.created_at, run.updated_at))
    .filter((duration): duration is number => duration !== undefined)
  const triggerMap = new Map<string, WorkflowTrigger>()

  recentRuns.forEach((run) => {
    inferWorkflowTriggers(run).forEach((trigger) => {
      triggerMap.set(`${trigger.type}-${trigger.branches?.join(",") ?? ""}-${trigger.schedule ?? ""}`, trigger)
    })
  })

  return {
    id: `${owner}/${repo}:${workflow.id}`,
    name: workflow.name,
    fileName: workflow.path.split("/").at(-1) ?? workflow.path,
    path: workflow.path,
    state: workflowState(workflow.state),
    lastRunAt: recentRuns[0]?.created_at ?? workflow.updated_at,
    lastRunStatus: recentRuns[0]
      ? normalizeGithubStatus(recentRuns[0].status, recentRuns[0].conclusion)
      : undefined,
    totalRuns: recentRuns.length,
    successRate:
      completedRuns.length > 0
        ? Math.round((successfulRuns.length / completedRuns.length) * 100)
        : 0,
    avgDuration:
      durations.length > 0
        ? Math.round(durations.reduce((total, duration) => total + duration, 0) / durations.length)
        : 0,
    triggers: triggerMap.size > 0 ? [...triggerMap.values()] : [{ type: "workflow_dispatch" }],
    providerId: "github",
    providerType: "github",
    repoName: `${owner}/${repo}`,
  }
}

export async function listWorkflows(
  token: string,
  owner: string,
  repo: string,
  baseUrl = DEFAULT_GITHUB_API_BASE,
): Promise<Workflow[]> {
  const response = await githubRequest<{ workflows: GitHubWorkflowResponse[] }>(
    token,
    `/repos/${owner}/${repo}/actions/workflows`,
    { baseUrl },
  )

  const workflows = await Promise.all(
    response.workflows.map(async (workflow) => {
      const runs = await githubRequest<{ workflow_runs: GitHubWorkflowRunResponse[] }>(
        token,
        `/repos/${owner}/${repo}/actions/workflows/${workflow.id}/runs?per_page=20`,
        { baseUrl },
      )

      return mapWorkflow(workflow, owner, repo, runs.workflow_runs)
    }),
  )

  return workflows
}

export async function getWorkflow(
  token: string,
  owner: string,
  repo: string,
  workflowId: string,
  baseUrl = DEFAULT_GITHUB_API_BASE,
): Promise<Workflow> {
  const workflow = await githubRequest<GitHubWorkflowResponse>(
    token,
    `/repos/${owner}/${repo}/actions/workflows/${workflowId}`,
    { baseUrl },
  )
  const runs = await githubRequest<{ workflow_runs: GitHubWorkflowRunResponse[] }>(
    token,
    `/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs?per_page=20`,
    { baseUrl },
  )

  return mapWorkflow(workflow, owner, repo, runs.workflow_runs)
}

export async function triggerWorkflowDispatch(
  token: string,
  owner: string,
  repo: string,
  workflowId: string,
  ref: string,
  inputs?: Record<string, string>,
  baseUrl = DEFAULT_GITHUB_API_BASE,
): Promise<void> {
  await githubRequest<void>(
    token,
    `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
    {
      baseUrl,
      body: { ref, inputs },
      method: "POST",
      responseType: "empty",
    },
  )
}

export async function disableWorkflow(
  token: string,
  owner: string,
  repo: string,
  workflowId: string,
  baseUrl = DEFAULT_GITHUB_API_BASE,
): Promise<void> {
  await githubRequest<void>(
    token,
    `/repos/${owner}/${repo}/actions/workflows/${workflowId}/disable`,
    { baseUrl, method: "PUT", responseType: "empty" },
  )
}

export async function enableWorkflow(
  token: string,
  owner: string,
  repo: string,
  workflowId: string,
  baseUrl = DEFAULT_GITHUB_API_BASE,
): Promise<void> {
  await githubRequest<void>(
    token,
    `/repos/${owner}/${repo}/actions/workflows/${workflowId}/enable`,
    { baseUrl, method: "PUT", responseType: "empty" },
  )
}

/**
 * GitHub job step -> DevFlow Step
 * - number becomes a stable step id under the parent job.
 * - name/status/timing fields map directly.
 * - logs are left empty here because GitHub exposes job logs as a separate text
 *   download endpoint rather than per-step structured log lines.
 */
function mapJobStep(jobId: number, step: NonNullable<GitHubJobResponse["steps"]>[number]) {
  return {
    id: `${jobId}-step-${step.number}`,
    name: step.name,
    status: normalizeGithubStatus(step.status, step.conclusion),
    startedAt: step.started_at ?? undefined,
    completedAt: step.completed_at ?? undefined,
    duration: durationInSeconds(step.started_at, step.completed_at),
    logs: [],
  }
}

/**
 * GitHub job -> DevFlow Job
 * - id/providerJobId use the GitHub job id for later log retrieval.
 * - runner_name becomes runnerName, falling back to a readable placeholder.
 * - status/conclusion normalize into DevFlow's PipelineStatus union.
 * - steps are mapped from check-run steps when available.
 * - dependsOn is empty because GitHub's jobs endpoint does not expose needs edges.
 */
function mapJob(job: GitHubJobResponse): Job {
  return {
    id: String(job.id),
    name: job.name,
    status: normalizeGithubStatus(job.status, job.conclusion),
    providerJobId: String(job.id),
    runnerName: job.runner_name ?? "GitHub runner",
    startedAt: job.started_at ?? undefined,
    completedAt: job.completed_at ?? undefined,
    duration: durationInSeconds(job.started_at, job.completed_at),
    steps: job.steps?.map((step) => mapJobStep(job.id, step)) ?? [],
    dependsOn: [],
  }
}

/**
 * GitHub workflow run -> DevFlow Pipeline
 * - GitHub run id is stored in providerRunId and embedded in id with owner/repo
 *   so detail, rerun, and cancel calls can recover route context.
 * - status/conclusion normalize into DevFlow's PipelineStatus union.
 * - head branch/SHA/commit/actor fields become the list card metadata.
 * - workflow path is filled from the run when present, otherwise a GitHub fallback.
 * - jobs are provided by callers that fetched /jobs; list views can pass [].
 */
function mapWorkflowRun(
  run: GitHubWorkflowRunResponse,
  owner: string,
  repo: string,
  jobs: Job[] = [],
): Pipeline {
  const startedAt = run.run_started_at ?? run.created_at

  return {
    id: buildPipelineId(owner, repo, run.id),
    name: run.name ?? run.display_title ?? `Run #${run.id}`,
    status: normalizeGithubStatus(run.status, run.conclusion),
    branch: run.head_branch ?? "unknown",
    commitSha: run.head_sha,
    commitMessage: run.head_commit?.message ?? run.display_title ?? "No commit message",
    author: run.head_commit?.author?.name ?? run.actor?.login ?? "github-actions",
    avatarUrl: run.actor?.avatar_url ?? `https://i.pravatar.cc/40?u=${run.id}`,
    triggeredAt: startedAt,
    completedAt: run.status === "completed" ? run.updated_at : undefined,
    duration:
      run.run_duration_ms !== undefined
        ? Math.round(run.run_duration_ms / 1_000)
        : durationInSeconds(startedAt, run.status === "completed" ? run.updated_at : undefined),
    jobs,
    workflowFile: run.path ?? ".github/workflows/workflow.yml",
    repoName: run.repository?.full_name ?? `${owner}/${repo}`,
    providerId: "github",
    providerType: "github",
    providerRunId: String(run.id),
  }
}

export async function listWorkflowRuns(
  token: string,
  owner: string,
  repo: string,
  params?: {
    workflow_id?: string
    branch?: string
    status?: string
    per_page?: number
    page?: number
  },
  baseUrl = DEFAULT_GITHUB_API_BASE,
): Promise<Pipeline[]> {
  const workflowPath = params?.workflow_id
    ? `/repos/${owner}/${repo}/actions/workflows/${params.workflow_id}/runs`
    : `/repos/${owner}/${repo}/actions/runs`
  const response = await githubRequest<{ workflow_runs: GitHubWorkflowRunResponse[] }>(
    token,
    `${workflowPath}${buildQuery({
      branch: params?.branch,
      status: params?.status,
      per_page: params?.per_page ?? 30,
      page: params?.page ?? 1,
    })}`,
    { baseUrl },
  )

  return response.workflow_runs.map((run) => mapWorkflowRun(run, owner, repo))
}

export async function getWorkflowRun(
  token: string,
  owner: string,
  repo: string,
  runId: number,
  baseUrl = DEFAULT_GITHUB_API_BASE,
): Promise<Pipeline> {
  const [run, jobs] = await Promise.all([
    githubRequest<GitHubWorkflowRunResponse>(
      token,
      `/repos/${owner}/${repo}/actions/runs/${runId}`,
      { baseUrl },
    ),
    listRunJobs(token, owner, repo, runId, baseUrl),
  ])

  return mapWorkflowRun(run, owner, repo, jobs)
}

export async function rerunWorkflow(
  token: string,
  owner: string,
  repo: string,
  runId: number,
  baseUrl = DEFAULT_GITHUB_API_BASE,
): Promise<void> {
  await githubRequest<void>(
    token,
    `/repos/${owner}/${repo}/actions/runs/${runId}/rerun`,
    { baseUrl, method: "POST", responseType: "empty" },
  )
}

export async function cancelWorkflowRun(
  token: string,
  owner: string,
  repo: string,
  runId: number,
  baseUrl = DEFAULT_GITHUB_API_BASE,
): Promise<void> {
  await githubRequest<void>(
    token,
    `/repos/${owner}/${repo}/actions/runs/${runId}/cancel`,
    { baseUrl, method: "POST", responseType: "empty" },
  )
}

export async function listRunJobs(
  token: string,
  owner: string,
  repo: string,
  runId: number,
  baseUrl = DEFAULT_GITHUB_API_BASE,
): Promise<Job[]> {
  const response = await githubRequest<{ jobs: GitHubJobResponse[] }>(
    token,
    `/repos/${owner}/${repo}/actions/runs/${runId}/jobs?per_page=100`,
    { baseUrl },
  )

  return response.jobs.map(mapJob)
}

export async function getJobLogs(
  token: string,
  owner: string,
  repo: string,
  jobId: number,
  baseUrl = DEFAULT_GITHUB_API_BASE,
): Promise<string> {
  return githubRequest<string>(
    token,
    `/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`,
    { baseUrl, responseType: "text" },
  )
}

/**
 * GitHub runner -> DevFlow Runner
 * - id/name/status/busy/os/labels map from GitHub runner fields.
 * - busy overrides online status to surface active work in DevFlow.
 * - arch is inferred from labels because GitHub returns architecture as a label.
 * - runnerType is self-hosted when the self-hosted label exists; otherwise hosted.
 * - utilization/currentJob/version are not exposed by this endpoint, so stable
 *   conservative defaults are used until a metrics endpoint is added.
 */
function mapRunner(
  runner: GitHubRunnerResponse,
  providerId: string,
  repoName?: string,
): Runner {
  const labels = runner.labels.map((label) => label.name)
  const hasArm64 = labels.some((label) => label.toLowerCase().includes("arm64"))
  const hasSelfHosted = labels.some((label) => label.toLowerCase() === "self-hosted")
  const normalizedOs = runner.os.toLowerCase()

  return {
    id: String(runner.id),
    name: runner.name,
    status: runner.busy ? "busy" : runner.status === "online" ? "online" : "offline",
    os: normalizedOs.includes("windows")
      ? "windows"
      : normalizedOs.includes("mac")
        ? "macos"
        : "linux",
    arch: hasArm64 ? "arm64" : "x64",
    labels,
    runnerType: hasSelfHosted ? "self-hosted" : "github-hosted",
    lastSeenAt: new Date().toISOString(),
    version: "unknown",
    providerId,
    providerType: "github",
    repoName,
    utilization: runner.busy ? 100 : 0,
  }
}

export async function listRepoRunners(
  token: string,
  owner: string,
  repo: string,
  baseUrl = DEFAULT_GITHUB_API_BASE,
): Promise<Runner[]> {
  const response = await githubRequest<{ runners: GitHubRunnerResponse[] }>(
    token,
    `/repos/${owner}/${repo}/actions/runners?per_page=100`,
    { baseUrl },
  )

  return response.runners.map((runner) => mapRunner(runner, "github", `${owner}/${repo}`))
}

export async function listOrgRunners(
  token: string,
  org: string,
  baseUrl = DEFAULT_GITHUB_API_BASE,
): Promise<Runner[]> {
  const response = await githubRequest<{ runners: GitHubRunnerResponse[] }>(
    token,
    `/orgs/${org}/actions/runners?per_page=100`,
    { baseUrl },
  )

  return response.runners.map((runner) => mapRunner(runner, "github"))
}

export async function fetchPipelines(
  provider: GitHubProvider,
  filters?: PipelineFilters,
): Promise<Pipeline[]> {
  if (filters?.repoName) {
    const { owner, repo } = splitRepoName(filters.repoName)
    return listWorkflowRuns(
      provider.token,
      owner,
      repo,
      {
        branch: filters.branch === "all" ? undefined : filters.branch,
        status: filters.status === "all" ? undefined : filters.status,
      },
      provider.baseUrl,
    )
  }

  const repos = await listUserRepos(provider.token, { per_page: 10 }, provider.baseUrl)
  const runsByRepo = await Promise.all(
    repos.map((repo) => {
      const { owner, repo: repoName } = splitRepoName(repo.fullName)
      return listWorkflowRuns(provider.token, owner, repoName, { per_page: 10 }, provider.baseUrl)
    }),
  )

  return runsByRepo
    .flat()
    .filter((pipeline) => {
      const matchesStatus =
        !filters?.status || filters.status === "all" || pipeline.status === filters.status
      const matchesBranch =
        !filters?.branch || filters.branch === "all" || pipeline.branch === filters.branch

      return matchesStatus && matchesBranch
    })
    .sort((a, b) => Date.parse(b.triggeredAt) - Date.parse(a.triggeredAt))
}

export async function fetchWorkflows(
  provider: GitHubProvider,
  repoName?: string,
): Promise<Workflow[]> {
  if (repoName) {
    const { owner, repo } = splitRepoName(repoName)
    return listWorkflows(provider.token, owner, repo, provider.baseUrl)
  }

  const repos = await listUserRepos(provider.token, { per_page: 10 }, provider.baseUrl)
  const workflowsByRepo = await Promise.all(
    repos.map((repo) => {
      const { owner, repo: repoName } = splitRepoName(repo.fullName)
      return listWorkflows(provider.token, owner, repoName, provider.baseUrl)
    }),
  )

  return workflowsByRepo.flat()
}

export async function fetchRunners(
  provider: GitHubProvider,
  repoName?: string,
): Promise<Runner[]> {
  if (repoName) {
    const { owner, repo } = splitRepoName(repoName)
    return listRepoRunners(provider.token, owner, repo, provider.baseUrl)
  }

  const repos = await listUserRepos(provider.token, { per_page: 5 }, provider.baseUrl)
  const runnersByRepo = await Promise.all(
    repos.map((repo) => {
      const { owner, repo: repoName } = splitRepoName(repo.fullName)
      return listRepoRunners(provider.token, owner, repoName, provider.baseUrl)
    }),
  )

  return runnersByRepo.flat()
}

export async function fetchPipelineDetail(
  provider: GitHubProvider,
  pipelineId: string,
): Promise<Pipeline | null> {
  const parsed = parsePipelineId(pipelineId)

  if (!parsed) {
    return null
  }

  return getWorkflowRun(provider.token, parsed.owner, parsed.repo, parsed.runId, provider.baseUrl)
}

export async function triggerWorkflow(
  provider: GitHubProvider,
  workflowId: string,
  params: { branch: string; inputs?: Record<string, string> },
): Promise<{ runId: string }> {
  const [repoName, workflowFile] = workflowId.includes(":")
    ? workflowId.split(":")
    : ["", workflowId]
  const { owner, repo } = splitRepoName(repoName)

  await triggerWorkflowDispatch(
    provider.token,
    owner,
    repo,
    workflowFile,
    params.branch,
    params.inputs,
    provider.baseUrl,
  )

  return { runId: workflowId }
}

export async function rerunPipeline(
  provider: GitHubProvider,
  pipelineId: string,
): Promise<void> {
  const parsed = parsePipelineId(pipelineId)

  if (!parsed) {
    throw new GitHubApiError(400, "Pipeline ID is missing GitHub repository context.")
  }

  await rerunWorkflow(provider.token, parsed.owner, parsed.repo, parsed.runId, provider.baseUrl)
}

export async function cancelPipeline(
  provider: GitHubProvider,
  pipelineId: string,
): Promise<void> {
  const parsed = parsePipelineId(pipelineId)

  if (!parsed) {
    throw new GitHubApiError(400, "Pipeline ID is missing GitHub repository context.")
  }

  await cancelWorkflowRun(provider.token, parsed.owner, parsed.repo, parsed.runId, provider.baseUrl)
}
