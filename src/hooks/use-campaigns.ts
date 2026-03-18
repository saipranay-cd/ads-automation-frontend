"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { CampaignTableRow, WizardDraft } from "@/types/adsflow"

// ── Campaigns ──────────────────────────────────────────
export function useCampaigns(adAccountId?: string | null) {
  return useQuery<{ data: CampaignTableRow[] }>({
    queryKey: ["campaigns", adAccountId],
    queryFn: async () => {
      if (!adAccountId) return { data: [] }
      const res = await fetch(
        `/api/meta/campaigns?adAccountId=${adAccountId}`
      )
      if (!res.ok) throw new Error("Failed to fetch campaigns")
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

// ── Sync ───────────────────────────────────────────────
export function useSync() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (adAccountId?: string) => {
      const res = await fetch("/api/meta/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adAccountId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Sync failed")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
    },
  })
}

// ── Ad Accounts ────────────────────────────────────────
export interface AdAccount {
  id: string
  name: string
  account_id: string
  currency: string
  account_status: number
}

export function useAdAccounts() {
  return useQuery<{ data: AdAccount[] }>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch("/api/meta/accounts")
      if (!res.ok) throw new Error("Failed to fetch accounts")
      return res.json()
    },
  })
}

// ── Dashboard Metrics ──────────────────────────────────
export interface DashboardMetrics {
  totalSpend: number
  leadsToday: number
  costPerLead: number
  activeCampaigns: number
  pausedCampaigns: number
}

export function useDashboard() {
  return useQuery<DashboardMetrics>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/meta/dashboard")
      if (!res.ok) throw new Error("Failed to fetch dashboard")
      return res.json()
    },
  })
}

// ── Drafts ────────────────────────────────────────────

export function useDraft(id?: string | null) {
  return useQuery<WizardDraft & { id: string }>({
    queryKey: ["draft", id],
    queryFn: async () => {
      const res = await fetch(`/api/meta/drafts?id=${id}`)
      if (!res.ok) throw new Error("Failed to fetch draft")
      return res.json()
    },
    enabled: !!id,
  })
}

export function useSaveDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      id?: string | null
      userId: string
      adAccountId: string
      draft: Partial<WizardDraft>
    }) => {
      const method = payload.id ? "PUT" : "POST"
      const body = payload.id
        ? { id: payload.id, ...payload.draft }
        : { userId: payload.userId, adAccountId: payload.adAccountId, ...payload.draft }

      const res = await fetch("/api/meta/drafts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to save draft")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
    },
  })
}

export function usePublish() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ draftId, status, imageBase64 }: { draftId: string; status?: "Active" | "Paused"; imageBase64?: string }) => {
      const res = await fetch(`/api/meta/drafts/${draftId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, imageBase64 }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Publish failed")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] })
      queryClient.invalidateQueries({ queryKey: ["campaigns"] })
    },
  })
}

// ── AI Analyze ─────────────────────────────────────────
export function useAnalyze() {
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await fetch("/api/meta/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      })
      if (!res.ok) throw new Error("Analysis failed")
      return res.json()
    },
  })
}
