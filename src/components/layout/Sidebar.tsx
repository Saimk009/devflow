import {
  ChevronDown,
  GitBranch,
  GitPullRequest,
  Server,
  Settings as SettingsIcon,
  Workflow,
} from "lucide-react"
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"

import { usePinnedRepos } from "@/hooks/usePinnedRepos"
import { useProviders } from "@/hooks/useProviders"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Pipelines", icon: Workflow, path: "/pipelines" },
  { label: "Workflows", icon: GitBranch, path: "/workflows" },
  { label: "Repositories", icon: GitBranch, path: "#" },
  { label: "Runners", icon: Server, path: "/runners" },
  { label: "Settings", icon: SettingsIcon, path: "/settings" },
]

const preservesRepoParam = (path: string) =>
  path === "/pipelines" || path === "/workflows" || path === "/runners"

export function Sidebar() {
  const location = useLocation()
  const { pinnedRepos } = usePinnedRepos()
  const { providers } = useProviders()
  const [repositoriesExpanded, setRepositoriesExpanded] = useState(
    pinnedRepos.length > 0,
  )

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-[240px] flex-col border-r border-terminal-700 bg-terminal-900">
      <div className="flex h-12 items-center gap-2 border-b border-terminal-700 px-4 font-mono text-lg font-semibold text-cyan-400">
        <GitBranch className="h-5 w-5" />
        DevFlow
      </div>

      <nav aria-label="Main navigation" className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isRepositoriesItem = item.label === "Repositories"
          const isActive =
            item.path !== "#" && location.pathname.startsWith(item.path)

          if (isRepositoriesItem) {
            return (
              <div key={item.label}>
                <button
                  aria-expanded={repositoriesExpanded}
                  className="flex w-full items-center gap-3 border-l-2 border-transparent px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-terminal-800 hover:text-slate-300"
                  onClick={() => setRepositoriesExpanded((expanded) => !expanded)}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      repositoriesExpanded && "rotate-180",
                    )}
                  />
                </button>
                {repositoriesExpanded && pinnedRepos.length > 0 ? (
                  <div className="ml-6 mt-1 space-y-1">
                    {pinnedRepos.map((repo) => (
                      <Link
                        className="block truncate rounded-md px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-terminal-800 hover:text-cyan-400"
                        key={repo.id}
                        to={`/pipelines?repo=${encodeURIComponent(repo.name)}`}
                      >
                        {repo.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          }

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              aria-disabled={item.path === "#"}
              className={
                isActive
                  ? "flex items-center gap-3 border-l-2 border-cyan-400 bg-terminal-800 px-3 py-2.5 text-sm font-medium text-cyan-400"
                  : "flex items-center gap-3 border-l-2 border-transparent px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-terminal-800 hover:text-slate-300"
              }
              key={item.label}
              to={
                preservesRepoParam(item.path)
                  ? `${item.path}${location.search}`
                  : item.path
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {providers.length === 0 ? (
        <div className="border-t border-terminal-700 p-3">
          <Link
            className="flex w-full items-center justify-center gap-2 rounded-md border border-cyan-400/70 px-3 py-2 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-400/10"
            to="/settings?tab=providers"
          >
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse motion-reduce:animate-none" />
            <GitPullRequest className="h-4 w-4" />
            Connect a Provider
          </Link>
        </div>
      ) : null}
    </aside>
  )
}
