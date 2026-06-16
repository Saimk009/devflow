import { Filter, Search } from "lucide-react"
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { useEffect, useRef } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  pipelineStatusFilterValues,
  type PipelineStatusFilter,
} from "@/hooks/usePipelineFilters"
import { getUniqueBranches } from "@/mock"
import type { Pipeline } from "@/types"

const statusOptions: Array<{ label: string; value: PipelineStatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Success", value: "success" },
  { label: "Failed", value: "failed" },
  { label: "Running", value: "running" },
  { label: "Queued", value: "queued" },
  { label: "Cancelled", value: "cancelled" },
]

type PipelineFiltersProps = {
  pipelines: Pipeline[]
}

export function PipelineFilters({ pipelines }: PipelineFiltersProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const branches = getUniqueBranches(pipelines)
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringLiteral(pipelineStatusFilterValues).withDefault("all"),
  )
  const [branch, setBranch] = useQueryState(
    "branch",
    parseAsString.withDefault("all"),
  )
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  )
  const activeFilterCount = [status !== "all", branch !== "all", search.trim() !== ""].filter(
    Boolean,
  ).length

  const clearFilters = () => {
    void setStatus("all")
    void setBranch("all")
    void setSearch("")
  }

  useEffect(() => {
    const focusSearch = () => searchInputRef.current?.focus()

    window.addEventListener("devflow:focus-search", focusSearch)

    return () => {
      window.removeEventListener("devflow:focus-search", focusSearch)
    }
  }, [])

  return (
    <div className="mb-4 rounded-xl border border-terminal-700 bg-terminal-900 p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="pipeline-search">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <Input
            aria-label="Search commit message or author"
            className="pl-9"
            id="pipeline-search"
            onChange={(event) => void setSearch(event.target.value)}
            placeholder="Search commit message or author"
            ref={searchInputRef}
            value={search}
          />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px]">
          <div className="space-y-2">
            <Label htmlFor="pipeline-status-filter">Status</Label>
            <Select
              onValueChange={(value) => void setStatus(value as PipelineStatusFilter)}
              value={status}
            >
              <SelectTrigger
                aria-label="Filter by status"
                id="pipeline-status-filter"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pipeline-branch-filter">Branch</Label>
            <Select onValueChange={(value) => void setBranch(value)} value={branch}>
              <SelectTrigger
                aria-label="Filter by branch"
                id="pipeline-branch-filter"
              >
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All branches</SelectItem>
                  {branches.map((branchName) => (
                    <SelectItem key={branchName} value={branchName}>
                      {branchName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-terminal-700 bg-terminal-950 text-slate-400">
            <Filter className="h-4 w-4" />
            {activeFilterCount > 0 ? (
              <Badge className="absolute -right-2 -top-2 h-5 min-w-5 justify-center px-1">
                {activeFilterCount}
              </Badge>
            ) : null}
          </div>

          {activeFilterCount > 0 ? (
            <Button
              aria-label="Clear all active filters"
              className="border-cyan-400/60 text-cyan-400 hover:bg-cyan-400/10"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
