import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"

import { toast } from "@/lib/toast"

export interface Shortcut {
  keys: string[]
  label: string
  action: () => void
  global: boolean
}

const SEQUENCE_TIMEOUT_MS = 800

const normalizeKey = (key: string) => {
  if (key === " ") return "space"
  return key.toLowerCase()
}

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']"),
  )
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const firstKeyRef = useRef<string | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const shortcuts = useMemo<Shortcut[]>(
    () => [
      {
        keys: ["g", "p"],
        label: "Go to Pipelines",
        action: () => navigate("/pipelines"),
        global: false,
      },
      {
        keys: ["g", "w"],
        label: "Go to Workflows",
        action: () => navigate("/workflows"),
        global: false,
      },
      {
        keys: ["g", "r"],
        label: "Go to Runners",
        action: () => navigate("/runners"),
        global: false,
      },
      {
        keys: ["g", "s"],
        label: "Go to Settings",
        action: () => navigate("/settings"),
        global: false,
      },
      {
        keys: ["/"],
        label: "Focus search",
        action: () => window.dispatchEvent(new CustomEvent("devflow:focus-search")),
        global: false,
      },
      {
        keys: ["escape"],
        label: "Close panel or modal",
        action: () => window.dispatchEvent(new CustomEvent("devflow:close-panel")),
        global: true,
      },
      {
        keys: ["r"],
        label: "Refresh current data",
        action: () => {
          void queryClient.invalidateQueries()
          toast.refreshed()
        },
        global: false,
      },
      {
        keys: ["?"],
        label: "Show keyboard shortcuts",
        action: () =>
          window.dispatchEvent(new CustomEvent("devflow:open-shortcuts-help")),
        global: false,
      },
    ],
    [navigate, queryClient],
  )

  useEffect(() => {
    const clearSequence = () => {
      firstKeyRef.current = null

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    const startSequence = (key: string) => {
      firstKeyRef.current = key

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = window.setTimeout(clearSequence, SEQUENCE_TIMEOUT_MS)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = normalizeKey(event.key)
      const targetIsEditable = isEditableTarget(event.target)
      const singleShortcut = shortcuts.find(
        (shortcut) => shortcut.keys.length === 1 && shortcut.keys[0] === key,
      )

      if (singleShortcut) {
        if (targetIsEditable && !singleShortcut.global) {
          return
        }

        event.preventDefault()
        clearSequence()
        singleShortcut.action()
        return
      }

      const activeSequenceKey = firstKeyRef.current
      if (activeSequenceKey) {
        const sequenceShortcut = shortcuts.find(
          (shortcut) =>
            shortcut.keys.length === 2 &&
            shortcut.keys[0] === activeSequenceKey &&
            shortcut.keys[1] === key,
        )

        clearSequence()

        if (!sequenceShortcut || (targetIsEditable && !sequenceShortcut.global)) {
          return
        }

        event.preventDefault()
        sequenceShortcut.action()
        return
      }

      const canStartSequence = shortcuts.some(
        (shortcut) => shortcut.keys.length === 2 && shortcut.keys[0] === key,
      )

      if (canStartSequence && !targetIsEditable) {
        event.preventDefault()
        startSequence(key)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [shortcuts])
}
