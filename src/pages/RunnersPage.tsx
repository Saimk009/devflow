import { useQuery } from "@tanstack/react-query"
import { Activity, Cpu, Gauge, Server } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { RunnerCard } from "@/components/runners/RunnerCard"
import { RunnerDetailPanel } from "@/components/runners/RunnerDetailPanel"
import { RepoSelector } from "@/components/shared/RepoSelector"
import { EmptyState } from "@/components/ui/EmptyState"
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
import { Skeleton } from "@/components/ui/skeleton"
import { useDataLayer } from "@/hooks/useDataLayer"
import { useRepoContext } from "@/hooks/useRepoContext"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Runner } from "@/types"

const allValue = "all"

const utilizationColor = (value: number) => {
  if (value > 80) return "bg-pipeline-failed"
  if (value >= 60) return "bg-amber-400"
  return "bg-pipeline-success"
}

const getTypeBucket = (runner: Runner) => {
  if (runner.runnerType === "github-hosted") return "github-hosted"
  if (runner.runnerType === "self-hosted") return "self-hosted"
  return "gitlab"
}

function StatCard({
  children,
  icon: Icon,
  label,
  value,
}: {
  children?: React.ReactNode
  icon: typeof Server
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-xl border border-terminal-700 bg-terminal-900 p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-cyan-400" />
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  )
}

export function RunnersPage() {
  const navigate = useNavigate()
  const dataLayer = useDataLayer()
  const { selectedRepo } = useRepoContext()
  const labelSearchRef = useRef<HTMLInputElement>(null)
  const [statusFilter, setStatusFilter] = useState(allValue)
  const [typeFilter, setTypeFilter] = useState(allValue)
  const [osFilter, setOsFilter] = useState(allValue)
  const [labelSearch, setLabelSearch] = useState("")
  const [selectedRunner, setSelectedRunner] = useState<Runner | null>(null)
  const {
    data: runners = [],
    error,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["runners", dataLayer.provider?.id ?? "mock", selectedRepo ?? "all"],
    queryFn: () => dataLayer.fetchRunners(selectedRepo ?? undefined),
  })
  const filteredRunners = useMemo(
    () =>
      runners.filter((runner) => {
        const matchesStatus =
          statusFilter === allValue || runner.status === statusFilter
        const matchesType =
          typeFilter === allValue || getTypeBucket(runner) === typeFilter
        const matchesOs = osFilter === allValue || runner.os === osFilter
        const matchesLabel =
          labelSearch.trim() === "" ||
          runner.labels.some((label) =>
            label.toLowerCase().includes(labelSearch.toLowerCase()),
          )

        return matchesStatus && matchesType && matchesOs && matchesLabel
      }),
    [labelSearch, osFilter, runners, statusFilter, typeFilter],
  )
  const onlineCount = runners.filter((runner) => runner.status === "online").length
  const busyCount = runners.filter((runner) => runner.status === "busy").length
  const offlineCount = runners.filter((runner) => runner.status === "offline").length
  const activeRunners = runners.filter(
    (runner) => runner.status === "online" || runner.status === "busy",
  )
  const avgUtilization =
    activeRunners.length > 0
      ? Math.round(
          activeRunners.reduce((total, runner) => total + runner.utilization, 0) /
            activeRunners.length,
        )
      : 0
  const githubCount = runners.filter(
    (runner) => runner.runnerType === "github-hosted",
  ).length
  const selfHostedCount = runners.filter(
    (runner) => runner.runnerType === "self-hosted",
  ).length
  const gitlabCount = runners.filter((runner) =>
    runner.runnerType.startsWith("gitlab"),
  ).length

  useEffect(() => {
    const focusSearch = () => labelSearchRef.current?.focus()

    window.addEventListener("devflow:focus-search", focusSearch)

    return () => {
      window.removeEventListener("devflow:focus-search", focusSearch)
    }
  }, [])

  useEffect(() => {
    if (isError) {
      toast.apiError(
        error,
        () => void refetch(),
        () => navigate("/settings?tab=providers"),
      )
    }
  }, [error, isError, navigate, refetch])

  return (
    <section className="h-full overflow-auto p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
            Runners
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Runners</h1>
        </div>
        <RepoSelector />
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard icon={Server} label="Total Runners" value={runners.length}>
          <p className="text-xs text-slate-500">
            {onlineCount} online, {busyCount} busy, {offlineCount} offline
          </p>
        </StatCard>
        <StatCard icon={Activity} label="Active Jobs" value={busyCount} />
        <StatCard icon={Gauge} label="Avg Utilization" value={`${avgUtilization}%`}>
          <div className="h-2 overflow-hidden rounded-full bg-terminal-950">
            <div
              className={cn("h-full rounded-full", utilizationColor(avgUtilization))}
              style={{ width: `${avgUtilization}%` }}
            />
          </div>
        </StatCard>
        <StatCard icon={Cpu} label="Runner Split" value={`${githubCount}/${selfHostedCount}/${gitlabCount}`}>
          <p className="text-xs text-slate-500">
            GitHub / Self-hosted / GitLab
          </p>
        </StatCard>
      </div>

      <div className="mt-6 grid gap-4 rounded-xl border border-terminal-700 bg-terminal-900 p-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select onValueChange={setStatusFilter} value={statusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {["all", "online", "busy", "offline", "disabled"].map((value) => (
                  <SelectItem key={value} value={value}>
                    {value === "all" ? "All" : value}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select onValueChange={setTypeFilter} value={typeFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="github-hosted">GitHub-hosted</SelectItem>
                <SelectItem value="self-hosted">Self-hosted</SelectItem>
                <SelectItem value="gitlab">GitLab</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>OS</Label>
          <Select onValueChange={setOsFilter} value={osFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="linux">Linux</SelectItem>
                <SelectItem value="windows">Windows</SelectItem>
                <SelectItem value="macos">macOS</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="runner-label-search">Label search</Label>
          <Input
            id="runner-label-search"
            onChange={(event) => setLabelSearch(event.target.value)}
            placeholder="Filter by label..."
            ref={labelSearchRef}
            value={labelSearch}
          />
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton className="h-72 rounded-xl bg-terminal-900" key={index} />
            ))}
          </div>
        ) : filteredRunners.length === 0 ? (
          <EmptyState
            description="No runners match the current filters."
            icon={Server}
            title="No runners found"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredRunners.map((runner) => (
              <RunnerCard
                key={runner.id}
                onClick={setSelectedRunner}
                runner={runner}
              />
            ))}
          </div>
        )}
      </div>

      <RunnerDetailPanel
        onClose={() => setSelectedRunner(null)}
        runner={selectedRunner}
      />
    </section>
  )
}
