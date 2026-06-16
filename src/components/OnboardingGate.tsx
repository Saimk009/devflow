import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { onboardedStorageKey } from "@/lib/constants"

export function OnboardingGate({ children }: { children: ReactNode }) {
  const location = useLocation()
  const hasOnboarded = localStorage.getItem(onboardedStorageKey) === "true"

  if (!hasOnboarded) {
    return <Navigate replace state={{ from: location }} to="/onboarding" />
  }

  return children
}
