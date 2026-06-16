import {
  Database,
  GitFork,
  GitPullRequest,
  type LucideIcon,
} from "lucide-react"

import type { ProviderType } from "@/types"

export function getProviderIcon(type: ProviderType): LucideIcon {
  if (type === "github") {
    return GitPullRequest
  }

  if (type === "gitlab") {
    return GitFork
  }

  return Database
}

export function getProviderColor(type: ProviderType): string {
  if (type === "github") {
    return "text-slate-300"
  }

  if (type === "gitlab") {
    return "text-orange-400"
  }

  return "text-cyan-400"
}

export function getProviderLabel(type: ProviderType): string {
  if (type === "github") {
    return "GitHub"
  }

  if (type === "gitlab") {
    return "GitLab"
  }

  return "Demo Data"
}
