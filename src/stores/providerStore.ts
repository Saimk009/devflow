import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import type { GitHubProvider, GitLabProvider } from "@/types"

type ConnectedProvider = GitHubProvider | GitLabProvider

interface ProviderStore {
  providers: ConnectedProvider[]
  activeProviderId: string | null
  addProvider: (provider: ConnectedProvider) => void
  removeProvider: (id: string) => void
  updateProvider: (id: string, updates: Partial<ConnectedProvider>) => void
  setActiveProvider: (id: string | null) => void
  getProvider: (id: string) => ConnectedProvider | undefined
  hasAnyProvider: () => boolean
  resetProviders: () => void
}

export const useProviderStore = create<ProviderStore>()(
  persist(
    (set, get) => ({
      providers: [],
      activeProviderId: null,
      addProvider: (provider) =>
        set((state) => {
          // Token stored in user's own localStorage. DevFlow never sends tokens to any server.
          const nextProvider = {
            ...provider,
            id: crypto.randomUUID(),
          }

          return {
            providers: [...state.providers, nextProvider],
            activeProviderId: state.activeProviderId ?? nextProvider.id,
          }
        }),
      removeProvider: (id) =>
        set((state) => {
          const providers = state.providers.filter((provider) => provider.id !== id)
          const activeProviderId =
            state.activeProviderId === id
              ? (providers[0]?.id ?? null)
              : state.activeProviderId

          return {
            providers,
            activeProviderId,
          }
        }),
      updateProvider: (id, updates) =>
        set((state) => ({
          providers: state.providers.map((provider) =>
            provider.id === id
              ? ({ ...provider, ...updates } as ConnectedProvider)
              : provider,
          ),
        })),
      setActiveProvider: (id) => set({ activeProviderId: id }),
      getProvider: (id) =>
        get().providers.find((provider) => provider.id === id),
      hasAnyProvider: () => get().providers.length > 0,
      resetProviders: () =>
        set({
          providers: [],
          activeProviderId: null,
        }),
    }),
    {
      name: "devflow_providers",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
