import { assign, setup } from "xstate"

export type PipelineMachineContext = {
  pipelineId: string
  startedAt: string | null
  completedAt: string | null
  errorMessage: string | null
  retryCount: number
}

export type PipelineMachineEvent =
  | { type: "TRIGGER"; pipelineId?: string }
  | { type: "START" }
  | { type: "COMPLETE" }
  | { type: "FAIL"; errorMessage?: string }
  | { type: "CANCEL" }
  | { type: "RETRY" }

const now = () => new Date().toISOString()

export const pipelineMachine = setup({
  types: {
    context: {} as PipelineMachineContext,
    events: {} as PipelineMachineEvent,
  },
  guards: {
    canRetry: ({ context }) => context.retryCount < 3,
  },
  actions: {
    recordStart: assign({
      startedAt: () => now(),
      completedAt: () => null,
    }),
    recordComplete: assign({
      completedAt: () => now(),
    }),
    incrementRetry: assign({
      retryCount: ({ context }) => context.retryCount + 1,
    }),
    clearError: assign({
      errorMessage: () => null,
    }),
    recordError: assign({
      errorMessage: ({ event }) =>
        event.type === "FAIL"
          ? (event.errorMessage ?? "Pipeline failed.")
          : "Pipeline failed.",
    }),
    setPipelineId: assign({
      pipelineId: ({ context, event }) =>
        event.type === "TRIGGER" && event.pipelineId
          ? event.pipelineId
          : context.pipelineId,
    }),
  },
}).createMachine({
  id: "pipeline",
  initial: "idle",
  context: {
    pipelineId: "",
    startedAt: null,
    completedAt: null,
    errorMessage: null,
    retryCount: 0,
  },
  states: {
    idle: {
      on: {
        TRIGGER: {
          target: "queued",
          actions: ["setPipelineId", "clearError"],
        },
      },
    },
    queued: {
      on: {
        START: {
          target: "running",
          actions: ["recordStart", "clearError"],
        },
        CANCEL: {
          target: "cancelled",
          actions: "recordComplete",
        },
      },
    },
    running: {
      on: {
        COMPLETE: {
          target: "success",
          actions: "recordComplete",
        },
        FAIL: {
          target: "failed",
          actions: ["recordComplete", "recordError"],
        },
        CANCEL: {
          target: "cancelled",
          actions: "recordComplete",
        },
      },
    },
    success: {
      on: {
        RETRY: {
          target: "queued",
          guard: "canRetry",
          actions: ["incrementRetry", "clearError"],
        },
      },
    },
    failed: {
      on: {
        RETRY: {
          target: "queued",
          guard: "canRetry",
          actions: ["incrementRetry", "clearError"],
        },
      },
    },
    cancelled: {},
  },
})
