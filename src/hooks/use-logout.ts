"use client"

import { useCallback } from "react"
import { AuthStore } from "@/lib/auth-store"
import { useAppStore } from "@/lib/store"

/**
 * Unified logout hook. Clears all auth state and redirects to login.
 */
export function useLogout() {
  return useCallback(() => {
    AuthStore.clear()
    useAppStore.getState().setSelectedAdAccountId(null)
    useAppStore.getState().setSelectedGoogleAccountId(null)
    window.location.href = "/login"
  }, [])
}
