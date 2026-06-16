import type { PropsWithChildren } from "react"
import { useLocation } from "react-router-dom"

import { mockPipelines } from "@/mock"

import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"

type AppShellProps = PropsWithChildren<{
  pipelineName?: string
}>

export function AppShell({ children, pipelineName }: AppShellProps) {
  const location = useLocation()
  const routePipelineId = location.pathname.match(/^\/pipelines?\/([^/]+)/)?.[1]
  const routePipelineName = mockPipelines.find(
    (pipeline) => pipeline.id === routePipelineId,
  )?.name

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-terminal-950 text-slate-200">
      <Sidebar />

      <div className="col-start-2 grid min-h-screen grid-rows-[48px_1fr]">
        <TopBar pipelineName={pipelineName ?? routePipelineName} />
        <main className="overflow-hidden bg-terminal-950">{children}</main>
      </div>
    </div>
  )
}
