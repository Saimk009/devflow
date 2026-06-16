import { cn } from "@/lib/utils"

import { settingsTabs } from "./settingsTabs"

type SettingsNavProps = {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function SettingsNav({ activeTab, onTabChange }: SettingsNavProps) {
  return (
    <nav aria-label="Settings sections" className="space-y-1">
      {settingsTabs.map((tab) => {
        const isActive = activeTab === tab.id

        return (
          <button
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex w-full items-center border-l-2 px-3 py-2.5 text-left text-sm font-medium transition-colors",
              isActive
                ? "border-cyan-400 bg-terminal-800 text-cyan-400"
                : "border-transparent text-slate-500 hover:bg-terminal-800 hover:text-slate-300",
            )}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
