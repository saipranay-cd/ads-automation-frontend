"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-fetch"

// ── Types ───────────────────────────────────────────────

export interface OrgMember {
  id: string
  userId: string
  role: "ADMIN" | "EDIT" | "READ"
  createdAt: string
  user: {
    id: string
    email: string
    name: string | null
    image: string | null
    isOwner: boolean
  }
}

export interface SyncStatusInfo {
  provider: string // meta | google | crm
  status: string   // idle | syncing | error | success
  lastSyncAt: string | null
  lastError: string | null
  nextSyncAt: string | null
}

export interface AuditLogEntry {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  details: string | null
  createdAt: string
  user: { name: string | null; email: string }
}

export interface OAuthConnectionInfo {
  id: string
  provider: string
  status: string
  tokenExpiry: string | null
  userId: string
  user: { name: string | null; email: string }
}

// ── Hooks ───────────────────────────────────────────────

const BACKEND = ""  // proxied through Next.js API routes

export interface OrgInfo {
  id: string
  name: string
  slug: string
  role: string
}

export function useCurrentOrg() {
  return useQuery<{ data: OrgInfo[] }>({
    queryKey: ["current-org"],
    queryFn: async () => {
      const res = await apiFetch("/api/org")
      if (!res.ok) return { data: [] }
      const json = await res.json()
      return { data: Array.isArray(json.data) ? json.data : [] }
    },
  })
}

export function useOrgMembers(orgId?: string | null) {
  return useQuery<{ data: OrgMember[] }>({
    queryKey: ["org-members", orgId],
    queryFn: async () => {
      const res = await apiFetch(`/api/org/${orgId}/members`)
      if (!res.ok) throw new Error("Failed to fetch members")
      return res.json()
    },
    enabled: !!orgId,
  })
}

export function useInviteUser(orgId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: { email: string; role: string; name?: string }) => {
      const res = await apiFetch(`/api/org/${orgId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to invite user")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] })
    },
  })
}

export function useUpdateMemberRole(orgId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiFetch(`/api/org/${orgId}/members/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error("Failed to update role")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] })
    },
  })
}

export function useRemoveMember(orgId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiFetch(`/api/org/${orgId}/members/${userId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to remove member")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] })
    },
  })
}

export function useSyncStatuses(orgId?: string | null) {
  return useQuery<{ data: SyncStatusInfo[] }>({
    queryKey: ["sync-statuses", orgId],
    queryFn: async () => {
      const res = await apiFetch(`/api/org/${orgId}/sync-status`)
      if (!res.ok) throw new Error("Failed to fetch sync statuses")
      return res.json()
    },
    enabled: !!orgId,
    refetchInterval: 30_000, // Poll every 30s for sync status updates
  })
}

export function useTriggerSync(orgId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (provider: string) => {
      const res = await apiFetch(`/api/org/${orgId}/sync/${provider}`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to trigger sync")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sync-statuses", orgId] })
    },
  })
}

export function useAuditLog(orgId?: string | null, page = 1) {
  return useQuery<{ data: AuditLogEntry[]; total: number }>({
    queryKey: ["audit-log", orgId, page],
    queryFn: async () => {
      const res = await apiFetch(`/api/org/${orgId}/audit-log?page=${page}`)
      if (!res.ok) throw new Error("Failed to fetch audit log")
      return res.json()
    },
    enabled: !!orgId,
  })
}

export function useOAuthConnections(orgId?: string | null) {
  return useQuery<{ data: OAuthConnectionInfo[] }>({
    queryKey: ["oauth-connections", orgId],
    queryFn: async () => {
      const res = await apiFetch(`/api/org/${orgId}/oauth-connections`)
      if (!res.ok) throw new Error("Failed to fetch OAuth connections")
      return res.json()
    },
    enabled: !!orgId,
  })
}
