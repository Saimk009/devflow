import { useEffect, useState } from "react"

import { Label } from "@/components/ui/label"
import {
  accentStorageKey,
  dateFormatStorageKey,
  defaultAccent,
  defaultDateFormat,
  defaultDensity,
  densityStorageKey,
} from "@/lib/constants"
import type { DateFormatPreference } from "@/lib/formatDate"
import { cn } from "@/lib/utils"

type DensityPreference = "compact" | "default" | "comfortable"

const accentOptions = [
  { label: "Cyan", className: "bg-cyan-400", value: "#22d3ee" },
  { label: "Violet", className: "bg-violet-400", value: "#a78bfa" },
  { label: "Emerald", className: "bg-emerald-400", value: "#34d399" },
  { label: "Amber", className: "bg-amber-400", value: "#fbbf24" },
  { label: "Rose", className: "bg-rose-400", value: "#fb7185" },
  { label: "Sky", className: "bg-sky-400", value: "#38bdf8" },
  { label: "Fuchsia", className: "bg-fuchsia-400", value: "#e879f9" },
  { label: "Lime", className: "bg-lime-400", value: "#a3e635" },
]

const densityOptions: Array<{
  label: string
  value: DensityPreference
  preview: string
}> = [
  { label: "Compact", value: "compact", preview: "gap-1 p-2" },
  { label: "Default", value: "default", preview: "gap-2 p-3" },
  { label: "Comfortable", value: "comfortable", preview: "gap-3 p-4" },
]

const dateFormatOptions: Array<{
  label: string
  value: DateFormatPreference
}> = [
  { label: "Relative (3 minutes ago)", value: "relative" },
  { label: "Absolute (Jun 16, 14:30)", value: "absolute" },
  { label: "Both", value: "both" },
]

const getStoredValue = <T extends string>(key: string, fallback: T): T =>
  (localStorage.getItem(key) as T | null) ?? fallback

export function AppearanceTab() {
  const [accent, setAccent] = useState<string>(() =>
    getStoredValue(accentStorageKey, defaultAccent),
  )
  const [density, setDensity] = useState<DensityPreference>(() =>
    getStoredValue(densityStorageKey, defaultDensity as DensityPreference),
  )
  const [dateFormat, setDateFormat] = useState<DateFormatPreference>(() =>
    getStoredValue(dateFormatStorageKey, defaultDateFormat as DateFormatPreference),
  )

  useEffect(() => {
    localStorage.setItem(accentStorageKey, accent)
    document.documentElement.style.setProperty("--color-accent", accent)
  }, [accent])

  useEffect(() => {
    localStorage.setItem(densityStorageKey, density)
    document.body.dataset.density = density
  }, [density])

  useEffect(() => {
    localStorage.setItem(dateFormatStorageKey, dateFormat)
  }, [dateFormat])

  const updateDensity = (nextDensity: DensityPreference) => {
    setDensity(nextDensity)
  }

  const updateDateFormat = (nextDateFormat: DateFormatPreference) => {
    setDateFormat(nextDateFormat)
  }

  return (
    <div className="space-y-8">
      <section>
        <Label>Accent Color</Label>
        <div className="mt-3 flex flex-wrap gap-3">
          {accentOptions.map((option) => (
            <button
              aria-label={`Use ${option.label} accent color`}
              className={cn(
                "h-10 w-10 rounded-full border-2 border-terminal-700 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400",
                option.className,
                accent === option.value && "border-white ring-2 ring-white/40",
              )}
              key={option.value}
              onClick={() => setAccent(option.value)}
              type="button"
            />
          ))}
        </div>
      </section>

      <section>
        <Label>Display Density</Label>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {densityOptions.map((option) => (
            <button
              className={cn(
                "rounded-xl border border-terminal-700 bg-terminal-800 text-left transition hover:border-cyan-400/40",
                option.value === density && "border-cyan-400",
              )}
              key={option.value}
              onClick={() => updateDensity(option.value)}
              type="button"
            >
              <div className={cn("flex flex-col", option.preview)}>
                <span className="h-2 w-2/3 rounded bg-slate-500" />
                <span className="h-2 w-full rounded bg-slate-600" />
                <span className="h-2 w-1/2 rounded bg-slate-700" />
              </div>
              <p className="border-t border-terminal-700 px-3 py-2 text-sm font-medium text-slate-200">
                {option.label}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <Label>Timestamp Format</Label>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {dateFormatOptions.map((option) => (
            <button
              className={cn(
                "rounded-xl border border-terminal-700 bg-terminal-800 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-cyan-400/40",
                option.value === dateFormat && "border-cyan-400 text-cyan-400",
              )}
              key={option.value}
              onClick={() => updateDateFormat(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
