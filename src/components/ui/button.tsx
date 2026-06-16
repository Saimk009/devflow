import * as React from "react"

import { cn } from "@/lib/utils"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, type = "button", ...props }, ref) => (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-md border border-terminal-700 bg-terminal-900 px-3 text-sm font-medium text-slate-200 transition-colors hover:bg-terminal-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  ),
)
Button.displayName = "Button"

export { Button }
