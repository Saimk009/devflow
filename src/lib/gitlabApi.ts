import type {
  GitLabProvider,
  Job,
  Pipeline,
  PipelineStatus,
  Runner,
  Workflow,
} from "@/types"

type PipelineFilters = {
  status?: string
  branch?: string
  repoName?: string
}

type GitLabUserResponse = {
  avatar_url?: string
  email?: string | null
  name: string
  username: string
}

type GitLabVersionResponse = {
  version?: string
}

type GitLabProjectResponse = {
  avatar_url?: string
  default_branch?: string
  id: number
  name: string
  path_with_namespace: string
  visibility: string
}

type GitLabPipelineResponse = {
  id: number
  iid?: number
  status: string
  ref: string
  sha: string
  created_at: string
  updated_at: string
  started_at?: string | null
  finished_at?: string | null
  duration?: number | null
  user?: {
    avatar_url?: string
    name?: string
    username?: string
  } | null
}

type GitLabJobResponse = {
  id: number
  name: string
  stage: string
  status: string
  created_at: string
  started_at?: string | null
  finished_at?: string | null
  duration?: number | null
  runner?: {
    description?: string | null
  } | null
}

type GitLabRunnerResponse = {
  id: number
  description?: string | null
  status: string
  active?: boolean
  is_shared?: boolean
  runner_type?: "instance_type" | "group_type" | "project_type"
  tag_list?: string[]
  contacted_at?: string | null
  version?: string | null
  platform?: string | null
  architecture?: string | null
}

type GitLabErrorResponse = {
  error?: string
  message?: string | Record<string, string[]>
}

export class GitLabApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "GitLabApiError"
    this.status = status
  }
}

const trimBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/u, "")

const encodeProjectId = (projectId: string) => encodeURIComponent(projectId)

const buildPipelineId = (projectId: string, pipelineId: number | string) =>
  `gitlab~${encodeURIComponent(projectId)}~${pipelineId}`

const parsePipelineId = (pipelineId: string) => {
  const [prefix, encodedProjectId, id] = pipelineId.split("~")

  if (prefix !== "gitlab" || !encodedProjectId || !id) {
    return null
  }

  return {
    projectId: decodeURIComponent(encodedProjectId),
    pipelineId: Number(id),
  }
}

const buildQuery = (
  params?: Record<string, boolean | number | string | undefined>,
) => {
  const query = new URLSearchParams()

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value))
    }
  })

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ""
}

const durationInSeconds = (start?: string | null, end?: string | null) => {
  if (!start || !end) {
    return undefined
  }

  return Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 1_000))
}

const normalizeGitLabStatus = (status: string): PipelineStatus => {
  const statusMap: Record<string, PipelineStatus> = {
    canceled: "cancelled",
    created: "queued",
    failed: "failed",
    manual: "queued",
    pending: "queued",
    preparing: "queued",
    running: "running",
    scheduled: "queued",
    skipped: "skipped",
    success: "success",
    waiting_for_resource: "queued",
  }

  return statusMap[status] ?? "queued"
}

const retryAfterMinutes = (headers: Headers) => {
  const retryAfter = headers.get("retry-after")
  const seconds = retryAfter ? Number(retryAfter) : 60
  return Number.isFinite(seconds) ? Math.max(1, Math.ceil(seconds / 60)) : 1
}

const gitLabErrorMessage = (error: GitLabErrorResponse) => {
  if (typeof error.message === "string") {
    return error.message
  }

  if (error.error) {
    return error.error
  }

  if (error.message && typeof error.message === "object") {
    return Object.entries(error.message)
      .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
      .join("; ")
  }

  return "GitLab API request failed."
}

async function readGitLabError(response: Response): Promise<GitLabErrorResponse> {
  try {
    return (await response.json()) as GitLabErrorResponse
  } catch {
    return {}
  }
}

async function gitLabRequest<T>(
  token: string,
  baseUrl: string,
  path: string,
  options?: {
    body?: unknown
    method?: string
    responseType?: "json" | "text" | "empty"
  },
): Promise<T> {
  const response = await fetch(`${trimBaseUrl(baseUrl)}/api/v4${path}`, {
    body: options?.body ? JSON.stringify(options.body) : undefined,
    headers: {
      "Content-Type": "application/json",
      "PRIVATE-TOKEN": token,
    },
    method: options?.method ?? "GET",
  })

  if (!response.ok) {
    const error = await readGitLabError(response)
    const message =
      response.status === 401
        ? "Token expired or revoked. Please reconnect in Settings."
        : response.status === 403
          ? "Insufficient token scopes. Required: read_api, read_user, read_repository."
          : response.status === 404
            ? "Project not found or access denied."
            : response.status === 429
              ? `GitLab API rate limit reached. Try again in ${retryAfterMinutes(response.headers)} minutes.`
              : gitLabErrorMessage(error)

    throw new GitLabApiError(response.status, message)
  }

  if (options?.responseType === "empty" || response.status === 204) {
    return undefined as T
  }

  if (options?.responseType === "text") {
    return (await response.text()) as T
  }

  return (await response.json()) as T
}

const projectIdFromRepoName = (repoName: string) => repoName

const runnerOs = (runner: GitLabRunnerResponse): Runner["os"] => {
  const text = `${runner.platform ?? ""} ${runner.tag_list?.join(" ") ?? ""}`.toLowerCase()

  if (text.includes("windows")) return "windows"
  if (text.includes("darwin") || text.includes("macos") || text.includes("mac")) {
    return "macos"
  }

  return "linux"
}

const runnerArch = (runner: GitLabRunnerResponse): Runner["arch"] => {
  const text = `${runner.architecture ?? ""} ${runner.tag_list?.join(" ") ?? ""}`.toLowerCase()
  return text.includes("arm64") || text.includes("aarch64") ? "arm64" : "x64"
}

export async function validateGitLabToken(
  token: string,
  baseUrl: string,
): Promise<{
  user: { username: string; name: string; avatarUrl: string; email: string }
  gitLabVersion?: string
}> {
  const [user, version] = await Promise.all([
    gitLabRequest<GitLabUserResponse>(token, baseUrl, "/user"),
    gitLabRequest<GitLabVersionResponse>(token, baseUrl, "/version").catch(() => undefined),
  ])

  return {
    user: {
      username: user.username,
      name: user.name,
      avatarUrl: user.avatar_url ?? "",
      email: user.email ?? "",
    },
    gitLabVersion: version?.version,
  }
}

export async function listProjects(
  token: string,
  baseUrl: string,
  params?: {
    search?: string
    membership?: boolean
    per_page?: number
    page?: number
  },
): Promise<
  {
    id: number
    name: string
    pathWithNamespace: string
    visibility: string
    defaultBranch: string
    avatarUrl?: string
  }[]
> {
  const projects = await gitLabRequest<GitLabProjectResponse[]>(
    token,
    baseUrl,
    `/projects${buildQuery({
      membership: params?.membership ?? true,
      order_by: "last_activity_at",
      page: params?.page ?? 1,
      per_page: params?.per_page ?? 100,
      search: params?.search,
      simple: true,
      sort: "desc",
    })}`,
  )

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    pathWithNamespace: project.path_with_namespace,
    visibility: project.visibility,
    defaultBranch: project.default_branch ?? "main",
    avatarUrl: project.avatar_url,
  }))
}

/**
 * GitLab job -> DevFlow Job
 * - job.id -> Job.id and Job.providerJobId for log/retry lookups.
 * - job.status -> Job.status using the same GitLab status normalization as pipelines.
 * - job.runner.description -> Job.runnerName.
 * - job.stage is carried separately by callers to group jobs into stages and derive
 *   dependsOn relationships between stages.
 * - GitLab does not expose structured per-step data, so each job becomes one Step.
 */
function mapJob(job: GitLabJobResponse, dependsOn: string[] = []): Job {
  const startedAt = job.started_at ?? job.created_at

  return {
    id: String(job.id),
    name: job.name,
    status: normalizeGitLabStatus(job.status),
    providerJobId: String(job.id),
    runnerName: job.runner?.description ?? "GitLab runner",
    startedAt,
    completedAt: job.finished_at ?? undefined,
    duration:
      job.duration !== null && job.duration !== undefined
        ? Math.round(job.duration)
        : durationInSeconds(startedAt, job.finished_at),
    steps: [
      {
        id: `${job.id}-script`,
        name: job.stage ? `${job.stage}: ${job.name}` : job.name,
        status: normalizeGitLabStatus(job.status),
        startedAt,
        completedAt: job.finished_at ?? undefined,
        duration:
          job.duration !== null && job.duration !== undefined
            ? Math.round(job.duration)
            : durationInSeconds(startedAt, job.finished_at),
        logs: [],
      },
    ],
    dependsOn,
  }
}

const stageDependsOnMap = (jobs: GitLabJobResponse[]) => {
  const stages = [...new Set(jobs.map((job) => job.stage))]
  const jobsByStage = new Map(
    stages.map((stage) => [
      stage,
      jobs.filter((job) => job.stage === stage).map((job) => String(job.id)),
    ]),
  )

  return new Map(
    stages.map((stage, index) => [
      stage,
      index > 0 ? jobsByStage.get(stages[index - 1]) ?? [] : [],
    ]),
  )
}

/**
 * GitLab pipeline -> DevFlow Pipeline
 * - pipeline.id -> Pipeline.id with project context encoded for detail/rerun/cancel.
 * - pipeline.status -> Pipeline.status: created->queued, running->running,
 *   success->success, failed->failed, canceled->cancelled, skipped->skipped.
 * - pipeline.ref -> Pipeline.branch.
 * - pipeline.sha -> Pipeline.commitSha.
 * - user metadata fills author/avatar when present.
 * - jobs are supplied by detail calls; list calls may pass [] for fast card loading.
 */
function mapPipeline(
  pipeline: GitLabPipelineResponse,
  projectId: string,
  jobs: Job[] = [],
): Pipeline {
  const startedAt = pipeline.started_at ?? pipeline.created_at

  return {
    id: buildPipelineId(projectId, pipeline.id),
    name: `Pipeline #${pipeline.iid ?? pipeline.id}`,
    status: normalizeGitLabStatus(pipeline.status),
    branch: pipeline.ref,
    commitSha: pipeline.sha,
    commitMessage: `GitLab pipeline for ${pipeline.ref}`,
    author: pipeline.user?.name ?? pipeline.user?.username ?? "GitLab",
    avatarUrl:
      pipeline.user?.avatar_url ??
      `https://i.pravatar.cc/40?u=${encodeURIComponent(String(pipeline.id))}`,
    triggeredAt: startedAt,
    completedAt: pipeline.finished_at ?? undefined,
    duration:
      pipeline.duration !== null && pipeline.duration !== undefined
        ? Math.round(pipeline.duration)
        : durationInSeconds(startedAt, pipeline.finished_at),
    jobs,
    workflowFile: ".gitlab-ci.yml",
    repoName: projectId,
    providerId: "gitlab",
    providerType: "gitlab",
    providerRunId: String(pipeline.id),
  }
}

export async function listPipelines(
  token: string,
  baseUrl: string,
  projectId: string,
  params?: {
    status?: string
    ref?: string
    per_page?: number
    page?: number
  },
): Promise<Pipeline[]> {
  const pipelines = await gitLabRequest<GitLabPipelineResponse[]>(
    token,
    baseUrl,
    `/projects/${encodeProjectId(projectId)}/pipelines${buildQuery({
      page: params?.page ?? 1,
      per_page: params?.per_page ?? 30,
      ref: params?.ref,
      status: params?.status,
    })}`,
  )

  return pipelines.map((pipeline) => mapPipeline(pipeline, projectId))
}

export async function getPipeline(
  token: string,
  baseUrl: string,
  projectId: string,
  pipelineId: number,
): Promise<Pipeline> {
  const [pipeline, jobs] = await Promise.all([
    gitLabRequest<GitLabPipelineResponse>(
      token,
      baseUrl,
      `/projects/${encodeProjectId(projectId)}/pipelines/${pipelineId}`,
    ),
    listPipelineJobs(token, baseUrl, projectId, pipelineId),
  ])

  return mapPipeline(pipeline, projectId, jobs)
}

export async function retryPipeline(
  token: string,
  baseUrl: string,
  projectId: string,
  pipelineId: number,
): Promise<Pipeline> {
  const pipeline = await gitLabRequest<GitLabPipelineResponse>(
    token,
    baseUrl,
    `/projects/${encodeProjectId(projectId)}/pipelines/${pipelineId}/retry`,
    { method: "POST" },
  )

  return mapPipeline(pipeline, projectId)
}

export function cancelPipeline(
  token: string,
  baseUrl: string,
  projectId: string,
  pipelineId: number,
): Promise<Pipeline>
export function cancelPipeline(
  provider: GitLabProvider,
  pipelineId: string,
): Promise<void>
export async function cancelPipeline(
  tokenOrProvider: string | GitLabProvider,
  baseUrlOrPipelineId: string,
  projectId?: string,
  pipelineId?: number,
): Promise<Pipeline | void> {
  if (typeof tokenOrProvider !== "string") {
    const parsed = parsePipelineId(baseUrlOrPipelineId)

    if (!parsed) {
      throw new GitLabApiError(400, "Pipeline ID is missing GitLab project context.")
    }

    await cancelPipeline(
      tokenOrProvider.token,
      tokenOrProvider.baseUrl,
      parsed.projectId,
      parsed.pipelineId,
    )
    return
  }

  if (!projectId || pipelineId === undefined) {
    throw new GitLabApiError(400, "Project ID and pipeline ID are required.")
  }

  const pipeline = await gitLabRequest<GitLabPipelineResponse>(
    tokenOrProvider,
    baseUrlOrPipelineId,
    `/projects/${encodeProjectId(projectId)}/pipelines/${pipelineId}/cancel`,
    { method: "POST" },
  )

  return mapPipeline(pipeline, projectId)
}

export async function listPipelineJobs(
  token: string,
  baseUrl: string,
  projectId: string,
  pipelineId: number,
): Promise<Job[]> {
  const jobs = await gitLabRequest<GitLabJobResponse[]>(
    token,
    baseUrl,
    `/projects/${encodeProjectId(projectId)}/pipelines/${pipelineId}/jobs?per_page=100`,
  )
  const dependsOnByStage = stageDependsOnMap(jobs)

  return jobs.map((job) => mapJob(job, dependsOnByStage.get(job.stage) ?? []))
}

export async function getJobLog(
  token: string,
  baseUrl: string,
  projectId: string,
  jobId: number,
): Promise<string> {
  return gitLabRequest<string>(
    token,
    baseUrl,
    `/projects/${encodeProjectId(projectId)}/jobs/${jobId}/trace`,
    { responseType: "text" },
  )
}

export async function retryJob(
  token: string,
  baseUrl: string,
  projectId: string,
  jobId: number,
): Promise<Job> {
  const job = await gitLabRequest<GitLabJobResponse>(
    token,
    baseUrl,
    `/projects/${encodeProjectId(projectId)}/jobs/${jobId}/retry`,
    { method: "POST" },
  )

  return mapJob(job)
}

/**
 * GitLab runner -> DevFlow Runner
 * - runner.id/name/status map directly, with inactive runners marked disabled.
 * - runner_type maps to GitLab shared/specific runner categories.
 * - tag_list becomes labels.
 * - platform/architecture/tag_list infer OS and CPU arch.
 * - GitLab runner list does not expose utilization or current job, so utilization
 *   uses a conservative busy/offline proxy until metrics are available.
 */
function mapRunner(runner: GitLabRunnerResponse): Runner {
  const labels = runner.tag_list ?? []
  const isOffline = runner.status === "offline" || runner.status === "never_contacted"
  const runnerType: Runner["runnerType"] =
    runner.runner_type === "instance_type"
      ? "gitlab-shared"
      : runner.runner_type === "project_type"
        ? "gitlab-specific"
        : "gitlab-shared"

  return {
    id: String(runner.id),
    name: runner.description ?? `GitLab runner ${runner.id}`,
    status:
      runner.active === false
        ? "disabled"
        : runner.status === "active"
          ? "online"
          : isOffline
            ? "offline"
            : "busy",
    os: runnerOs(runner),
    arch: runnerArch(runner),
    labels,
    runnerType,
    lastSeenAt: runner.contacted_at ?? new Date().toISOString(),
    version: runner.version ?? "unknown",
    providerId: "gitlab",
    providerType: "gitlab",
    utilization: runner.status === "active" ? 45 : 0,
  }
}

export async function listRunners(
  token: string,
  baseUrl: string,
  params?: {
    type?: "instance_type" | "group_type" | "project_type"
    status?: string
  },
): Promise<Runner[]> {
  const runners = await gitLabRequest<GitLabRunnerResponse[]>(
    token,
    baseUrl,
    `/runners${buildQuery({
      status: params?.status,
      type: params?.type,
    })}`,
  )

  return runners.map(mapRunner)
}

export async function getRunnerDetails(
  token: string,
  baseUrl: string,
  runnerId: number,
): Promise<Runner> {
  const runner = await gitLabRequest<GitLabRunnerResponse>(
    token,
    baseUrl,
    `/runners/${runnerId}`,
  )

  return mapRunner(runner)
}

export async function getGitLabWorkflow(
  token: string,
  baseUrl: string,
  projectId: string,
): Promise<Workflow> {
  const [project, pipelines] = await Promise.all([
    gitLabRequest<GitLabProjectResponse>(
      token,
      baseUrl,
      `/projects/${encodeProjectId(projectId)}`,
    ),
    listPipelines(token, baseUrl, projectId, { per_page: 50 }),
  ])
  const completedPipelines = pipelines.filter(
    (pipeline) =>
      pipeline.status === "success" ||
      pipeline.status === "failed" ||
      pipeline.status === "cancelled",
  )
  const successfulPipelines = completedPipelines.filter(
    (pipeline) => pipeline.status === "success",
  )
  const durations = completedPipelines
    .map((pipeline) => pipeline.duration)
    .filter((duration): duration is number => duration !== undefined)

  return {
    id: project.path_with_namespace,
    name: "GitLab CI",
    fileName: ".gitlab-ci.yml",
    path: ".gitlab-ci.yml",
    state: "active",
    lastRunAt: pipelines[0]?.triggeredAt,
    lastRunStatus: pipelines[0]?.status,
    totalRuns: pipelines.length,
    successRate:
      completedPipelines.length > 0
        ? Math.round((successfulPipelines.length / completedPipelines.length) * 100)
        : 0,
    avgDuration:
      durations.length > 0
        ? Math.round(durations.reduce((total, duration) => total + duration, 0) / durations.length)
        : 0,
    triggers: [
      { type: "push", branches: [project.default_branch ?? "main"] },
      { type: "workflow_dispatch" },
    ],
    providerId: "gitlab",
    providerType: "gitlab",
    repoName: project.path_with_namespace,
  }
}

export async function triggerPipeline(
  token: string,
  baseUrl: string,
  projectId: string,
  ref: string,
  variables?: Record<string, string>,
): Promise<{ id: number }> {
  const pipeline = await gitLabRequest<GitLabPipelineResponse>(
    token,
    baseUrl,
    `/projects/${encodeProjectId(projectId)}/pipeline`,
    {
      body: {
        ref,
        variables: Object.entries(variables ?? {}).map(([key, value]) => ({
          key,
          value,
        })),
      },
      method: "POST",
    },
  )

  return { id: pipeline.id }
}

export async function fetchPipelines(
  provider: GitLabProvider,
  filters?: PipelineFilters,
): Promise<Pipeline[]> {
  if (filters?.repoName) {
    return listPipelines(provider.token, provider.baseUrl, projectIdFromRepoName(filters.repoName), {
      ref: filters.branch === "all" ? undefined : filters.branch,
      status: filters.status === "all" ? undefined : filters.status,
    })
  }

  const projects = await listProjects(provider.token, provider.baseUrl, { per_page: 10 })
  const pipelinesByProject = await Promise.all(
    projects.map((project) =>
      listPipelines(provider.token, provider.baseUrl, project.pathWithNamespace, {
        per_page: 10,
      }),
    ),
  )

  return pipelinesByProject
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
  provider: GitLabProvider,
  repoName?: string,
): Promise<Workflow[]> {
  if (repoName) {
    return [await getGitLabWorkflow(provider.token, provider.baseUrl, repoName)]
  }

  const projects = await listProjects(provider.token, provider.baseUrl, { per_page: 10 })
  const workflows = await Promise.all(
    projects.map((project) =>
      getGitLabWorkflow(provider.token, provider.baseUrl, project.pathWithNamespace),
    ),
  )

  return workflows
}

export async function fetchRunners(
  provider: GitLabProvider,
  repoName?: string,
): Promise<Runner[]> {
  if (repoName) {
    return listRunners(provider.token, provider.baseUrl, { type: "project_type" })
  }

  return listRunners(provider.token, provider.baseUrl)
}

export async function fetchPipelineDetail(
  provider: GitLabProvider,
  pipelineId: string,
): Promise<Pipeline | null> {
  const parsed = parsePipelineId(pipelineId)

  if (!parsed) {
    return null
  }

  return getPipeline(
    provider.token,
    provider.baseUrl,
    parsed.projectId,
    parsed.pipelineId,
  )
}

export async function triggerWorkflow(
  provider: GitLabProvider,
  workflowId: string,
  params: { branch: string; inputs?: Record<string, string> },
): Promise<{ runId: string }> {
  const pipeline = await triggerPipeline(
    provider.token,
    provider.baseUrl,
    workflowId,
    params.branch,
    params.inputs,
  )

  return { runId: buildPipelineId(workflowId, pipeline.id) }
}

export async function rerunPipeline(
  provider: GitLabProvider,
  pipelineId: string,
): Promise<void> {
  const parsed = parsePipelineId(pipelineId)

  if (!parsed) {
    throw new GitLabApiError(400, "Pipeline ID is missing GitLab project context.")
  }

  await retryPipeline(
    provider.token,
    provider.baseUrl,
    parsed.projectId,
    parsed.pipelineId,
  )
}

