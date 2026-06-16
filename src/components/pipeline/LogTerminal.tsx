import { useVirtualizer } from "@tanstack/react-virtual"
import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"
import type { LogLine } from "@/types"

type LogTerminalProps = {
  lines: LogLine[]
  stepName: string
  isStreaming?: boolean
}

const levelStyles: Record<LogLine["level"], string> = {
  info: "text-green-400",
  success: "text-green-300",
  error: "text-red-400",
  warn: "text-yellow-400",
  debug: "text-slate-500",
}

const formatTimestamp = (timestamp: string) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp))

function LogLineRow({ line }: { line: LogLine }) {
  return (
    <div className={cn("whitespace-pre-wrap", levelStyles[line.level])}>
      <span className="text-slate-600">[{formatTimestamp(line.timestamp)}]</span>{" "}
      <span className="font-semibold uppercase">{line.level.padEnd(7, " ")}</span>
      {line.message}
    </div>
  )
}

export function LogTerminal({
  lines,
  stepName,
  isStreaming = false,
}: LogTerminalProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const shouldVirtualize = lines.length > 200
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: lines.length,
    estimateSize: () => 20,
    getScrollElement: () => scrollRef.current,
    overscan: 12,
  })

  useEffect(() => {
    if (lines.length === 0) {
      return
    }

    if (shouldVirtualize) {
      virtualizer.scrollToIndex(lines.length - 1, { align: "end" })
      return
    }

    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
    })
  }, [lines.length, shouldVirtualize, virtualizer])

  return (
    <div
      aria-label={`Build logs for ${stepName}`}
      aria-live="polite"
      ref={scrollRef}
      className="max-h-[320px] overflow-y-auto rounded-lg border border-terminal-700 bg-black p-3 font-mono text-xs leading-5"
      role="log"
    >
      {lines.length === 0 ? (
        <div className="text-slate-500">
          Waiting for runner
          <span
            className="ml-1 animate-pulse motion-reduce:animate-none"
            aria-hidden="true"
          >
            █
          </span>
        </div>
      ) : shouldVirtualize ? (
        <div
          className="relative"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const line = lines[virtualItem.index]

            return (
              <div
                className="absolute left-0 top-0 w-full"
                data-index={virtualItem.index}
                key={line.id}
                ref={virtualizer.measureElement}
                style={{ transform: `translateY(${virtualItem.start}px)` }}
              >
                <LogLineRow line={line} />
              </div>
            )
          })}
        </div>
      ) : (
        lines.map((line) => <LogLineRow key={line.id} line={line} />)
      )}
      {isStreaming ? (
        <span
          className="animate-pulse text-green-400 motion-reduce:animate-none"
          aria-hidden="true"
        >
          █
        </span>
      ) : null}
      <div className="sr-only" aria-live="polite">
        {!isStreaming && lines.length > 0 ? `Logs loaded for ${stepName}` : ""}
      </div>
    </div>
  )
}
