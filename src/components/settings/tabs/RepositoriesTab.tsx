import { CheckCircle2, Lock, Search, Unlock, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { EmptyState } from "@/components/ui/EmptyState"
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
import { usePinnedRepos } from "@/hooks/usePinnedRepos"
import { useProviders } from "@/hooks/useProviders"
import { listUserRepos } from "@/lib/githubApi"
import { listProjects } from "@/lib/gitlabApi"
import { formatDate } from "@/lib/formatDate"
import { getProviderColor, getProviderLabel } from "@/lib/providerUtils"
import { mockPipelines } from "@/mock"
import type { GitHubProvider, GitLabProvider, ProviderType } from "@/types"

type ProviderOption = {
  id: string
  type: ProviderType
  label: string
  provider: GitHubProvider | GitLabProvider | null
}

type RepoSearchResult = {
  name: string
  providerId: string
  providerType: ProviderType
  avatarUrl?: string
  isPrivate: boolean
  defaultBranch: string
  lastPushedAt?: string
}

const mockProviderId = "mock"

const mockRepos: RepoSearchResult[] = Array.from(
  new Set(mockPipelines.map((pipeline) => pipeline.repoName)),
).map((name, index) => ({
  name,
  providerId: mockProviderId,
  providerType: "mock",
  avatarUrl: `https://i.pravatar.cc/40?u=${encodeURIComponent(name)}`,
  isPrivate: index % 2 === 0,
  defaultBranch: "main",
  lastPushedAt: mockPipelines.find((pipeline) => pipeline.repoName === name)?.triggeredAt,
}))

const normalizeGitLabBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/u, "")

async function searchProviderRepos(
  providerOption: ProviderOption,
  search: string,
): Promise<RepoSearchResult[]> {
  const normalizedSearch = search.trim().toLowerCase()

  if (providerOption.provider === null) {
    return mockRepos.filter((repo) =>
      repo.name.toLowerCase().includes(normalizedSearch),
    )
  }

  if (providerOption.provider.type === "github") {
    const repos = await listUserRepos(providerOption.provider.token, { per_page: 100 })

    return repos
      .filter((repo) => repo.fullName.toLowerCase().includes(normalizedSearch))
      .map((repo) => ({
        name: repo.fullName,
        providerId: providerOption.provider?.id ?? "",
        providerType: "github",
        avatarUrl: repo.avatarUrl,
        isPrivate: repo.private,
        defaultBranch: repo.defaultBranch,
      }))
  }

  const baseUrl = normalizeGitLabBaseUrl(providerOption.provider.baseUrl)
  const projects = await listProjects(providerOption.provider.token, baseUrl, {
    membership: true,
    per_page: 100,
    search,
  })

  return projects.map((project) => ({
    name: project.pathWithNamespace,
    providerId: providerOption.provider?.id ?? "",
    providerType: "gitlab",
    avatarUrl: project.avatarUrl,
    isPrivate: project.visibility !== "public",
    defaultBranch: project.defaultBranch,
  }))
}

export function RepositoriesTab() {
  const { providers } = useProviders()
  const { isPinned, pinRepo, pinnedRepos, unpinRepo } = usePinnedRepos()
  const providerOptions = useMemo<ProviderOption[]>(
    () => [
      {
        id: mockProviderId,
        type: "mock",
        label: "Demo Data",
        provider: null,
      },
      ...providers.map((provider) => ({
        id: provider.id,
        type: provider.type,
        label: provider.label,
        provider,
      })),
    ],
    [providers],
  )
  const [selectedProviderId, setSelectedProviderId] = useState(mockProviderId)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [results, setResults] = useState<RepoSearchResult[]>(mockRepos)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedProvider =
    providerOptions.find((provider) => provider.id === selectedProviderId) ??
    providerOptions[0]

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [search])

  useEffect(() => {
    let isMounted = true

    const searchRepos = async () => {
      setIsSearching(true)
      setError(null)

      try {
        const nextResults = await searchProviderRepos(selectedProvider, debouncedSearch)

        if (isMounted) {
          setResults(nextResults)
        }
      } catch {
        if (isMounted) {
          setError("Unable to search repositories for this provider.")
          setResults([])
        }
      } finally {
        if (isMounted) {
          setIsSearching(false)
        }
      }
    }

    void searchRepos()

    return () => {
      isMounted = false
    }
  }, [debouncedSearch, selectedProvider])

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">Pinned Repositories</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pin repositories you care about for quick pipeline filtering.
          </p>
        </div>

        {pinnedRepos.length === 0 ? (
          <EmptyState
            description="No repositories pinned. Add repos below to quickly filter your pipelines."
            icon={Search}
            title="No repositories pinned"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            {pinnedRepos.map((repo) => (
              <article
                className="relative rounded-xl border border-terminal-700 bg-terminal-800 p-4"
                key={repo.id}
              >
                <Button
                  aria-label={`Unpin ${repo.name}`}
                  className="absolute right-3 top-3 h-8 w-8 bg-terminal-950 p-0"
                  onClick={() => unpinRepo(repo.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="pr-10">
                  <h3 className="truncate text-base font-semibold text-white">
                    {repo.name}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border border-terminal-700 bg-terminal-950 px-2 py-1 text-xs ${getProviderColor(repo.providerType)}`}>
                      {getProviderLabel(repo.providerType)}
                    </span>
                    <span className="rounded-full border border-terminal-700 bg-terminal-950 px-2 py-1 text-xs text-slate-400">
                      {repo.isPrivate ? "Private" : "Public"}
                    </span>
                  </div>
                  <p className="mt-3 inline-flex rounded-md border border-terminal-700 bg-terminal-950 px-2 py-1 font-mono text-xs text-slate-400">
                    Default branch: {repo.defaultBranch}
                  </p>
                  <Link
                    className="mt-4 inline-flex text-sm text-cyan-400 hover:text-cyan-300"
                    to={`/pipelines?repo=${encodeURIComponent(repo.name)}`}
                  >
                    View pipelines →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white">Add Repository</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search your provider repositories and pin the ones you use most.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="space-y-2">
            <Label htmlFor="repo-provider">Provider</Label>
            <Select
              onValueChange={setSelectedProviderId}
              value={selectedProviderId}
            >
              <SelectTrigger id="repo-provider">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {providerOptions.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="repo-search">Search repositories</Label>
            <Input
              id="repo-search"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search repositories..."
              value={search}
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-terminal-700 bg-terminal-800">
          {error ? (
            <p className="p-4 text-sm text-pipeline-failed">{error}</p>
          ) : null}
          {isSearching ? (
            <p className="p-4 text-sm text-slate-500">Searching repositories...</p>
          ) : null}
          {!isSearching && results.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No repositories found.</p>
          ) : null}
          {!isSearching && results.length > 0 ? (
            <div className="divide-y divide-terminal-700">
              {results.map((repo) => {
                const repoIsPinned = isPinned(repo.name, repo.providerId)

                return (
                  <div
                    className="flex flex-wrap items-center justify-between gap-4 p-4"
                    key={`${repo.providerId}:${repo.name}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {repo.avatarUrl ? (
                        <img
                          alt={`${repo.name} avatar`}
                          className="h-8 w-8 rounded-full border border-terminal-700"
                          src={repo.avatarUrl}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full border border-terminal-700 bg-terminal-950" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-200">
                          {repo.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            {repo.isPrivate ? (
                              <Lock className="h-3 w-3" />
                            ) : (
                              <Unlock className="h-3 w-3" />
                            )}
                            {repo.isPrivate ? "Private" : "Public"}
                          </span>
                          <span>Branch {repo.defaultBranch}</span>
                          {repo.lastPushedAt ? (
                            <span>
                              Pushed{" "}
                              {formatDate(repo.lastPushedAt)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {repoIsPinned ? (
                      <span className="inline-flex items-center gap-2 text-sm text-pipeline-success">
                        <CheckCircle2 className="h-4 w-4" />
                        Pinned
                      </span>
                    ) : (
                      <Button
                        className="border-cyan-400/60 text-cyan-400 hover:bg-cyan-400/10"
                        onClick={() =>
                          pinRepo({
                            name: repo.name,
                            providerId: repo.providerId,
                            providerType: repo.providerType,
                            avatarUrl: repo.avatarUrl,
                            isPrivate: repo.isPrivate,
                            defaultBranch: repo.defaultBranch,
                          })
                        }
                      >
                        Pin
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
