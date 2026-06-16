import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/react"
import { createElement, lazy, StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom"
import { Toaster } from "sonner"

import App from "./App"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { OnboardingGate } from "./components/OnboardingGate"
import { PipelineRedirect } from "./components/pipeline/PipelineRedirect"
import "./index.css"
import {
  accentStorageKey,
  defaultAccent,
  defaultDensity,
  densityStorageKey,
} from "./lib/constants"
import { PipelineDetailPageFallback } from "./pages/PipelineDetailPageFallback"
import { PipelinesPage } from "./pages/PipelinesPage"
import { OnboardingPage } from "./pages/OnboardingPage"
import { RunnersPage } from "./pages/RunnersPage"
import { SettingsPage } from "./pages/SettingsPage"
import { WorkflowsPage } from "./pages/WorkflowsPage"

const pipelineDetailPage = lazy(() =>
  import("./pages/PipelineDetailPage").then((module) => ({
    default: module.PipelineDetailPage,
  })),
)

const applyAppearancePreferences = () => {
  const accent = localStorage.getItem(accentStorageKey) ?? defaultAccent
  const density = localStorage.getItem(densityStorageKey) ?? defaultDensity

  document.documentElement.style.setProperty("--color-accent", accent)
  document.body.dataset.density = density
}

applyAppearancePreferences()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchInterval: 10_000,
      retry: 2,
    },
  },
})

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate replace to="/pipelines" />,
  },
  {
    path: "/onboarding",
    element: <OnboardingPage />,
  },
  {
    element: (
      <OnboardingGate>
        <App />
      </OnboardingGate>
    ),
    children: [
      {
        path: "/pipelines",
        element: <PipelinesPage />,
      },
      {
        path: "/pipelines/:id",
        element: (
          <Suspense fallback={<PipelineDetailPageFallback />}>
            {createElement(pipelineDetailPage)}
          </Suspense>
        ),
      },
      {
        path: "/pipeline/:id",
        element: <PipelineRedirect />,
      },
      {
        path: "/settings",
        element: <SettingsPage />,
      },
      {
        path: "/workflows",
        element: <WorkflowsPage />,
      },
      {
        path: "/runners",
        element: <RunnersPage />,
      },
    ],
  },
])

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <RouterProvider router={router} />
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "#161b22",
                border: "1px solid #21262d",
                color: "#e2e8f0",
              },
              classNames: {
                description: "font-mono text-slate-400",
                title: "text-slate-100",
                toast: "font-mono shadow-xl shadow-black/30",
              },
            }}
          />
        </NuqsAdapter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
