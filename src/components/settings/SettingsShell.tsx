import type { ReactNode } from "react"

import { SettingsNav } from "./SettingsNav"

type SettingsShellProps = {
  activeTab: string
  children: ReactNode
  onTabChange: (tab: string) => void
}

export function SettingsShell({
  activeTab,
  children,
  onTabChange,
}: SettingsShellProps) {
  return (
    <div className="grid gap-6 md:grid-cols-[160px_1fr]">
      <SettingsNav activeTab={activeTab} onTabChange={onTabChange} />
      <section className="min-h-[520px] rounded-xl border border-terminal-700 bg-terminal-900 p-6">
        {children}
      </section>
    </div>
  )
}
