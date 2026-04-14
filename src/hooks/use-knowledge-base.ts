"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-fetch"
import type { ProductKnowledgeBase, KBObjective } from "@/types/adsflow"

const BASE = "/api/meta/knowledge-base"

// ── Account-level KB (shared across platforms) ────────────

export function useAccountKB(adAccountId?: string | null) {
  return useQuery<ProductKnowledgeBase | null>({
    queryKey: ["knowledge-base", adAccountId, "account"],
    queryFn: async () => {
      if (!adAccountId) return null
      const res = await apiFetch(`${BASE}?adAccountId=${encodeURIComponent(adAccountId)}`)
      if (!res.ok) throw new Error("Failed to fetch knowledge base")
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

export function useUpsertAccountKB() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      adAccountId: string
      productDescription?: string
      idealCustomer?: string
      pricingContext?: string
      competitorContext?: string
      customNotes?: string
      links?: Array<{ url: string; description: string }>
    }) => {
      const res = await apiFetch(BASE, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Save failed")
      return res.json() as Promise<ProductKnowledgeBase>
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["knowledge-base", vars.adAccountId, "account"] })
    },
  })
}

// ── Campaign-level KBs ───────────────────────────────────

export function useCampaignKnowledgeBases(adAccountId?: string | null) {
  return useQuery<{ data: ProductKnowledgeBase[] }>({
    queryKey: ["knowledge-base-campaigns", adAccountId],
    queryFn: async () => {
      if (!adAccountId) return { data: [] }
      const res = await apiFetch(`${BASE}/campaigns?adAccountId=${encodeURIComponent(adAccountId)}`)
      if (!res.ok) throw new Error("Failed to fetch campaign KBs")
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

export function useCampaignKB(adAccountId?: string | null, campaignId?: string) {
  return useQuery<ProductKnowledgeBase | null>({
    queryKey: ["knowledge-base", adAccountId, "campaign", campaignId],
    queryFn: async () => {
      if (!adAccountId || !campaignId) return null
      const params = new URLSearchParams({ adAccountId, campaignId })
      const res = await apiFetch(`${BASE}?${params}`)
      if (!res.ok) throw new Error("Failed to fetch campaign KB")
      return res.json()
    },
    enabled: !!adAccountId && !!campaignId,
  })
}

export function useUpsertCampaignKB() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      adAccountId: string
      campaignId: string
      campaignName?: string
      customNotes?: string
      links?: Array<{ url: string; description: string }>
    }) => {
      const res = await apiFetch(BASE, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Save failed")
      return res.json() as Promise<ProductKnowledgeBase>
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["knowledge-base", vars.adAccountId, "campaign", vars.campaignId] })
      qc.invalidateQueries({ queryKey: ["knowledge-base-campaigns", vars.adAccountId] })
    },
  })
}

// ── Campaign metrics (live) ───────────────────────────────

export function useCampaignMetrics(adAccountId?: string | null, campaignId?: string) {
  return useQuery<Record<string, number | null>>({
    queryKey: ["campaign-metrics", adAccountId, campaignId],
    queryFn: async () => {
      if (!adAccountId || !campaignId) return {}
      const params = new URLSearchParams({ adAccountId, campaignId })
      const res = await apiFetch(`${BASE}/metrics?${params}`)
      if (!res.ok) return {}
      return res.json()
    },
    enabled: !!adAccountId && !!campaignId,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Objectives ────────────────────────────────────────────

export function useAddObjective() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      kbId: string
      adAccountId: string
      campaignId: string
      kpiType: string
      label: string
      freeTextGoal?: string
      targetValue?: number
      targetUnit?: string
      direction?: string
    }) => {
      const { adAccountId, campaignId, ...body } = payload
      const res = await apiFetch(`${BASE}/objectives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to add objective")
      return { objective: (await res.json()) as KBObjective, adAccountId, campaignId }
    },
    onSuccess: ({ adAccountId, campaignId }) => {
      qc.invalidateQueries({ queryKey: ["knowledge-base", adAccountId, "campaign", campaignId] })
      qc.invalidateQueries({ queryKey: ["knowledge-base-campaigns", adAccountId] })
    },
  })
}

export function useDeleteObjective() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, adAccountId, campaignId }: { id: string; adAccountId: string; campaignId: string }) => {
      const res = await apiFetch(`${BASE}/objectives/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      return { adAccountId, campaignId }
    },
    onSuccess: ({ adAccountId, campaignId }) => {
      qc.invalidateQueries({ queryKey: ["knowledge-base", adAccountId, "campaign", campaignId] })
      qc.invalidateQueries({ queryKey: ["knowledge-base-campaigns", adAccountId] })
    },
  })
}

export function useAddObjectiveSnapshot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, actual, notes, adAccountId, campaignId }: {
      id: string; actual: number; notes?: string; adAccountId: string; campaignId: string
    }) => {
      const res = await apiFetch(`${BASE}/objectives/${id}/snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual, notes }),
      })
      if (!res.ok) throw new Error("Snapshot failed")
      return { adAccountId, campaignId }
    },
    onSuccess: ({ adAccountId, campaignId }) => {
      qc.invalidateQueries({ queryKey: ["knowledge-base", adAccountId, "campaign", campaignId] })
    },
  })
}
