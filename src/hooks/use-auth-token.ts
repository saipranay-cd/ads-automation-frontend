"use client"

import { useSyncExternalStore } from "react"
import { AuthStore } from "@/lib/auth-store"

/**
 * Reactive hook that returns the current org JWT token.
 * Re-renders whenever the token changes (login, switch, logout).
 */
export function useAuthToken(): string | null {
  return useSyncExternalStore(
    AuthStore.subscribe,
    AuthStore.getSnapshot,
    AuthStore.getServerSnapshot,
  )
}
