import { useMachine } from "@xstate/react"

import {
  pipelineMachine,
  type PipelineMachineEvent,
} from "@/machines/pipelineMachine"
import type { PipelineStatus } from "@/types"

const toPipelineStatus = (state: string): PipelineStatus => {
  if (state === "idle") {
    return "queued"
  }

  return state as PipelineStatus
}

export const usePipelineMachine = () => {
  const [snapshot, send] = useMachine(pipelineMachine)

  return {
    state: snapshot.value,
    status: toPipelineStatus(String(snapshot.value)),
    send: send as (event: PipelineMachineEvent) => void,
    context: snapshot.context,
  }
}
