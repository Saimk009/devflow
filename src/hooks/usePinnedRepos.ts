import { useRepoStore, type PinnedRepo } from "@/stores/repoStore"

export function usePinnedRepos() {
  const pinnedRepos = useRepoStore((state) => state.pinnedRepos)
  const pinRepo = useRepoStore((state) => state.pinRepo)
  const unpinRepo = useRepoStore((state) => state.unpinRepo)
  const isPinned = useRepoStore((state) => state.isPinned)
  const resetPinnedRepos = useRepoStore((state) => state.resetPinnedRepos)

  return {
    pinnedRepos,
    pinRepo,
    unpinRepo,
    isPinned,
    resetPinnedRepos,
  }
}

export type { PinnedRepo }
