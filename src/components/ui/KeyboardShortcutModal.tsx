import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type KeyboardShortcutModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const shortcutRows = [
  { keys: ["G", "P"], description: "Go to Pipelines" },
  { keys: ["G", "W"], description: "Go to Workflows" },
  { keys: ["G", "R"], description: "Go to Runners" },
  { keys: ["G", "S"], description: "Go to Settings" },
  { keys: ["/"], description: "Focus search" },
  { keys: ["Esc"], description: "Close panel or modal" },
  { keys: ["R"], description: "Refresh current data" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
]

function ShortcutKeys({ keys }: { keys: string[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {keys.map((key, index) => (
        <span className="flex items-center gap-1.5" key={`${key}-${index}`}>
          {index > 0 ? <span className="text-xs text-slate-600">then</span> : null}
          <kbd className="min-w-7 rounded-md border border-terminal-700 bg-terminal-800 px-2 py-1 text-center font-mono text-xs text-slate-200 shadow-sm">
            {key}
          </kbd>
        </span>
      ))}
    </div>
  )
}

export function KeyboardShortcutModal({
  onOpenChange,
  open,
}: KeyboardShortcutModalProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Navigate DevFlow, focus search, and refresh data without leaving the
            keyboard.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          {shortcutRows.map((row) => (
            <div
              className="grid grid-cols-[150px_1fr] items-center rounded-lg border border-terminal-700 bg-terminal-950 px-3 py-2"
              key={row.description}
            >
              <ShortcutKeys keys={row.keys} />
              <span className="text-sm text-slate-300">{row.description}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
