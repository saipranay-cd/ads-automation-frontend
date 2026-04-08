"use client"

import { useAuthToken } from "./use-auth-token"
import { useCurrentOrg } from "./use-org"
import { useState, useEffect } from "react"
import { AuthStore } from "@/lib/auth-store"

/**
 * Unified auth hook.
 * Reactive — re-renders on login, org switch, and logout.
 */
export interface AuthUser {
  name: string | null
  email: string | null
  image: string | null
}

export function useAuth() {
  const token = useAuthToken()
  const { data: orgData, isLoading: orgLoading } = useCurrentOrg()

  const [storedUser, setStoredUser] = useState<{ name: string; email: string } | null>(
    () => AuthStore.getUser(),
  )

  useEffect(() => {
    return AuthStore.subscribe(() => {
      setStoredUser(AuthStore.getUser())
    })
  }, [])

  const hasToken = !!token
  const orgs = orgData?.data || []
  const currentOrg = orgs[0]

  let user: AuthUser | null = null
  if (hasToken && storedUser) {
    user = {
      name: storedUser.name || null,
      email: storedUser.email || null,
      image: null,
    }
  }

  return {
    user,
    isAuthenticated: hasToken,
    isLoading: orgLoading,
    orgName: currentOrg?.name || null,
    orgRole: currentOrg?.role || null,
  }
}
