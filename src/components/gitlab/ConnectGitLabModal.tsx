import { useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, ExternalLink, GitFork, Loader2, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useProviders } from "@/hooks/useProviders"
import { validateGitLabToken } from "@/lib/gitlabApi"
import { toast } from "@/lib/toast"
import type { GitLabProvider } from "@/types"

type ConnectGitLabModalProps = {
  open: boolean
  onClose: () => void
}

type GitLabUser = {
  avatarUrl?: string
  email?: string | null
  name?: string
  username: string
}

const cloudBaseUrl = "https://gitlab.com"

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/u, "")

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

export function ConnectGitLabModal({ onClose, open }: ConnectGitLabModalProps) {
  const queryClient = useQueryClient()
  const { addProvider } = useProviders()
  const [step, setStep] = useState<1 | 2>(1)
  const [isSelfHosted, setIsSelfHosted] = useState(false)
  const [baseUrl, setBaseUrl] = useState(cloudBaseUrl)
  const [baseUrlError, setBaseUrlError] = useState<string | null>(null)
  const [token, setToken] = useState("")
  const [label, setLabel] = useState("")
  const [user, setUser] = useState<GitLabUser | null>(null)
  const [version, setVersion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  if (!open) {
    return null
  }

  const resolvedBaseUrl = normalizeBaseUrl(isSelfHosted ? baseUrl : cloudBaseUrl)
  const tokenUrl = `${resolvedBaseUrl}/-/user_settings/personal_access_tokens`

  const resetAndClose = () => {
    setStep(1)
    setIsSelfHosted(false)
    setBaseUrl(cloudBaseUrl)
    setBaseUrlError(null)
    setToken("")
    setLabel("")
    setUser(null)
    setVersion(null)
    setError(null)
    setIsValidating(false)
    onClose()
  }

  const validateBaseUrl = () => {
    if (!isSelfHosted) {
      setBaseUrlError(null)
      return true
    }

    if (!isValidUrl(baseUrl)) {
      setBaseUrlError("Enter a valid GitLab instance URL.")
      return false
    }

    setBaseUrlError(null)
    return true
  }

  const validateToken = async () => {
    if (!validateBaseUrl()) {
      return
    }

    setError(null)
    setIsValidating(true)

    try {
      const result = await validateGitLabToken(token, resolvedBaseUrl)

      setUser(result.user)
      setVersion(isSelfHosted ? result.gitLabVersion ?? null : null)
      setLabel(`${result.user.username}'s GitLab`)
      setStep(2)
    } catch {
      setError("Invalid token or insufficient scopes. Check your token and try again.")
    } finally {
      setIsValidating(false)
    }
  }

  const connectProvider = () => {
    if (!user) {
      return
    }

    const provider: GitLabProvider = {
      id: "",
      type: "gitlab",
      label: label.trim() || `${user.username}'s GitLab`,
      connectedAt: new Date().toISOString(),
      avatarUrl: user.avatarUrl,
      username: user.username,
      token,
      baseUrl: resolvedBaseUrl,
    }

    addProvider(provider)
    void queryClient.invalidateQueries()
    toast.success("GitLab connected — fetching your repositories...")
    resetAndClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-lg rounded-xl border border-terminal-700 bg-terminal-900 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <GitFork className="h-5 w-5 text-orange-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Connect GitLab CI</h2>
              <p className="mt-1 text-sm text-slate-500">Step {step} of 2</p>
            </div>
          </div>
          <Button
            aria-label="Close GitLab connection modal"
            className="h-8 w-8 bg-terminal-950 p-0"
            onClick={resetAndClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6">
          {step === 1 ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-terminal-700 bg-terminal-950 p-1">
                <button
                  className={
                    !isSelfHosted
                      ? "rounded-md bg-terminal-800 px-3 py-2 text-sm font-medium text-cyan-400"
                      : "rounded-md px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-300"
                  }
                  onClick={() => {
                    setIsSelfHosted(false)
                    setBaseUrl(cloudBaseUrl)
                    setBaseUrlError(null)
                  }}
                  type="button"
                >
                  GitLab.com (Cloud)
                </button>
                <button
                  className={
                    isSelfHosted
                      ? "rounded-md bg-terminal-800 px-3 py-2 text-sm font-medium text-cyan-400"
                      : "rounded-md px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-300"
                  }
                  onClick={() => setIsSelfHosted(true)}
                  type="button"
                >
                  Self-hosted GitLab
                </button>
              </div>

              {isSelfHosted ? (
                <div className="space-y-2">
                  <Label htmlFor="gitlab-base-url">GitLab instance URL</Label>
                  <Input
                    id="gitlab-base-url"
                    onBlur={validateBaseUrl}
                    onChange={(event) => setBaseUrl(event.target.value)}
                    placeholder="https://gitlab.mycompany.com"
                    value={baseUrl}
                  />
                  {baseUrlError ? (
                    <p className="text-xs text-pipeline-failed">{baseUrlError}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="gitlab-token">Personal Access Token</Label>
                <Input
                  autoFocus
                  className="font-mono"
                  id="gitlab-token"
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="glpat-xxxxxxxxxxxx"
                  type="password"
                  value={token}
                />
                <p className="text-xs leading-5 text-slate-500">
                  Required scopes: read_api, read_user, read_repository
                </p>
              </div>

              <a
                className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"
                href={tokenUrl}
                rel="noreferrer"
                target="_blank"
              >
                Generate token
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              {error ? (
                <p className="rounded-md border border-pipeline-failed/40 bg-pipeline-failed/10 px-3 py-2 text-sm text-pipeline-failed">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end">
                <Button
                  className="border-cyan-400/60 text-cyan-400 hover:bg-cyan-400/10"
                  disabled={!token.trim() || Boolean(baseUrlError) || isValidating}
                  onClick={() => void validateToken()}
                >
                  {isValidating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
                  ) : null}
                  Next
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {user ? (
                <div className="flex items-center gap-3 rounded-lg border border-terminal-700 bg-terminal-950 p-3">
                  {user.avatarUrl ? (
                    <img
                      alt={`${user.username} avatar`}
                      className="h-10 w-10 rounded-full border border-terminal-700"
                      src={user.avatarUrl}
                    />
                  ) : null}
                  <div>
                    <p className="font-medium text-slate-200">{user.username}</p>
                    <p className="text-sm text-slate-500">{resolvedBaseUrl}</p>
                    {version ? (
                      <p className="text-xs text-slate-600">GitLab {version}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  Confirmed scopes
                </p>
                <div className="flex flex-wrap gap-2">
                  {["read_api", "read_user", "read_repository"].map((scope) => (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-pipeline-success/40 bg-terminal-950 px-2.5 py-1 text-xs text-pipeline-success"
                      key={scope}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {scope}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gitlab-label">Label for this connection</Label>
                <Input
                  id="gitlab-label"
                  onChange={(event) => setLabel(event.target.value)}
                  value={label}
                />
              </div>

              <div className="flex justify-between gap-3">
                <Button onClick={() => setStep(1)}>Back</Button>
                <Button
                  className="border-cyan-400/60 text-cyan-400 hover:bg-cyan-400/10"
                  onClick={connectProvider}
                >
                  Connect
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
