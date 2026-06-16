import { useProviderStore } from "@/stores/providerStore"

export function useProviders() {
  const providers = useProviderStore((state) => state.providers)
  const activeProviderId = useProviderStore((state) => state.activeProviderId)
  const addProvider = useProviderStore((state) => state.addProvider)
  const removeProvider = useProviderStore((state) => state.removeProvider)
  const updateProvider = useProviderStore((state) => state.updateProvider)
  const setActiveProvider = useProviderStore((state) => state.setActiveProvider)
  const hasAnyProvider = useProviderStore((state) => state.hasAnyProvider)
  const resetProviders = useProviderStore((state) => state.resetProviders)
  const activeProvider =
    providers.find((provider) => provider.id === activeProviderId) ?? null

  return {
    providers,
    activeProvider,
    addProvider,
    removeProvider,
    updateProvider,
    setActiveProvider,
    hasAnyProvider,
    resetProviders,
  }
}
