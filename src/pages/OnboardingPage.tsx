import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  Check,
  GitBranch,
  GitFork,
  GitPullRequest,
  Sparkles,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"

import { ConnectGitHubModal } from "@/components/github/ConnectGitHubModal"
import { ConnectGitLabModal } from "@/components/gitlab/ConnectGitLabModal"
import { Button } from "@/components/ui/button"
import { useProviders } from "@/hooks/useProviders"
import { onboardedStorageKey } from "@/lib/constants"
import { DEMO_PIPELINES } from "@/mock"
import type { Pipeline } from "@/types"

type Step = 1 | 2 | 3
type ConnectModalType = "github" | "gitlab" | null

const stepVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 80 : -80,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -80 : 80,
  }),
}

function ProviderIcon({
  className,
  icon,
}: {
  className?: string
  icon: "github" | "gitlab"
}) {
  if (icon === "github") {
    return <GitPullRequest className={className} />
  }

  return <GitFork className={className} />
}

function ProviderCard({
  description,
  icon,
  onClick,
  title,
}: {
  description: string
  icon: "github" | "gitlab"
  onClick: () => void
  title: string
}) {
  const iconColor = icon === "github" ? "text-slate-200" : "text-orange-400"

  return (
    <button
      className="group rounded-2xl border border-terminal-700 bg-terminal-900/80 p-5 text-left transition hover:-translate-y-1 hover:border-cyan-400/50 hover:bg-terminal-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-xl border border-terminal-700 bg-terminal-950 p-3">
          <ProviderIcon className={`h-6 w-6 ${iconColor}`} icon={icon} />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-600">
            Personal access token
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">{description}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm text-cyan-400">
        Connect
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </button>
  )
}

function PreviewPipelineCard({ pipeline }: { pipeline: Pipeline }) {
  return (
    <div className="rounded-2xl border border-l-4 border-l-pipeline-success border-terminal-700 bg-terminal-900 p-5 shadow-2xl shadow-cyan-950/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            {pipeline.repoName}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">{pipeline.name}</h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-pipeline-success/40 bg-terminal-950 px-2.5 py-1 text-xs font-medium text-pipeline-success">
          <span className="h-2 w-2 rounded-full bg-pipeline-success" />
          Success
        </span>
      </div>
      <p className="mt-4 line-clamp-1 text-sm text-slate-300">
        {pipeline.commitMessage}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5 text-slate-400">
          <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
          {pipeline.branch}
        </span>
        <span className="font-mono text-slate-400">
          {pipeline.commitSha.slice(0, 7)}
        </span>
        <span>{pipeline.jobs.length} jobs</span>
        <span>{pipeline.duration ? `${Math.round(pipeline.duration / 60)}m` : "Live"}</span>
      </div>
    </div>
  )
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const hasOnboarded = localStorage.getItem(onboardedStorageKey) === "true"
  const { activeProvider, providers } = useProviders()
  const [step, setStep] = useState<Step>(1)
  const [direction, setDirection] = useState(1)
  const [connectModalType, setConnectModalType] = useState<ConnectModalType>(null)
  const providerCountRef = useRef(providers.length)
  const previewPipeline = useMemo(() => DEMO_PIPELINES[0], [])
  const username = activeProvider?.username ?? activeProvider?.label

  useEffect(() => {
    if (step === 2 && providers.length > providerCountRef.current) {
      setDirection(1)
      setStep(3)
      setConnectModalType(null)
    }

    providerCountRef.current = providers.length
  }, [providers.length, step])

  if (hasOnboarded) {
    return <Navigate replace to="/pipelines" />
  }

  const goToStep = (nextStep: Step) => {
    setDirection(nextStep > step ? 1 : -1)
    setStep(nextStep)
  }

  const finishOnboarding = () => {
    localStorage.setItem(onboardedStorageKey, "true")
    navigate("/pipelines", { replace: true })
  }

  const useDemoData = () => goToStep(3)

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-terminal-950 px-6 py-10 text-slate-200">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-pipeline-success/10 blur-3xl" />

      <section className="relative z-10 w-full max-w-4xl">
        <div className="mb-8 flex justify-center gap-2">
          {[1, 2, 3].map((item) => (
            <span
              className={
                item === step
                  ? "h-1.5 w-10 rounded-full bg-cyan-400"
                  : "h-1.5 w-10 rounded-full bg-terminal-700"
              }
              key={item}
            />
          ))}
        </div>

        <AnimatePresence custom={direction} mode="wait">
          {step === 1 ? (
            <motion.div
              animate="center"
              className="mx-auto max-w-3xl text-center"
              custom={direction}
              exit="exit"
              initial="enter"
              key="welcome"
              transition={{ duration: 0.32, ease: "easeOut" }}
              variants={stepVariants}
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/30 bg-cyan-400/10 shadow-2xl shadow-cyan-950/40">
                <GitBranch className="h-10 w-10 text-cyan-400" />
              </div>
              <p className="mt-6 font-mono text-sm uppercase tracking-[0.3em] text-cyan-400">
                DevFlow
              </p>
              <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white md:text-6xl">
                Your CI/CD pipelines, unified.
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-400">
                Visualize GitHub Actions and GitLab CI pipelines in one place.
                Free, open source, runs in your browser.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Button
                  className="h-11 border-cyan-400 bg-cyan-400 px-5 text-terminal-950 hover:bg-cyan-300"
                  onClick={useDemoData}
                >
                  Try with demo data
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  className="h-11 border-terminal-700 bg-terminal-900 px-5 text-slate-200 hover:bg-terminal-800"
                  onClick={() => goToStep(2)}
                >
                  Connect a provider
                </Button>
              </div>
              <button
                className="mt-10 text-sm text-slate-500 transition hover:text-cyan-400"
                onClick={useDemoData}
                type="button"
              >
                Skip setup, use demo data
              </button>
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.div
              animate="center"
              className="mx-auto max-w-3xl"
              custom={direction}
              exit="exit"
              initial="enter"
              key="connect"
              transition={{ duration: 0.32, ease: "easeOut" }}
              variants={stepVariants}
            >
              <div className="text-center">
                <p className="font-mono text-sm uppercase tracking-[0.3em] text-cyan-400">
                  Connect
                </p>
                <h1 className="mt-4 text-4xl font-semibold text-white">
                  Bring your pipelines online.
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-slate-400">
                  Tokens stay in your browser. DevFlow calls GitHub and GitLab
                  APIs directly from your machine.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <ProviderCard
                  description="Connect GitHub Actions with repo and workflow scopes."
                  icon="github"
                  onClick={() => setConnectModalType("github")}
                  title="GitHub Actions"
                />
                <ProviderCard
                  description="Connect GitLab CI using a personal or project access token."
                  icon="gitlab"
                  onClick={() => setConnectModalType("gitlab")}
                  title="GitLab CI"
                />
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  className="text-sm text-slate-500 transition hover:text-cyan-400"
                  onClick={useDemoData}
                  type="button"
                >
                  Skip setup, use demo data
                </button>
              </div>
            </motion.div>
          ) : null}

          {step === 3 && previewPipeline ? (
            <motion.div
              animate="center"
              className="mx-auto max-w-3xl text-center"
              custom={direction}
              exit="exit"
              initial="enter"
              key="ready"
              transition={{ duration: 0.32, ease: "easeOut" }}
              variants={stepVariants}
            >
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-pipeline-success/40 bg-pipeline-success/10"
                initial={{ opacity: 0, scale: 0.7 }}
                transition={{ delay: 0.15, duration: 0.45, type: "spring" }}
              >
                <Check className="h-10 w-10 text-pipeline-success" />
              </motion.div>
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-terminal-700 bg-terminal-900 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                Ready
              </p>
              <h1 className="mt-5 text-4xl font-semibold text-white">
                {username ? `You're all set, ${username}!` : "You're all set!"}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-slate-400">
                Start with the dashboard, inspect a DAG, stream logs, and switch
                providers whenever you are ready.
              </p>
              <div className="mx-auto mt-8 max-w-2xl">
                <PreviewPipelineCard pipeline={previewPipeline} />
              </div>
              <Button
                className="mt-9 h-11 border-cyan-400 bg-cyan-400 px-5 text-terminal-950 hover:bg-cyan-300"
                onClick={finishOnboarding}
              >
                Open DevFlow
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <ConnectGitHubModal
        onClose={() => setConnectModalType(null)}
        open={connectModalType === "github"}
      />
      <ConnectGitLabModal
        onClose={() => setConnectModalType(null)}
        open={connectModalType === "gitlab"}
      />
    </main>
  )
}
