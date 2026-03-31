"use client"
import { useCurrentOrg } from "./use-org"

export type UserRole = "ADMIN" | "EDIT" | "READ" | null

export function useUserRole(): UserRole {
  const { data } = useCurrentOrg()
  const orgs = data?.data || []
  return (orgs[0]?.role as UserRole) || null
}

export function useCanEdit(): boolean {
  const role = useUserRole()
  return role === "ADMIN" || role === "EDIT"
}

export function useIsAdmin(): boolean {
  const role = useUserRole()
  return role === "ADMIN"
}
