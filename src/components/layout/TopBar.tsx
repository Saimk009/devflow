import { useIsFetching } from "@tanstack/react-query"
import { CircleHelp, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { KeyboardShortcutModal } from "@/components/ui/KeyboardShortcutModal"

import { DataSourceBadge } from "./DataSourceBadge"

type TopBarProps = {
  pipelineName?: string
}

const legendItems = [
  { label: "Success", className: "bg-pipeline-success" },
  { label: "Failed", className: "bg-pipeline-failed" },
  { label: "Running", className: "bg-pipeline-running" },
  { label: "Queued", className: "bg-pipeline-queued" },
]

export function TopBar({ pipelineName }: TopBarProps) {
  const isFetching = useIsFetching()
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false)

  useEffect(() => {
    const openShortcuts = () => setIsShortcutModalOpen(true)
    const closePanels = () => setIsShortcutModalOpen(false)

    window.addEventListener("devflow:open-shortcuts-help", openShortcuts)
    window.addEventListener("devflow:close-panel", closePanels)

    return () => {
      window.removeEventListener("devflow:open-shortcuts-help", openShortcuts)
      window.removeEventListener("devflow:close-panel", closePanels)
    }
  }, [])

  return (
    <header className="flex h-12 items-center justify-between border-b border-terminal-700 bg-terminal-900 px-4">
      <div className="font-mono text-sm text-slate-400">
        <span className="text-slate-200">Pipelines</span>
        {pipelineName ? (
          <>
            <span className="px-2 text-slate-600">/</span>
            <span>{pipelineName}</span>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {isFetching > 0 ? (
          <span
            aria-label="Refreshing pipeline data"
            className="inline-flex items-center gap-2 rounded-full border border-terminal-700 bg-terminal-800 px-2.5 py-1 text-xs text-slate-400"
            role="status"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400 motion-reduce:animate-none" />
            Syncing
          </span>
        ) : null}
        {legendItems.map((item) => (
          <span
            className="inline-flex items-center gap-2 rounded-full border border-terminal-700 bg-terminal-800 px-2.5 py-1 text-xs text-slate-400"
            key={item.label}
          >
            <span className={`h-2 w-2 rounded-full ${item.className}`} />
            {item.label}
          </span>
        ))}
        <DataSourceBadge />
        <Button
          aria-label="Open keyboard shortcuts"
          className="h-8 w-8 bg-terminal-800 p-0 text-slate-400 hover:text-cyan-400"
          onClick={() => setIsShortcutModalOpen(true)}
        >
          <CircleHelp className="h-4 w-4" />
        </Button>
      </div>
      <KeyboardShortcutModal
        onOpenChange={setIsShortcutModalOpen}
        open={isShortcutModalOpen}
      />
    </header>
  )
}
