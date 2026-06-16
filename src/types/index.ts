export type PipelineStatus =
  | "queued"
  | "running"
  | "success"
  | "failed"
  | "cancelled"
  | "skipped"

export type ProviderType = "github" | "gitlab" | "mock"

export interface Provider {
  id: string // uuid, generated on connect
  type: ProviderType
  label: string // user-defined name e.g. "Work GitHub", "Personal GitLab"
  connectedAt: string // ISO string
  avatarUrl?: string // fetched from provider API on connect
  username?: string // fetched from provider API on connect
  baseUrl?: string // for self-hosted GitLab, e.g. "https://gitlab.mycompany.com"
}

export interface GitHubProvider extends Provider {
  type: "github"
  token: string // PAT - stored in localStorage (user's own browser)
  scopes: string[] // confirmed scopes after validation e.g. ["repo", "workflow"]
}

export interface GitLabProvider extends Provider {
  type: "gitlab"
  token: string // Personal Access Token or Project Token
  baseUrl: string // "https://gitlab.com" for cloud, custom for self-hosted
}

export interface Step {
  id: string
  name: string
  status: PipelineStatus
  startedAt?: string // ISO string
  completedAt?: string
  duration?: number // seconds
  logs: LogLine[]
}

export interface Job {
  id: string
  name: string
  status: PipelineStatus
  providerJobId?: string // GitHub job_id / GitLab job_id
  runnerName: string
  startedAt?: string
  completedAt?: string
  duration?: number
  steps: Step[]
  dependsOn: string[] // job IDs this job depends on
}

export interface Pipeline {
  id: string
  name: string
  status: PipelineStatus
  branch: string
  commitSha: string
  commitMessage: string
  author: string
  avatarUrl: string
  triggeredAt: string
  completedAt?: string
  duration?: number
  jobs: Job[]
  workflowFile: string // e.g. ".github/workflows/ci.yml"
  repoName: string
  providerId?: string // which provider this pipeline came from
  providerType?: ProviderType // "github" | "gitlab" | "mock"
  providerRunId?: string // original ID from the provider (GitHub run_id / GitLab pipeline_id)
}

export interface LogLine {
  id: string
  timestamp: string
  level: "info" | "warn" | "error" | "debug" | "success"
  message: string
}

export interface FilterState {
  status: PipelineStatus | "all"
  branch: string | "all"
  search: string
}

export interface Workflow {
  id: string
  name: string
  fileName: string // e.g. "ci.yml" / ".gitlab-ci.yml"
  path: string // full path e.g. ".github/workflows/ci.yml"
  state: "active" | "disabled" | "deleted"
  lastRunAt?: string // ISO string
  lastRunStatus?: PipelineStatus
  totalRuns: number
  successRate: number // 0-100
  avgDuration: number // seconds
  triggers: WorkflowTrigger[]
  providerId: string
  providerType: ProviderType
  repoName: string
}

export type WorkflowTriggerType =
  | "push"
  | "pull_request"
  | "schedule"
  | "workflow_dispatch"
  | "tag"
  | "merge_request"

export interface WorkflowTrigger {
  type: WorkflowTriggerType
  branches?: string[] // e.g. ["main", "release/*"]
  schedule?: string // cron expression e.g. "0 2 * * *"
}

export interface Runner {
  id: string
  name: string
  status: "online" | "offline" | "busy" | "disabled"
  os: "linux" | "windows" | "macos"
  arch: "x64" | "arm64"
  labels: string[] // e.g. ["self-hosted", "production", "gpu"]
  runnerType:
    | "github-hosted"
    | "self-hosted"
    | "gitlab-shared"
    | "gitlab-specific"
  currentJob?: {
    jobName: string
    pipelineName: string
    startedAt: string
  }
  lastSeenAt: string // ISO string
  version: string // runner agent version
  providerId: string
  providerType: ProviderType
  repoName?: string // for repo-specific runners
  groupName?: string // for GitLab group runners
  utilization: number // 0-100, % of last 24h busy
}
