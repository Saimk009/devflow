import { useEffect, useState } from "react"

import { mockPipelines } from "@/mock"
import type { LogLine, Step } from "@/types"

type UseLogStreamOptions = {
  enabled: boolean
}

type UseLogStreamResult = {
  lines: LogLine[]
  isStreaming: boolean
  error: string | null
}

type StreamState = {
  key: string | null
  lines: LogLine[]
  isStreaming: boolean
}

const findStep = (jobId: string, stepId: string): Step | undefined => {
  for (const pipeline of mockPipelines) {
    const job = pipeline.jobs.find((candidate) => candidate.id === jobId)
    const step = job?.steps.find((candidate) => candidate.id === stepId)

    if (step) {
      return step
    }
  }
}

const getNextDelay = () => 180 + Math.floor(Math.random() * 171)

export default function useLogStream(
  jobId: string | null,
  stepId: string | null,
  options: UseLogStreamOptions = { enabled: true },
): UseLogStreamResult {
  const streamKey = jobId && stepId ? `${jobId}:${stepId}` : null
  const step = jobId && stepId ? findStep(jobId, stepId) : undefined
  const [streamState, setStreamState] = useState<StreamState>({
    key: null,
    lines: [],
    isStreaming: false,
  })

  useEffect(() => {
    if (!options.enabled || !streamKey || !step || step.status !== "running") {
      return
    }

    let lineIndex = 0
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const emitNextLine = () => {
      const nextLine = step.logs[lineIndex]

      if (!nextLine) {
        setStreamState({
          key: streamKey,
          lines: step.logs,
          isStreaming: false,
        })
        return
      }

      setStreamState((currentState) => ({
        key: streamKey,
        lines:
          currentState.key === streamKey
            ? [...currentState.lines, nextLine]
            : [nextLine],
        isStreaming: lineIndex < step.logs.length - 1,
      }))

      lineIndex += 1

      if (lineIndex < step.logs.length) {
        timeoutId = setTimeout(emitNextLine, getNextDelay())
      }
    }

    timeoutId = setTimeout(emitNextLine, getNextDelay())

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [options.enabled, step, streamKey])

  if (!options.enabled || !jobId || !stepId) {
    return {
      lines: [],
      isStreaming: false,
      error: null,
    }
  }

  if (!step) {
    return {
      lines: [],
      isStreaming: false,
      error: "No logs found for the selected job step.",
    }
  }

  if (step.status !== "running") {
    return {
      lines: step.logs,
      isStreaming: false,
      error: null,
    }
  }

  return {
    lines: streamState.key === streamKey ? streamState.lines : [],
    isStreaming: streamState.key === streamKey ? streamState.isStreaming : true,
    error: null,
  }
}
