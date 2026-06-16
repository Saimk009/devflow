import { parseAsString, useQueryState } from "nuqs"
import { useCallback } from "react"

import { usePinnedRepos, type PinnedRepo } from "@/hooks/usePinnedRepos"
import { useProviders } from "@/hooks/useProviders"
import type { GitHubProvider, GitLabProvider } from "@/types"

type RepoContext = {
  selectedRepo: string | null
  setSelectedRepo: (repo: string | null) => void
  pinnedRepos: PinnedRepo[]
  activeProvider: GitHubProvider | GitLabProvider | null
  isMockMode: boolean
}

export function useRepoContext(): RepoContext {
  const [selectedRepo, setRepoParam] = useQueryState("repo", parseAsString)
  const { pinnedRepos } = usePinnedRepos()
  const { activeProvider } = useProviders()
  const setSelectedRepo = useCallback(
    (repo: string | null) => {
      void setRepoParam(repo)
    },
    [setRepoParam],
  )

  return {
    selectedRepo,
    setSelectedRepo,
    pinnedRepos,
    activeProvider,
    isMockMode: activeProvider === null,
  }
}
