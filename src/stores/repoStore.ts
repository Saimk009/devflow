import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import type { ProviderType } from "@/types"

export interface PinnedRepo {
  id: string
  name: string
  providerId: string
  providerType: ProviderType
  pinnedAt: string
  avatarUrl?: string
  isPrivate: boolean
  defaultBranch: string
}

interface RepoStore {
  pinnedRepos: PinnedRepo[]
  pinRepo: (repo: Omit<PinnedRepo, "id" | "pinnedAt">) => void
  unpinRepo: (id: string) => void
  isPinned: (name: string, providerId: string) => boolean
  resetPinnedRepos: () => void
}

export const useRepoStore = create<RepoStore>()(
  persist(
    (set, get) => ({
      pinnedRepos: [],
      pinRepo: (repo) =>
        set((state) => {
          const exists = state.pinnedRepos.some(
            (pinnedRepo) =>
              pinnedRepo.name === repo.name &&
              pinnedRepo.providerId === repo.providerId,
          )

          if (exists) {
            return state
          }

          return {
            pinnedRepos: [
              ...state.pinnedRepos,
              {
                ...repo,
                id: crypto.randomUUID(),
                pinnedAt: new Date().toISOString(),
              },
            ],
          }
        }),
      unpinRepo: (id) =>
        set((state) => ({
          pinnedRepos: state.pinnedRepos.filter((repo) => repo.id !== id),
        })),
      isPinned: (name, providerId) =>
        get().pinnedRepos.some(
          (repo) => repo.name === name && repo.providerId === providerId,
        ),
      resetPinnedRepos: () => set({ pinnedRepos: [] }),
    }),
    {
      name: "devflow_pinned_repos",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
