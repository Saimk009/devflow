import { CheckCircle2, ExternalLink, GitPullRequest, Loader2, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useProviders } from "@/hooks/useProviders"
import { validateGitHubToken } from "@/lib/githubApi"
import { toast } from "@/lib/toast"
import type { GitHubProvider } from "@/types"

type ConnectGitHubModalProps = {
  open: boolean
  onClose: () => void
}

type GitHubUser = {
  avatarUrl?: string
  email?: string | null
  login: string
  name?: string
}

const tokenUrl =
  "https://github.com/settings/tokens/new?scopes=repo,workflow,read:org"

export function ConnectGitHubModal({ onClose, open }: ConnectGitHubModalProps) {
  const { addProvider } = useProviders()
  const [step, setStep] = useState<1 | 2>(1)
  const [token, setToken] = useState("")
  const [label, setLabel] = useState("")
  const [scopes, setScopes] = useState<string[]>([])
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  if (!open) {
    return null
  }

  const resetAndClose = () => {
    setStep(1)
    setToken("")
    setLabel("")
    setScopes([])
    setUser(null)
    setError(null)
    setIsValidating(false)
    onClose()
  }

  const validateToken = async () => {
    setError(null)
    setIsValidating(true)

    try {
      const result = await validateGitHubToken(token)

      setUser(result.user)
      setScopes(result.scopes)
      setLabel(`${result.user.login}'s GitHub`)
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

    const provider: GitHubProvider = {
      id: "",
      type: "github",
      label: label.trim() || `${user.login}'s GitHub`,
      connectedAt: new Date().toISOString(),
      avatarUrl: user.avatarUrl,
      username: user.login,
      token,
      scopes,
    }

    addProvider(provider)
    toast.success("GitHub connected — fetching your repositories...")
    resetAndClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-lg rounded-xl border border-terminal-700 bg-terminal-900 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <GitPullRequest className="h-5 w-5 text-slate-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">
                Connect GitHub Actions
              </h2>
              <p className="mt-1 text-sm text-slate-500">Step {step} of 2</p>
            </div>
          </div>
          <Button
            aria-label="Close GitHub connection modal"
            className="h-8 w-8 bg-terminal-950 p-0"
            onClick={resetAndClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6">
          {step === 1 ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="github-token">Personal Access Token</Label>
                <Input
                  autoFocus
                  className="font-mono"
                  id="github-token"
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  type="password"
                  value={token}
                />
                <p className="text-xs leading-5 text-slate-500">
                  Required scopes: repo, workflow, read:org (optional for org runners)
                </p>
              </div>

              <a
                className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"
                href={tokenUrl}
                rel="noreferrer"
                target="_blank"
              >
                Generate token on GitHub
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
                  disabled={!token.trim() || isValidating}
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
                      alt={`${user.login} avatar`}
                      className="h-10 w-10 rounded-full border border-terminal-700"
                      src={user.avatarUrl}
                    />
                  ) : null}
                  <div>
                    <p className="font-medium text-slate-200">{user.login}</p>
                    <p className="text-sm text-slate-500">
                      {user.email ?? "No public email"}
                    </p>
                  </div>
                </div>
              ) : null}

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  Confirmed scopes
                </p>
                <div className="flex flex-wrap gap-2">
                  {(scopes.length > 0 ? scopes : ["repo", "workflow"]).map((scope) => (
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
                <Label htmlFor="github-label">Label for this connection</Label>
                <Input
                  id="github-label"
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
