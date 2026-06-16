import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

type SkeletonProps = HTMLAttributes<HTMLDivElement>

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-terminal-800 motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  )
}
