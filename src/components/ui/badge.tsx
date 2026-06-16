import * as React from "react"

import { cn } from "@/lib/utils"

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement>

function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 text-xs font-medium text-cyan-400",
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
