import {
  toast as sonnerToast,
  type ExternalToast,
} from "sonner"

import { GitHubApiError } from "@/lib/githubApi"
import { GitLabApiError } from "@/lib/gitlabApi"

type ToastId = string

const toastOptions = (description?: string): ExternalToast => ({
  description,
})

export const toast = {
  success: (title: string, description?: string) =>
    sonnerToast.success(title, toastOptions(description)),
  error: (title: string, description?: string) =>
    sonnerToast.error(title, toastOptions(description)),
  info: (title: string, description?: string) =>
    sonnerToast.info(title, toastOptions(description)),
  refreshed: () => sonnerToast.info("Data refreshed", { duration: 1_500 }),
  loading: (title: string): ToastId => {
    const id = crypto.randomUUID()
    sonnerToast.loading(title, { id })
    return id
  },
  dismiss: (id: ToastId) => sonnerToast.dismiss(id),
  promise: <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string },
  ): Promise<T> => {
    sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    })
    return promise
  },
  rateLimit: (provider: "GitHub" | "GitLab", minutes: number, retry?: () => void) =>
    sonnerToast.error(`${provider} API rate limit reached.`, {
      action: retry
        ? {
            label: "Retry",
            onClick: retry,
          }
        : undefined,
      description: `Resets in ${minutes} min.`,
    }),
  networkError: (retry?: () => void) =>
    sonnerToast.error("Connection failed. Check your internet connection.", {
      action: retry
        ? {
            label: "Retry",
            onClick: retry,
          }
        : undefined,
    }),
  tokenExpired: (provider: "GitHub" | "GitLab", goToSettings: () => void) =>
    sonnerToast.error(`Your ${provider} token expired. Reconnect in Settings.`, {
      action: {
        label: "Go to Settings",
        onClick: goToSettings,
      },
    }),
  apiError: (error: unknown, retry: () => void, goToSettings: () => void) => {
    if (error instanceof GitHubApiError || error instanceof GitLabApiError) {
      const provider = error instanceof GitHubApiError ? "GitHub" : "GitLab"

      if (error.status === 401) {
        toast.tokenExpired(provider, goToSettings)
        return
      }

      if (error.status === 429) {
        const minutesMatch = error.message.match(/(\d+) minutes?/u)
        const minutes = minutesMatch ? Number(minutesMatch[1]) : 1
        toast.rateLimit(provider, minutes, retry)
        return
      }

      toast.error(error.message)
      return
    }

    if (error instanceof TypeError) {
      toast.networkError(retry)
      return
    }

    toast.error("Something went wrong.")
  },
}
