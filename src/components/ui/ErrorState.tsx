import { AlertTriangle } from "lucide-react"

import { Button } from "./button"

type ErrorStateProps = {
  title: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry, title }: ErrorStateProps) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-terminal-700 bg-terminal-900 p-10 text-center">
      <AlertTriangle className="h-10 w-10 text-amber-400" />
      <h2 className="mt-4 text-lg font-semibold text-slate-200">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
        {message}
      </p>
      {onRetry ? (
        <Button
          className="mt-5 border-amber-400/60 text-amber-300 hover:bg-amber-400/10"
          onClick={onRetry}
        >
          Retry
        </Button>
      ) : null}
    </div>
  )
}
