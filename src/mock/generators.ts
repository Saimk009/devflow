import type { Job, LogLine, Pipeline, PipelineStatus, Runner, Step, Workflow } from "@/types"

type JobName =
  | "install"
  | "lint"
  | "type-check"
  | "test"
  | "build"
  | "deploy-staging"
  | "deploy-prod"
  | "security-scan"
  | "docker-build"

type PipelineSpec = {
  id: string
  name: string
  status: PipelineStatus
  branch: string
  commitSha: string
  commitMessage: string
  author: string
  repoName: string
  workflowFile: string
  minutesAgo: number
  jobs: JobName[]
  failedJob?: JobName
  runningJob?: JobName
  cancelledJob?: JobName
}

const branches = [
  "main",
  "feat/auth-refactor",
  "fix/memory-leak",
  "chore/update-deps",
  "feat/dashboard-v2",
]

const runners = [
  "ubuntu-latest-8cpu",
  "ubuntu-latest-4cpu",
  "self-hosted-linux-x64",
  "macos-14-arm64",
]

const jobDurations: Record<JobName, number> = {
  install: 64,
  lint: 28,
  "type-check": 36,
  test: 184,
  build: 86,
  "deploy-staging": 42,
  "deploy-prod": 58,
  "security-scan": 74,
  "docker-build": 112,
}

const jobSteps: Record<JobName, string[]> = {
  install: ["checkout repository", "restore pnpm cache", "setup node", "install dependencies"],
  lint: ["load eslint config", "scan source files", "check import order", "publish annotations"],
  "type-check": ["generate tsconfig graph", "run tsc build mode", "validate declarations"],
  test: ["prepare test database", "start mock services", "run unit tests", "run integration tests", "upload coverage"],
  build: ["compile TypeScript", "bundle application", "optimize assets", "write build manifest"],
  "deploy-staging": ["authenticate cloud provider", "upload artifact", "run migrations", "promote staging release"],
  "deploy-prod": ["verify release gates", "upload artifact", "switch traffic", "notify release channel"],
  "security-scan": ["sync advisory database", "scan dependencies", "scan container layers", "publish sarif report"],
  "docker-build": ["load buildx cache", "build image layers", "tag image", "push image"],
}

const dependencyMap: Record<JobName, JobName[]> = {
  install: [],
  lint: ["install"],
  "type-check": ["install"],
  test: ["install"],
  build: ["lint", "type-check", "test"],
  "deploy-staging": ["build", "test"],
  "deploy-prod": ["deploy-staging"],
  "security-scan": ["install"],
  "docker-build": ["build"],
}

const specs: PipelineSpec[] = [
  {
    id: "pipe-1001",
    name: "Frontend CI",
    status: "success",
    branch: branches[0],
    commitSha: "8f4d9a2c1b7e",
    commitMessage: "feat: add pipeline health summary",
    author: "Maya Chen",
    repoName: "acme-corp/frontend",
    workflowFile: ".github/workflows/ci.yml",
    minutesAgo: 35,
    jobs: ["install", "lint", "type-check", "test", "build", "deploy-staging"],
  },
  {
    id: "pipe-1002",
    name: "Dashboard Preview",
    status: "success",
    branch: branches[4],
    commitSha: "f31a7d90c2aa",
    commitMessage: "feat: ship dashboard v2 cards",
    author: "Noah Patel",
    repoName: "acme-corp/frontend",
    workflowFile: ".github/workflows/preview.yml",
    minutesAgo: 84,
    jobs: ["install", "lint", "test", "build", "docker-build"],
  },
  {
    id: "pipe-1003",
    name: "API Dependency Refresh",
    status: "success",
    branch: branches[3],
    commitSha: "12b89fd44e01",
    commitMessage: "chore: update express and prisma dependencies",
    author: "Olivia Brooks",
    repoName: "acme-corp/api",
    workflowFile: ".github/workflows/ci.yml",
    minutesAgo: 128,
    jobs: ["install", "type-check", "test", "security-scan", "build"],
  },
  {
    id: "pipe-1004",
    name: "Memory Leak Hotfix",
    status: "failed",
    branch: branches[2],
    commitSha: "a64ef2c8b019",
    commitMessage: "fix: release websocket listeners on teardown",
    author: "Ethan Wright",
    repoName: "acme-corp/api",
    workflowFile: ".github/workflows/api.yml",
    minutesAgo: 176,
    jobs: ["install", "lint", "test", "build"],
    failedJob: "test",
  },
  {
    id: "pipe-1005",
    name: "Auth Refactor",
    status: "failed",
    branch: branches[1],
    commitSha: "c77b0e19fd31",
    commitMessage: "refactor: split session token service",
    author: "Sophia Martinez",
    repoName: "acme-corp/frontend",
    workflowFile: ".github/workflows/ci.yml",
    minutesAgo: 214,
    jobs: ["install", "lint", "type-check", "test", "build"],
    failedJob: "type-check",
  },
  {
    id: "pipe-1006",
    name: "Mainline Release",
    status: "running",
    branch: branches[0],
    commitSha: "91a4d22b7c0e",
    commitMessage: "release: prepare web app 2026.06.16",
    author: "Liam Johnson",
    repoName: "acme-corp/frontend",
    workflowFile: ".github/workflows/release.yml",
    minutesAgo: 12,
    jobs: ["install", "lint", "type-check", "test", "build", "deploy-staging"],
    runningJob: "build",
  },
  {
    id: "pipe-1007",
    name: "API Dashboard Contract",
    status: "running",
    branch: branches[4],
    commitSha: "4f0a817d25be",
    commitMessage: "feat: expose dashboard metrics endpoint",
    author: "Ava Thompson",
    repoName: "acme-corp/api",
    workflowFile: ".github/workflows/api.yml",
    minutesAgo: 18,
    jobs: ["install", "test", "security-scan", "build", "docker-build"],
    runningJob: "security-scan",
  },
  {
    id: "pipe-1008",
    name: "Dependency Queue",
    status: "queued",
    branch: branches[3],
    commitSha: "2d7cb850fa4d",
    commitMessage: "chore: refresh lockfile",
    author: "Isabella Kim",
    repoName: "acme-corp/frontend",
    workflowFile: ".github/workflows/ci.yml",
    minutesAgo: 3,
    jobs: ["install", "lint", "test", "build"],
  },
  {
    id: "pipe-1009",
    name: "Auth API Queue",
    status: "queued",
    branch: branches[1],
    commitSha: "b6c10a9d4e77",
    commitMessage: "feat: add oauth device flow",
    author: "Lucas Nguyen",
    repoName: "acme-corp/api",
    workflowFile: ".github/workflows/api.yml",
    minutesAgo: 5,
    jobs: ["install", "type-check", "test", "docker-build"],
  },
  {
    id: "pipe-1010",
    name: "Leak Investigation",
    status: "cancelled",
    branch: branches[2],
    commitSha: "0ce824a96bd3",
    commitMessage: "test: add heap snapshot regression case",
    author: "Mia Anderson",
    repoName: "acme-corp/frontend",
    workflowFile: ".github/workflows/ci.yml",
    minutesAgo: 62,
    jobs: ["install", "lint", "test", "build"],
    cancelledJob: "test",
  },
  {
    id: "pipe-1011",
    name: "Docs Only Check",
    status: "skipped",
    branch: branches[0],
    commitSha: "9bc7421a04df",
    commitMessage: "docs: clarify deployment rollback steps",
    author: "James Wilson",
    repoName: "acme-corp/api",
    workflowFile: ".github/workflows/ci.yml",
    minutesAgo: 246,
    jobs: ["install", "lint", "type-check"],
  },
  {
    id: "pipe-1012",
    name: "Mixed Result Regression",
    status: "failed",
    branch: branches[2],
    commitSha: "e41b88c21df0",
    commitMessage: "fix: stabilize retry backoff under load",
    author: "Grace Lee",
    repoName: "acme-corp/api",
    workflowFile: ".github/workflows/regression.yml",
    minutesAgo: 301,
    jobs: ["install", "lint", "type-check", "test", "build", "deploy-staging"],
    failedJob: "test",
  },
]

const startedAt = (minutesAgo: number, offsetSeconds = 0) =>
  new Date(Date.now() - minutesAgo * 60_000 + offsetSeconds * 1_000).toISOString()

const completedAt = (startIso: string, duration: number) =>
  new Date(new Date(startIso).getTime() + duration * 1_000).toISOString()

const avatarUrl = (author: string) =>
  `https://i.pravatar.cc/40?u=${encodeURIComponent(author)}`

const getLevel = (status: PipelineStatus, index: number): LogLine["level"] => {
  if (status === "failed" && index === 5) return "error"
  if (status === "success" && index === 5) return "success"
  if (status === "running" && index > 3) return "debug"
  if (status === "cancelled" && index === 5) return "warn"
  return "info"
}

const getLogMessage = (stepName: string, status: PipelineStatus, index: number) => {
  const messages = [
    `$ ${stepName.replaceAll(" ", "-")} --ci`,
    "Resolving workspace configuration",
    "Using cached dependencies where available",
    "Streaming command output",
    "Writing step metadata",
  ]

  if (status === "success") return messages[index] ?? "Step completed successfully"
  if (status === "failed") return messages[index] ?? "Command exited with code 1"
  if (status === "running") return messages[index] ?? "Process is still running"
  if (status === "queued") return messages[index] ?? "Waiting for an available runner"
  if (status === "cancelled") return messages[index] ?? "Step cancelled by a newer run"
  return messages[index] ?? "Step skipped because workflow conditions were not met"
}

const createLogs = (
  stepId: string,
  stepName: string,
  status: PipelineStatus,
  startIso: string,
): LogLine[] =>
  Array.from({ length: 6 }, (_, index) => ({
    id: `${stepId}-log-${index + 1}`,
    timestamp: completedAt(startIso, index * 5),
    level: getLevel(status, index),
    message: getLogMessage(stepName, status, index),
  }))

const getStepStatus = (jobStatus: PipelineStatus, index: number, total: number) => {
  if (jobStatus === "failed") return index === total - 1 ? "failed" : "success"
  if (jobStatus === "running") return index === total - 1 ? "running" : "success"
  return jobStatus
}

const createSteps = (
  jobName: JobName,
  jobStatus: PipelineStatus,
  jobStartIso: string,
): Step[] => {
  const names = jobSteps[jobName]
  const stepDuration = Math.max(6, Math.floor(jobDurations[jobName] / names.length))

  return names.map((name, index) => {
    const status = getStepStatus(jobStatus, index, names.length)
    const stepStart = completedAt(jobStartIso, index * stepDuration)
    const isComplete = status === "success" || status === "failed" || status === "cancelled"

    return {
      id: `${jobName}-step-${index + 1}`,
      name,
      status,
      startedAt: status === "queued" || status === "skipped" ? undefined : stepStart,
      completedAt: isComplete ? completedAt(stepStart, stepDuration) : undefined,
      duration: isComplete ? stepDuration : undefined,
      logs: createLogs(`${jobName}-step-${index + 1}`, name, status, stepStart),
    }
  })
}

const getJobStatus = (spec: PipelineSpec, jobName: JobName, index: number) => {
  if (spec.status === "success" || spec.status === "queued" || spec.status === "skipped") {
    return spec.status
  }

  if (spec.runningJob) {
    const runningIndex = spec.jobs.indexOf(spec.runningJob)
    if (index < runningIndex) return "success"
    if (jobName === spec.runningJob) return "running"
    return "queued"
  }

  if (spec.cancelledJob) {
    const cancelledIndex = spec.jobs.indexOf(spec.cancelledJob)
    if (index < cancelledIndex) return "success"
    if (jobName === spec.cancelledJob) return "cancelled"
    return "skipped"
  }

  if (spec.failedJob) {
    const failedIndex = spec.jobs.indexOf(spec.failedJob)
    if (index < failedIndex) return "success"
    if (jobName === spec.failedJob) return "failed"
    return "skipped"
  }

  return spec.status
}

const createJobs = (spec: PipelineSpec): Job[] => {
  let elapsed = 0

  return spec.jobs.map((jobName, index) => {
    const status = getJobStatus(spec, jobName, index)
    const duration = jobDurations[jobName]
    const jobStart = startedAt(spec.minutesAgo, elapsed)
    const hasStarted = status !== "queued" && status !== "skipped"
    const isComplete = status === "success" || status === "failed" || status === "cancelled"

    if (isComplete) {
      elapsed += duration + 8
    }

    return {
      id: jobName,
      name: jobName,
      status,
      runnerName: runners[index % runners.length],
      startedAt: hasStarted ? jobStart : undefined,
      completedAt: isComplete ? completedAt(jobStart, duration) : undefined,
      duration: isComplete ? duration : undefined,
      steps: createSteps(jobName, status, jobStart),
      dependsOn: dependencyMap[jobName].filter((dependency) => spec.jobs.includes(dependency)),
    }
  })
}

const createPipeline = (spec: PipelineSpec): Pipeline => {
  const jobs = createJobs(spec)
  const completedJobs = jobs.filter((job) => job.duration)
  const duration = completedJobs.reduce((total, job) => total + (job.duration ?? 0), 0)
  const triggeredAt = startedAt(spec.minutesAgo)

  return {
    id: spec.id,
    name: spec.name,
    status: spec.status,
    branch: spec.branch,
    commitSha: spec.commitSha,
    commitMessage: spec.commitMessage,
    author: spec.author,
    avatarUrl: avatarUrl(spec.author),
    triggeredAt,
    completedAt:
      spec.status === "running" || spec.status === "queued"
        ? undefined
        : completedAt(triggeredAt, duration),
    duration: spec.status === "running" || spec.status === "queued" ? undefined : duration,
    jobs,
    workflowFile: spec.workflowFile,
    repoName: spec.repoName,
  }
}

export const mockPipelines: Pipeline[] = specs.map(createPipeline)

export const getUniqueBranches = (pipelines: Pipeline[]): string[] =>
  Array.from(new Set(pipelines.map((pipeline) => pipeline.branch))).sort()

export const getPipelineById = (id: string): Pipeline | undefined =>
  mockPipelines.find((pipeline) => pipeline.id === id)

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1_000).toISOString()

export const mockWorkflows: Workflow[] = [
  {
    id: "workflow-ci",
    name: "CI Pipeline",
    fileName: "ci.yml",
    path: ".github/workflows/ci.yml",
    state: "active",
    lastRunAt: daysAgo(0.2),
    lastRunStatus: "success",
    totalRuns: 1842,
    successRate: 94,
    avgDuration: 398,
    triggers: [
      { type: "push", branches: ["main", "develop"] },
      { type: "pull_request" },
    ],
    providerId: "mock",
    providerType: "mock",
    repoName: "acme-corp/frontend",
  },
  {
    id: "workflow-deploy-production",
    name: "Deploy to Production",
    fileName: "deploy.yml",
    path: ".github/workflows/deploy.yml",
    state: "active",
    lastRunAt: daysAgo(1.1),
    lastRunStatus: "running",
    totalRuns: 624,
    successRate: 88,
    avgDuration: 512,
    triggers: [
      { type: "push", branches: ["main"] },
      { type: "workflow_dispatch" },
    ],
    providerId: "mock",
    providerType: "mock",
    repoName: "acme-corp/frontend",
  },
  {
    id: "workflow-security",
    name: "Nightly Security Scan",
    fileName: "security.yml",
    path: ".github/workflows/security.yml",
    state: "active",
    lastRunAt: daysAgo(0.7),
    lastRunStatus: "failed",
    totalRuns: 730,
    successRate: 76,
    avgDuration: 691,
    triggers: [{ type: "schedule", schedule: "0 2 * * *" }],
    providerId: "mock",
    providerType: "mock",
    repoName: "acme-corp/api",
  },
  {
    id: "workflow-release",
    name: "Release & Publish",
    fileName: "release.yml",
    path: ".github/workflows/release.yml",
    state: "active",
    lastRunAt: daysAgo(4.5),
    lastRunStatus: "success",
    totalRuns: 4,
    successRate: 100,
    avgDuration: 842,
    triggers: [{ type: "tag", branches: ["v*"] }],
    providerId: "mock",
    providerType: "mock",
    repoName: "acme-corp/frontend",
  },
  {
    id: "workflow-preview",
    name: "Preview Deployments",
    fileName: "preview.yml",
    path: ".github/workflows/preview.yml",
    state: "active",
    lastRunAt: daysAgo(0.4),
    lastRunStatus: "success",
    totalRuns: 1284,
    successRate: 91,
    avgDuration: 276,
    triggers: [{ type: "pull_request" }],
    providerId: "mock",
    providerType: "mock",
    repoName: "acme-corp/frontend",
  },
  {
    id: "workflow-deps",
    name: "Dependency Updates",
    fileName: "deps.yml",
    path: ".github/workflows/deps.yml",
    state: "active",
    lastRunAt: daysAgo(2.2),
    lastRunStatus: "success",
    totalRuns: 214,
    successRate: 83,
    avgDuration: 335,
    triggers: [{ type: "schedule", schedule: "0 9 * * 1" }],
    providerId: "mock",
    providerType: "mock",
    repoName: "acme-corp/frontend",
  },
  {
    id: "workflow-e2e",
    name: "E2E Tests",
    fileName: "e2e.yml",
    path: ".github/workflows/e2e.yml",
    state: "active",
    lastRunAt: daysAgo(0.9),
    lastRunStatus: "failed",
    totalRuns: 962,
    successRate: 71,
    avgDuration: 1210,
    triggers: [
      { type: "push", branches: ["main"] },
      { type: "workflow_dispatch" },
    ],
    providerId: "mock",
    providerType: "mock",
    repoName: "acme-corp/frontend",
  },
  {
    id: "workflow-docker",
    name: "Docker Build & Push",
    fileName: "docker.yml",
    path: ".github/workflows/docker.yml",
    state: "active",
    lastRunAt: daysAgo(1.8),
    lastRunStatus: "success",
    totalRuns: 1476,
    successRate: 96,
    avgDuration: 468,
    triggers: [
      { type: "push", branches: ["main"] },
      { type: "tag" },
    ],
    providerId: "mock",
    providerType: "mock",
    repoName: "acme-corp/api",
  },
  {
    id: "workflow-stale",
    name: "Stale Issue Cleanup",
    fileName: "stale.yml",
    path: ".github/workflows/stale.yml",
    state: "disabled",
    lastRunAt: daysAgo(6.6),
    lastRunStatus: "success",
    totalRuns: 386,
    successRate: 100,
    avgDuration: 81,
    triggers: [{ type: "schedule", schedule: "0 0 * * *" }],
    providerId: "mock",
    providerType: "mock",
    repoName: "acme-corp/frontend",
  },
  {
    id: "workflow-performance",
    name: "Performance Benchmarks",
    fileName: "perf.yml",
    path: ".github/workflows/perf.yml",
    state: "active",
    lastRunAt: daysAgo(3.3),
    lastRunStatus: "success",
    totalRuns: 168,
    successRate: 89,
    avgDuration: 1540,
    triggers: [{ type: "workflow_dispatch" }],
    providerId: "mock",
    providerType: "mock",
    repoName: "acme-corp/frontend",
  },
]

const runStatuses: PipelineStatus[] = ["success", "success", "failed", "success", "cancelled"]

const createWorkflowRun = (
  workflow: Workflow,
  seed: Pipeline,
  index: number,
): Pipeline => {
  const status = runStatuses[index % runStatuses.length]
  const triggeredAt = new Date(Date.now() - (index + 1) * 2 * 60 * 60 * 1_000).toISOString()
  const duration = status === "success" || status === "failed" || status === "cancelled"
    ? workflow.avgDuration + index * 12
    : undefined

  return {
    ...seed,
    id: `${workflow.id}-run-${index + 1}`,
    name: workflow.name,
    status,
    branch: index % 2 === 0 ? "main" : "feat/dashboard-v2",
    commitSha: `${seed.commitSha.slice(0, 8)}${index}`,
    commitMessage: `${status === "failed" ? "fix" : "chore"}: run ${workflow.fileName}`,
    triggeredAt,
    completedAt: duration
      ? new Date(new Date(triggeredAt).getTime() + duration * 1_000).toISOString()
      : undefined,
    duration,
    workflowFile: workflow.path,
    repoName: workflow.repoName,
    providerId: "mock",
    providerType: "mock",
    providerRunId: `${workflow.id}-${index + 1}`,
  }
}

export const mockWorkflowRuns = (workflowId: string): Pipeline[] => {
  const workflow = mockWorkflows.find((item) => item.id === workflowId)

  if (!workflow) {
    return []
  }

  const matchingRuns = mockPipelines.filter((pipeline) =>
    pipeline.workflowFile.endsWith(`/${workflow.fileName}`),
  )
  const paddedRuns = Array.from({ length: Math.max(0, 5 - matchingRuns.length) }, (_, index) =>
    createWorkflowRun(workflow, mockPipelines[index % mockPipelines.length], index),
  )

  return [...matchingRuns, ...paddedRuns].slice(0, 5)
}

const minutesAgoIso = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1_000).toISOString()

export const mockRunners: Runner[] = [
  {
    id: "gh-hosted-ubuntu-latest",
    name: "ubuntu-latest",
    status: "online",
    os: "linux",
    arch: "x64",
    labels: ["ubuntu-latest", "ubuntu-22.04"],
    runnerType: "github-hosted",
    lastSeenAt: minutesAgoIso(1),
    version: "2.317.0",
    providerId: "mock",
    providerType: "mock",
    utilization: 67,
  },
  {
    id: "gh-hosted-ubuntu-2004",
    name: "ubuntu-20.04",
    status: "online",
    os: "linux",
    arch: "x64",
    labels: ["ubuntu-20.04"],
    runnerType: "github-hosted",
    lastSeenAt: minutesAgoIso(3),
    version: "2.317.0",
    providerId: "mock",
    providerType: "mock",
    utilization: 43,
  },
  {
    id: "gh-hosted-windows-latest",
    name: "windows-latest",
    status: "online",
    os: "windows",
    arch: "x64",
    labels: ["windows-latest", "windows-2022"],
    runnerType: "github-hosted",
    lastSeenAt: minutesAgoIso(5),
    version: "2.316.1",
    providerId: "mock",
    providerType: "mock",
    utilization: 28,
  },
  {
    id: "gh-hosted-macos-latest",
    name: "macos-latest",
    status: "online",
    os: "macos",
    arch: "arm64",
    labels: ["macos-latest", "macos-14"],
    runnerType: "github-hosted",
    lastSeenAt: minutesAgoIso(2),
    version: "2.317.0",
    providerId: "mock",
    providerType: "mock",
    utilization: 55,
  },
  {
    id: "gh-hosted-macos-13",
    name: "macos-13",
    status: "online",
    os: "macos",
    arch: "x64",
    labels: ["macos-13"],
    runnerType: "github-hosted",
    lastSeenAt: minutesAgoIso(7),
    version: "2.315.0",
    providerId: "mock",
    providerType: "mock",
    utilization: 19,
  },
  {
    id: "self-hosted-prod-01",
    name: "prod-runner-01",
    status: "busy",
    os: "linux",
    arch: "x64",
    labels: ["self-hosted", "production", "docker"],
    runnerType: "self-hosted",
    currentJob: {
      jobName: "deploy",
      pipelineName: "Deploy to Production",
      startedAt: minutesAgoIso(4),
    },
    lastSeenAt: minutesAgoIso(0),
    version: "2.317.0",
    providerId: "mock",
    providerType: "mock",
    utilization: 89,
  },
  {
    id: "self-hosted-prod-02",
    name: "prod-runner-02",
    status: "online",
    os: "linux",
    arch: "x64",
    labels: ["self-hosted", "production", "docker"],
    runnerType: "self-hosted",
    lastSeenAt: minutesAgoIso(1),
    version: "2.317.0",
    providerId: "mock",
    providerType: "mock",
    utilization: 72,
  },
  {
    id: "self-hosted-staging-01",
    name: "staging-runner-01",
    status: "online",
    os: "linux",
    arch: "x64",
    labels: ["self-hosted", "staging"],
    runnerType: "self-hosted",
    lastSeenAt: minutesAgoIso(6),
    version: "2.316.1",
    providerId: "mock",
    providerType: "mock",
    utilization: 61,
  },
  {
    id: "self-hosted-gpu-01",
    name: "gpu-runner-01",
    status: "offline",
    os: "linux",
    arch: "x64",
    labels: ["self-hosted", "gpu", "ml"],
    runnerType: "self-hosted",
    lastSeenAt: minutesAgoIso(180),
    version: "2.312.0",
    providerId: "mock",
    providerType: "mock",
    utilization: 0,
  },
  {
    id: "self-hosted-arm-01",
    name: "arm-runner-01",
    status: "online",
    os: "linux",
    arch: "arm64",
    labels: ["self-hosted", "arm64"],
    runnerType: "self-hosted",
    lastSeenAt: minutesAgoIso(4),
    version: "2.316.1",
    providerId: "mock",
    providerType: "mock",
    utilization: 38,
  },
  {
    id: "self-hosted-windows-01",
    name: "windows-runner-01",
    status: "busy",
    os: "windows",
    arch: "x64",
    labels: ["self-hosted", "windows", "dotnet"],
    runnerType: "self-hosted",
    currentJob: {
      jobName: "build",
      pipelineName: "CI Pipeline",
      startedAt: minutesAgoIso(2),
    },
    lastSeenAt: minutesAgoIso(0),
    version: "2.317.0",
    providerId: "mock",
    providerType: "mock",
    utilization: 94,
  },
  {
    id: "gitlab-shared-linux-1",
    name: "gitlab-shared-linux-1",
    status: "online",
    os: "linux",
    arch: "x64",
    labels: ["shared", "docker", "linux"],
    runnerType: "gitlab-shared",
    lastSeenAt: minutesAgoIso(3),
    version: "16.11.1",
    providerId: "mock",
    providerType: "mock",
    utilization: 45,
  },
  {
    id: "gitlab-shared-linux-2",
    name: "gitlab-shared-linux-2",
    status: "busy",
    os: "linux",
    arch: "x64",
    labels: ["shared", "docker", "linux"],
    runnerType: "gitlab-shared",
    currentJob: {
      jobName: "test",
      pipelineName: "Dependency Updates",
      startedAt: minutesAgoIso(9),
    },
    lastSeenAt: minutesAgoIso(1),
    version: "16.11.1",
    providerId: "mock",
    providerType: "mock",
    utilization: 78,
  },
  {
    id: "gitlab-shared-macos-1",
    name: "gitlab-shared-macos-1",
    status: "online",
    os: "macos",
    arch: "x64",
    labels: ["shared", "saas-macos-medium"],
    runnerType: "gitlab-shared",
    lastSeenAt: minutesAgoIso(8),
    version: "16.10.2",
    providerId: "mock",
    providerType: "mock",
    utilization: 31,
  },
]
