import { AppShell } from "@/components/layout/AppShell"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { Outlet } from "react-router-dom"

function App() {
  useKeyboardShortcuts()

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export default App
