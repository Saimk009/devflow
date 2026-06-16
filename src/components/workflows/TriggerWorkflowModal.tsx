import { useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { CheckCircle2, Loader2, Play, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { triggerWorkflow } from "@/lib/dataLayer"
import { toast } from "@/lib/toast"
import type { GitHubProvider, GitLabProvider, Pipeline, Workflow } from "@/types"

type TriggerWorkflowModalProps = {
  workflow: Workflow
  provider: GitHubProvider | GitLabProvider | null
  onClose: () => void
}

const defaultBranches = ["main", "develop"]

const createQueuedPipeline = (
  workflow: Workflow,
  branch: string,
  inputs: Record<string, string>,
): Pipeline => {
  const runId = `mock-run-${crypto.randomUUID()}`
  const triggeredAt = new Date().toISOString()

  return {
    id: runId,
    name: workflow.name,
    status: "queued",
    branch,
    commitSha: "manual0",
    commitMessage: `workflow_dispatch: ${workflow.fileName}`,
    author: "Manual trigger",
    avatarUrl: "https://i.pravatar.cc/40?u=manual-trigger",
    triggeredAt,
    jobs: [
      {
        id: "manual-dispatch",
        name: "manual-dispatch",
        status: "queued",
        runnerName: "queued",
        steps: [
          {
            id: "manual-dispatch-step-1",
            name: `Prepare ${inputs.environment ?? "staging"} run`,
            status: "queued",
            logs: [],
          },
        ],
        dependsOn: [],
      },
    ],
    workflowFile: workflow.path,
    repoName: workflow.repoName,
    providerId: "mock",
    providerType: "mock",
    providerRunId: runId,
  }
}

export function TriggerWorkflowModal({
  onClose,
  provider,
  workflow,
}: TriggerWorkflowModalProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState<1 | 2>(1)
  const [branch, setBranch] = useState("main")
  const [environment, setEnvironment] = useState("staging")
  const [dryRun, setDryRun] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [queuedRunId, setQueuedRunId] = useState<string | null>(null)
  const branches = useMemo(() => {
    const cachedPipelineQueries = queryClient.getQueriesData<Pipeline[]>({
      queryKey: ["pipelines"],
    })
    const recentBranches = cachedPipelineQueries.flatMap(([, pipelines]) =>
      (pipelines ?? []).map((pipeline) => pipeline.branch),
    )
    const triggerBranches = workflow.triggers.flatMap(
      (trigger) => trigger.branches ?? [],
    )

    return Array.from(
      new Set([...defaultBranches, ...triggerBranches, ...recentBranches]),
    )
  }, [queryClient, workflow.triggers])
  const hasWorkflowDispatch = workflow.triggers.some(
    (trigger) => trigger.type === "workflow_dispatch",
  )

  useEffect(() => {
    if (step !== 2) {
      return
    }

    const timeoutId = window.setTimeout(onClose, 3_000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [onClose, step])

  const runWorkflow = async () => {
    setIsSubmitting(true)

    try {
      if (provider === null) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 800)
        })

        const newRun = createQueuedPipeline(workflow, branch, {
          environment,
          dry_run: String(dryRun),
        })

        queryClient.setQueriesData<Pipeline[]>(
          { queryKey: ["pipelines"] },
          (pipelines) => (pipelines ? [newRun, ...pipelines] : [newRun]),
        )
        setQueuedRunId(newRun.id)
      } else {
        const result = await triggerWorkflow(provider, workflow.id, {
          branch,
          inputs: hasWorkflowDispatch
            ? {
                environment,
                dry_run: String(dryRun),
              }
            : undefined,
        })

        setQueuedRunId(result.runId)
        await queryClient.invalidateQueries()
      }

      toast.success(`Run queued for ${workflow.name}`)
      setStep(2)
    } catch (error) {
      toast.apiError(
        error,
        () => void runWorkflow(),
        () => navigate("/settings?tab=providers"),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-lg rounded-xl border border-terminal-700 bg-terminal-900 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{workflow.name}</h2>
            <p className="mt-1 font-mono text-sm text-slate-500">{workflow.path}</p>
          </div>
          <Button
            aria-label="Close trigger workflow modal"
            className="h-8 w-8 bg-terminal-950 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {step === 1 ? (
          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="workflow-branch">Branch</Label>
              <Select onValueChange={setBranch} value={branch}>
                <SelectTrigger id="workflow-branch">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {branches.map((branchName) => (
                      <SelectItem key={branchName} value={branchName}>
                        {branchName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {hasWorkflowDispatch ? (
              <div className="rounded-lg border border-terminal-700 bg-terminal-950 p-4">
                <h3 className="text-sm font-medium text-slate-200">Inputs</h3>
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="workflow-environment">environment</Label>
                    <Select onValueChange={setEnvironment} value={environment}>
                      <SelectTrigger id="workflow-environment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="staging">staging</SelectItem>
                          <SelectItem value="production">production</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-center gap-3 text-sm text-slate-300">
                    <Input
                      checked={dryRun}
                      className="h-4 w-4"
                      onChange={(event) => setDryRun(event.target.checked)}
                      type="checkbox"
                    />
                    dry_run
                  </label>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button
                className="border-cyan-400/60 text-cyan-400 hover:bg-cyan-400/10"
                disabled={isSubmitting}
                onClick={() => void runWorkflow()}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Run workflow
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center text-center">
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              initial={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <CheckCircle2 className="h-14 w-14 text-pipeline-success" />
            </motion.div>
            <h3 className="mt-4 text-lg font-semibold text-white">
              Run queued successfully
            </h3>
            <Button
              className="mt-6 border-cyan-400/60 text-cyan-400 hover:bg-cyan-400/10"
              onClick={() => {
                navigate(
                  provider === null || !queuedRunId
                    ? "/pipelines"
                    : `/pipelines/${queuedRunId}`,
                )
                onClose()
              }}
            >
              View run →
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
