import { ExternalLink, GitFork, GitPullRequest, ShieldCheck } from "lucide-react"
import { useState } from "react"

import { EmptyState } from "@/components/ui/EmptyState"
import { ConnectGitHubModal } from "@/components/github/ConnectGitHubModal"
import { ConnectGitLabModal } from "@/components/gitlab/ConnectGitLabModal"
import { Button } from "@/components/ui/button"
import { useProviders } from "@/hooks/useProviders"
import {
  getProviderColor,
  getProviderLabel,
} from "@/lib/providerUtils"
import { formatDate } from "@/lib/formatDate"
import { toast } from "@/lib/toast"
import type { GitHubProvider, GitLabProvider, ProviderType } from "@/types"

type ConnectedProvider = GitHubProvider | GitLabProvider
type ConnectModalType = "github" | "gitlab" | null

function ProviderTypeIcon({
  className,
  type,
}: {
  className?: string
  type: ProviderType
}) {
  if (type === "gitlab") {
    return <GitFork className={className} />
  }

  return <GitPullRequest className={className} />
}

function ProviderCard({
  isActive,
  onDisconnect,
  onSetActive,
  onUpdateLabel,
  provider,
}: {
  isActive: boolean
  onDisconnect: (id: string) => void
  onSetActive: (id: string) => void
  onUpdateLabel: (id: string, label: string) => void
  provider: ConnectedProvider
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState(provider.label)
  const [isConfirmingDisconnect, setIsConfirmingDisconnect] = useState(false)

  const saveLabel = () => {
    const nextLabel = draftLabel.trim()

    if (nextLabel) {
      onUpdateLabel(provider.id, nextLabel)
    } else {
      setDraftLabel(provider.label)
    }

    setIsEditing(false)
  }

  return (
    <article className="relative rounded-xl border border-terminal-700 bg-terminal-800 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <ProviderTypeIcon
            className={`mt-1 h-5 w-5 shrink-0 ${getProviderColor(provider.type)}`}
            type={provider.type}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200">
              {getProviderLabel(provider.type)}
            </p>
            {isEditing ? (
              <input
                autoFocus
                className="mt-2 h-8 w-full rounded-md border border-terminal-700 bg-terminal-950 px-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                onBlur={saveLabel}
                onChange={(event) => setDraftLabel(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    saveLabel()
                  }
                  if (event.key === "Escape") {
                    setDraftLabel(provider.label)
                    setIsEditing(false)
                  }
                }}
                value={draftLabel}
              />
            ) : (
              <button
                className="mt-1 truncate text-left text-lg font-semibold text-white hover:text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                onClick={() => setIsEditing(true)}
                type="button"
              >
                {provider.label}
              </button>
            )}
            <div className="mt-3 flex items-center gap-2">
              {provider.avatarUrl ? (
                <img
                  alt={`${provider.username ?? provider.label} avatar`}
                  className="h-6 w-6 rounded-full border border-terminal-700"
                  src={provider.avatarUrl}
                />
              ) : (
                <div className="h-6 w-6 rounded-full border border-terminal-700 bg-terminal-950" />
              )}
              <span className="text-sm text-slate-400">
                {provider.username ?? "Unknown user"}
              </span>
            </div>
          </div>
        </div>

        <span
          className={
            isActive
              ? "rounded-full border border-pipeline-success/40 bg-terminal-950 px-2.5 py-1 text-xs font-medium text-pipeline-success"
              : "rounded-full border border-terminal-700 bg-terminal-950 px-2.5 py-1 text-xs font-medium text-slate-400"
          }
        >
          {isActive ? "Active" : "Connected"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Connected{" "}
          {formatDate(provider.connectedAt)}
        </p>
        <div className="flex items-center gap-2">
          {!isActive ? (
            <Button onClick={() => onSetActive(provider.id)}>Set as active</Button>
          ) : null}
          <Button
            className="border-pipeline-failed/50 text-pipeline-failed hover:bg-pipeline-failed/10"
            onClick={() => setIsConfirmingDisconnect(true)}
          >
            Disconnect
          </Button>
        </div>
      </div>

      {isConfirmingDisconnect ? (
        <div className="absolute bottom-4 right-4 z-10 w-72 rounded-lg border border-terminal-700 bg-terminal-950 p-4 shadow-xl shadow-black/40">
          <p className="text-sm text-slate-300">
            This will remove your token from this browser. Are you sure?
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setIsConfirmingDisconnect(false)}>Cancel</Button>
            <Button
              className="border-pipeline-failed/50 text-pipeline-failed hover:bg-pipeline-failed/10"
              onClick={() => onDisconnect(provider.id)}
            >
              Disconnect
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  )
}

function AddProviderCard({
  description,
  linkHref,
  onConnect,
  title,
  type,
}: {
  description: string
  linkHref: string
  onConnect: () => void
  title: string
  type: ProviderType
}) {
  return (
    <div className="rounded-xl border border-terminal-700 bg-terminal-800 p-5 transition-colors hover:border-cyan-400/30">
      <div className="flex items-center gap-3">
        <ProviderTypeIcon className={`h-5 w-5 ${getProviderColor(type)}`} type={type} />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
      <a
        className="mt-4 inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"
        href={linkHref}
        rel="noreferrer"
        target="_blank"
      >
        Generate a token
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
      <Button
        className="mt-5 w-full border-cyan-400/60 text-cyan-400 hover:bg-cyan-400/10"
        onClick={onConnect}
      >
        Connect {getProviderLabel(type)}
      </Button>
    </div>
  )
}

export function ProvidersTab() {
  const {
    activeProvider,
    providers,
    removeProvider,
    setActiveProvider,
    updateProvider,
  } = useProviders()
  const [connectModalType, setConnectModalType] = useState<ConnectModalType>(null)
  const disconnectProvider = (provider: ConnectedProvider) => {
    removeProvider(provider.id)
    toast.info(`${provider.label} disconnected`)
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">Connected Providers</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage provider tokens stored in this browser.
          </p>
        </div>

        {providers.length === 0 ? (
          <EmptyState
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  className="border-cyan-400/60 text-cyan-400 hover:bg-cyan-400/10"
                  onClick={() => setConnectModalType("github")}
                >
                  Connect GitHub
                </Button>
                <Button
                  className="border-orange-400/60 text-orange-400 hover:bg-orange-400/10"
                  onClick={() => setConnectModalType("gitlab")}
                >
                  Connect GitLab
                </Button>
              </div>
            }
            description="Connect GitHub or GitLab to see your real pipeline data. Your tokens never leave this browser."
            icon={ShieldCheck}
            title="No providers connected"
          />
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => (
              <ProviderCard
                isActive={activeProvider?.id === provider.id}
                key={provider.id}
                onDisconnect={() => disconnectProvider(provider)}
                onSetActive={setActiveProvider}
                onUpdateLabel={(id, label) => updateProvider(id, { label })}
                provider={provider}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">Add a Provider</h2>
          <p className="mt-1 text-sm text-slate-500">
            Connect a CI provider to replace demo data with live workflow runs.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <AddProviderCard
            description="Connect via Personal Access Token. Requires repo and workflow scopes."
            linkHref="https://github.com/settings/tokens/new?scopes=repo,workflow"
            onConnect={() => setConnectModalType("github")}
            title="GitHub Actions"
            type="github"
          />
          <AddProviderCard
            description="Connect via Personal Access Token or Project Access Token."
            linkHref="https://gitlab.com/-/user_settings/personal_access_tokens"
            onConnect={() => setConnectModalType("gitlab")}
            title="GitLab CI"
            type="gitlab"
          />
        </div>
      </section>

      <ConnectGitHubModal
        onClose={() => setConnectModalType(null)}
        open={connectModalType === "github"}
      />

      <ConnectGitLabModal
        onClose={() => setConnectModalType(null)}
        open={connectModalType === "gitlab"}
      />
    </div>
  )
}
