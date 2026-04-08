"use client"

import { useCallback } from "react"
import { AuthStore } from "@/lib/auth-store"

/**
 * Unified logout hook. Clears all auth state and redirects to login.
 */
export function useLogout() {
  return useCallback(() => {
    AuthStore.clear()
    window.location.href = "/login"
  }, [])
}
