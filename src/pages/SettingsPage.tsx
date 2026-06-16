import { useSearchParams } from "react-router-dom"

import { SettingsShell } from "@/components/settings/SettingsShell"
import { settingsTabs } from "@/components/settings/settingsTabs"
import { AboutTab } from "@/components/settings/tabs/AboutTab"
import { AppearanceTab } from "@/components/settings/tabs/AppearanceTab"
import { ProvidersTab } from "@/components/settings/tabs/ProvidersTab"
import { RepositoriesTab } from "@/components/settings/tabs/RepositoriesTab"

const defaultTab = "providers"

function getSafeTab(tab: string | null) {
  return settingsTabs.some((item) => item.id === tab) ? tab ?? defaultTab : defaultTab
}

function renderTab(activeTab: string) {
  if (activeTab === "repositories") {
    return <RepositoriesTab />
  }

  if (activeTab === "appearance") {
    return <AppearanceTab />
  }

  if (activeTab === "about") {
    return <AboutTab />
  }

  return <ProvidersTab />
}

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = getSafeTab(searchParams.get("tab"))

  const handleTabChange = (tab: string) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)
      nextParams.set("tab", tab)
      return nextParams
    })
  }

  return (
    <section className="h-full overflow-auto p-6">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
          Settings
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-white">
          Workspace settings
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage providers, repositories, appearance, and project information.
        </p>
      </div>

      <SettingsShell activeTab={activeTab} onTabChange={handleTabChange}>
        {renderTab(activeTab)}
      </SettingsShell>
    </section>
  )
}
