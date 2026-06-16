import { Check, ChevronDown, Database, GitFork, GitPullRequest } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useProviders } from "@/hooks/useProviders"
import { useRepoContext } from "@/hooks/useRepoContext"
import { toast } from "@/lib/toast"
import {
  getProviderColor,
  getProviderLabel,
} from "@/lib/providerUtils"
import { cn } from "@/lib/utils"
import type { ProviderType } from "@/types"

function ProviderIcon({
  className,
  type,
}: {
  className?: string
  type: ProviderType
}) {
  if (type === "github") {
    return <GitPullRequest className={className} />
  }

  if (type === "gitlab") {
    return <GitFork className={className} />
  }

  return <Database className={className} />
}

export function DataSourceBadge() {
  const navigate = useNavigate()
  const { selectedRepo } = useRepoContext()
  const { activeProvider, providers, removeProvider, setActiveProvider } =
    useProviders()
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closePopover = () => setIsOpen(false)
    const handlePointerDown = (event: PointerEvent) => {
      if (
        popoverRef.current &&
        event.target instanceof Node &&
        !popoverRef.current.contains(event.target)
      ) {
        closePopover()
      }
    }

    window.addEventListener("devflow:close-panel", closePopover)
    window.addEventListener("pointerdown", handlePointerDown)

    return () => {
      window.removeEventListener("devflow:close-panel", closePopover)
      window.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [])

  if (!activeProvider) {
    return (
      <Button
        className="h-8 border-amber-400/40 bg-amber-400/10 px-2.5 text-amber-300 hover:bg-amber-400/15"
        onClick={() => navigate("/settings?tab=providers")}
        title="You're viewing demo data. Connect a provider in Settings to see real pipelines."
      >
        <Database className="mr-2 h-3.5 w-3.5" />
        Demo Data
      </Button>
    )
  }

  const activeLabel = activeProvider.username ?? activeProvider.label

  return (
    <div className="relative" ref={popoverRef}>
      <Button
        aria-expanded={isOpen}
        className="h-8 border-pipeline-success/40 bg-pipeline-success/10 px-2.5 text-pipeline-success hover:bg-pipeline-success/15"
        onClick={() => setIsOpen((open) => !open)}
      >
        <ProviderIcon className="mr-2 h-3.5 w-3.5" type={activeProvider.type} />
        <span className="max-w-28 truncate">{activeLabel}</span>
        {selectedRepo ? (
          <span className="ml-2 max-w-32 truncate border-l border-pipeline-success/30 pl-2 text-xs text-slate-300">
            {selectedRepo}
          </span>
        ) : null}
        <ChevronDown
          className={cn("ml-2 h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
        />
      </Button>

      {isOpen ? (
        <div className="absolute right-0 top-10 z-50 w-72 overflow-hidden rounded-xl border border-terminal-700 bg-terminal-900 shadow-2xl shadow-black/40">
          <div className="border-b border-terminal-700 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              Data source
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto p-2">
            {providers.map((provider) => {
              const isActive = provider.id === activeProvider.id

              return (
                <button
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-terminal-800"
                  key={provider.id}
                  onClick={() => {
                    setActiveProvider(provider.id)
                    setIsOpen(false)
                  }}
                  type="button"
                >
                  <ProviderIcon
                    className={cn("h-4 w-4", getProviderColor(provider.type))}
                    type={provider.type}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-slate-200">
                      {provider.label}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {getProviderLabel(provider.type)}
                      {provider.username ? ` · ${provider.username}` : ""}
                    </span>
                  </span>
                  {isActive ? <Check className="h-4 w-4 text-pipeline-success" /> : null}
                </button>
              )
            })}

            <button
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-amber-300 transition hover:bg-terminal-800"
              onClick={() => {
                setActiveProvider(null)
                setIsOpen(false)
              }}
              type="button"
            >
              <Database className="h-4 w-4" />
              Demo Data
            </button>
          </div>

          <div className="space-y-1 border-t border-terminal-700 p-2">
            <Link
              className="block rounded-lg px-3 py-2 text-sm text-cyan-400 transition hover:bg-terminal-800"
              onClick={() => setIsOpen(false)}
              to="/settings?tab=providers"
            >
              Manage providers →
            </Link>
            <button
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-pipeline-failed transition hover:bg-terminal-800"
              onClick={() => {
                const label = activeProvider.label
                removeProvider(activeProvider.id)
                setIsOpen(false)
                toast.info(`${label} disconnected`)
              }}
              type="button"
            >
              Disconnect {activeProvider.label}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
