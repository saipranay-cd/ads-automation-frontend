"use client"

import { useSession } from "next-auth/react"
import { useCurrentOrg } from "./use-org"
import { useMemo } from "react"

/**
 * Unified auth hook that works for both:
 * - Meta OAuth users (NextAuth session)
 * - Email/password users (JWT in localStorage as "org-token")
 *
 * Returns a unified user object regardless of auth method.
 */
export interface AuthUser {
  name: string | null
  email: string | null
  image: string | null
  /** true if authenticated via Meta OAuth (has NextAuth session) */
  isMetaAuth: boolean
  /** true if authenticated via email/password JWT */
  isOrgAuth: boolean
}

function getStoredOrgUser(): { name: string; email: string } | null {
  try {
    const raw = localStorage.getItem("org-user")
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function useAuth() {
  const { data: session, status: sessionStatus } = useSession()
  const { data: orgData, isLoading: orgLoading } = useCurrentOrg()
  const hasOrgToken = useMemo(() => {
    if (typeof window === "undefined") return false
    return !!localStorage.getItem("org-token")
  }, [])
  const orgUser = useMemo(() => {
    if (typeof window === "undefined") return null
    return getStoredOrgUser()
  }, [])

  const metaUser = session?.user
  const orgs = orgData?.data || []
  const currentOrg = orgs[0]

  // Determine auth state
  const isMetaAuth = !!metaUser
  const isOrgAuth = hasOrgToken && !isMetaAuth
  const isAuthenticated = isMetaAuth || isOrgAuth

  // Build unified user
  let user: AuthUser | null = null
  if (isMetaAuth && metaUser) {
    user = {
      name: metaUser.name || null,
      email: metaUser.email || null,
      image: metaUser.image || null,
      isMetaAuth: true,
      isOrgAuth: false,
    }
  } else if (isOrgAuth) {
    user = {
      name: orgUser?.name || null,
      email: orgUser?.email || null,
      image: null,
      isMetaAuth: false,
      isOrgAuth: true,
    }
  }

  const isLoading = sessionStatus === "loading" || orgLoading

  return {
    user,
    isAuthenticated,
    isMetaAuth,
    isOrgAuth,
    isLoading,
    orgName: currentOrg?.name || null,
    orgRole: currentOrg?.role || null,
  }
}
