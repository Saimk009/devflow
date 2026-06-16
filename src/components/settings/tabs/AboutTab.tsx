import { ExternalLink, ShieldCheck, Trash2, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { usePinnedRepos } from "@/hooks/usePinnedRepos"
import { useProviders } from "@/hooks/useProviders"
import { GITHUB_REPO_URL } from "@/lib/constants"

import pkg from "../../../../package.json"

const shortcuts = [
  ["G then P", "Go to Pipelines"],
  ["G then W", "Go to Workflows"],
  ["G then R", "Go to Runners"],
  ["G then S", "Go to Settings"],
  ["/", "Focus search"],
  ["Escape", "Close panel / modal"],
  ["R", "Refresh current data"],
  ["?", "Show this shortcut list"],
]

const privacyPoints = [
  "Your tokens are stored only in this browser's localStorage and never sent to any server.",
  "DevFlow makes API calls directly from your browser to GitHub and GitLab.",
  "No analytics, no telemetry, no accounts required.",
]

function ClearDataDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-md rounded-xl border border-pipeline-failed/50 bg-terminal-900 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Clear all local data?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              This action deletes exactly these local browser records:
            </p>
          </div>
          <Button
            aria-label="Cancel clear data"
            className="h-8 w-8 bg-terminal-950 p-0"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          <li>Tokens</li>
          <li>Pinned repos</li>
          <li>Preferences</li>
        </ul>
        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            className="border-pipeline-failed/60 text-pipeline-failed hover:bg-pipeline-failed/10"
            onClick={onConfirm}
          >
            Clear all local data
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AboutTab() {
  const { resetProviders } = useProviders()
  const { resetPinnedRepos } = usePinnedRepos()
  const [isConfirmingClear, setIsConfirmingClear] = useState(false)

  const clearAllData = () => {
    localStorage.clear()
    resetProviders()
    resetPinnedRepos()
    window.location.assign("/sdk")
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-terminal-700 bg-terminal-800 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">DevFlow</h2>
            <p className="mt-1 text-sm text-slate-400">Version {pkg.version}</p>
          </div>
          <span className="rounded-full border border-pipeline-success/40 bg-terminal-950 px-3 py-1 text-xs font-medium text-pipeline-success">
            Open Source - MIT License
          </span>
        </div>
        <a
          className="mt-5 inline-flex h-9 items-center justify-center rounded-md border border-cyan-400/60 bg-terminal-900 px-3 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-400/10"
          href={GITHUB_REPO_URL}
          rel="noreferrer"
          target="_blank"
        >
          View on GitHub
          <ExternalLink className="ml-2 h-4 w-4" />
        </a>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">Your Data</h2>
        <div className="mt-4 space-y-3">
          {privacyPoints.map((point) => (
            <div
              className="flex gap-3 rounded-lg border border-terminal-700 bg-terminal-800 p-3 text-sm text-slate-300"
              key={point}
            >
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
              <p>{point}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-terminal-700 bg-terminal-800 p-5">
        <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-terminal-700">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-terminal-700">
              {shortcuts.map(([shortcut, action]) => (
                <tr key={shortcut}>
                  <td className="w-36 bg-terminal-950 px-3 py-2">
                    <kbd className="rounded border border-terminal-700 bg-terminal-900 px-2 py-1 font-mono text-xs text-slate-200">
                      {shortcut}
                    </kbd>
                  </td>
                  <td className="px-3 py-2 text-slate-400">{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-pipeline-failed/50 bg-pipeline-failed/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-pipeline-failed">
              Danger Zone
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Remove tokens, pinned repositories, and appearance preferences from
              this browser.
            </p>
          </div>
          <Button
            className="border-pipeline-failed/60 text-pipeline-failed hover:bg-pipeline-failed/10"
            onClick={() => setIsConfirmingClear(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All Local Data
          </Button>
        </div>
      </section>

      {isConfirmingClear ? (
        <ClearDataDialog
          onCancel={() => setIsConfirmingClear(false)}
          onConfirm={clearAllData}
        />
      ) : null}
    </div>
  )
}
