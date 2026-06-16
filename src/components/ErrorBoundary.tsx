import { Component, type ErrorInfo, type ReactNode } from "react"

import { ErrorState } from "./ui/ErrorState"

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("DevFlow render error", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-terminal-950 p-6 text-slate-200">
          <ErrorState
            message="DevFlow hit an unexpected render error. Reloading the page usually restores the session."
            onRetry={() => window.location.reload()}
            title="Something went wrong"
          />
        </div>
      )
    }

    return this.props.children
  }
}
