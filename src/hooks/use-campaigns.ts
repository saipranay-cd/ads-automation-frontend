"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { CampaignTableRow, AdSetTableRow, AdTableRow, WizardDraft } from "@/types/adsflow"

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
  syncedAt: string | null
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

// ── Ad Sets ────────────────────────────────────────────
export function useAdSets(adAccountId?: string | null) {
  return useQuery<{ data: AdSetTableRow[] }>({
    queryKey: ["adsets", adAccountId],
    queryFn: async () => {
      if (!adAccountId) return { data: [] }
      const res = await fetch(
        `/api/meta/adsets?adAccountId=${adAccountId}`
      )
      if (!res.ok) throw new Error("Failed to fetch ad sets")
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

// ── Ads ────────────────────────────────────────────────
export function useAds(adAccountId?: string | null) {
  return useQuery<{ data: AdTableRow[] }>({
    queryKey: ["ads", adAccountId],
    queryFn: async () => {
      if (!adAccountId) return { data: [] }
      const res = await fetch(
        `/api/meta/ads?adAccountId=${adAccountId}`
      )
      if (!res.ok) throw new Error("Failed to fetch ads")
      return res.json()
    },
    enabled: !!adAccountId,
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

export function useDashboard(adAccountId?: string | null) {
  return useQuery<DashboardMetrics>({
    queryKey: ["dashboard", adAccountId],
    queryFn: async () => {
      if (!adAccountId) return null as any
      const res = await fetch(`/api/meta/dashboard?adAccountId=${adAccountId}`)
      if (!res.ok) throw new Error("Failed to fetch dashboard")
      return res.json()
    },
    enabled: !!adAccountId,
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

// ── Audiences ─────────────────────────────────────────

export interface MetaAudienceTargeting {
  geo_locations?: {
    countries?: string[]
    cities?: Array<{ key: string; name: string; region?: string; country?: string }>
    regions?: Array<{ key: string; name: string }>
    zips?: Array<{ key: string; name?: string }>
  }
  age_min?: number
  age_max?: number
  genders?: number[]
  flexible_spec?: Array<{
    interests?: Array<{ id: string; name: string }>
    behaviors?: Array<{ id: string; name: string }>
    life_events?: Array<{ id: string; name: string }>
  }>
  exclusions?: Record<string, unknown>
  publisher_platforms?: string[]
  [key: string]: unknown
}

export interface MetaAudience {
  id: string
  name: string
  subtype: string
  approximate_count: number
  delivery_status: { status: string }
  time_created: number
  targeting?: MetaAudienceTargeting | null
}

export function useAudiences(adAccountId?: string | null) {
  return useQuery<{ data: MetaAudience[] }>({
    queryKey: ["audiences", adAccountId],
    queryFn: async () => {
      if (!adAccountId) return { data: [] }
      const res = await fetch(`/api/meta/audiences?adAccountId=${adAccountId}`)
      if (!res.ok) throw new Error("Failed to fetch audiences")
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

export function useDeleteAudience() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (audienceId: string) => {
      const res = await fetch(`/api/meta/audiences/${audienceId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete audience")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audiences"] })
    },
  })
}

// ── Lead Forms ────────────────────────────────────────

export interface MetaLeadForm {
  id: string
  name: string
  status: string
  leads_count: number
}

export function useLeadForms(adAccountId?: string | null) {
  return useQuery<{ data: MetaLeadForm[] }>({
    queryKey: ["lead-forms", adAccountId],
    queryFn: async () => {
      if (!adAccountId) return { data: [] }
      const res = await fetch(`/api/meta/lead-forms?adAccountId=${adAccountId}`)
      if (!res.ok) throw new Error("Failed to fetch lead forms")
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

// ── Targeting Search ──────────────────────────────────

export interface TargetingResult {
  id?: string
  key?: string
  name: string
  type?: string
  country_code?: string
}

export function useTargetingSearch(type: "interest" | "location", query: string) {
  return useQuery<{ data: TargetingResult[] }>({
    queryKey: ["targeting-search", type, query],
    queryFn: async () => {
      if (!query || query.length < 2) return { data: [] }
      const res = await fetch(
        `/api/meta/targeting/search?type=${type}&q=${encodeURIComponent(query)}`
      )
      if (!res.ok) throw new Error("Search failed")
      return res.json()
    },
    enabled: query.length >= 2,
  })
}

// ── Analytics ─────────────────────────────────────────

export interface PerformanceMetric {
  date: string
  spend: number
  leads: number
  impressions: number
  clicks: number
  reach: number
  cpl: number
  ctr: number
  cpc: number
}

export interface BreakdownMetrics {
  spend: number
  leads: number
  impressions: number
  clicks: number
  reach: number
  cpl: number
  ctr: number
  cpc: number
}

export interface PlacementData extends BreakdownMetrics {
  name: string
}

export interface AgeGenderData {
  age: string
  male: BreakdownMetrics
  female: BreakdownMetrics
}

export interface CityData extends BreakdownMetrics {
  city: string
}

export function useAggregatedMetrics(adAccountId?: string | null, days = 30) {
  return useQuery<PerformanceMetric[]>({
    queryKey: ["analytics", "metrics", adAccountId, days],
    queryFn: async () => {
      if (!adAccountId) return []
      const res = await fetch(`/api/analytics?type=metrics&adAccountId=${adAccountId}&days=${days}`)
      if (!res.ok) throw new Error("Failed to fetch metrics")
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

export function usePlacementBreakdown(adAccountId?: string | null, days = 30) {
  return useQuery<PlacementData[]>({
    queryKey: ["analytics", "placements", adAccountId, days],
    queryFn: async () => {
      if (!adAccountId) return []
      const res = await fetch(`/api/analytics?type=placements&adAccountId=${adAccountId}&days=${days}`)
      if (!res.ok) throw new Error("Failed to fetch placements")
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

export function useAgeGenderBreakdown(adAccountId?: string | null, days = 30) {
  return useQuery<AgeGenderData[]>({
    queryKey: ["analytics", "age-gender", adAccountId, days],
    queryFn: async () => {
      if (!adAccountId) return []
      const res = await fetch(`/api/analytics?type=age-gender&adAccountId=${adAccountId}&days=${days}`)
      if (!res.ok) throw new Error("Failed to fetch age-gender data")
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

export function useCityBreakdown(adAccountId?: string | null, days = 30) {
  return useQuery<CityData[]>({
    queryKey: ["analytics", "cities", adAccountId, days],
    queryFn: async () => {
      if (!adAccountId) return []
      const res = await fetch(`/api/analytics?type=cities&adAccountId=${adAccountId}&days=${days}`)
      if (!res.ok) throw new Error("Failed to fetch city data")
      return res.json()
    },
    enabled: !!adAccountId,
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

// ── AI Proposals ──────────────────────────────────────────

export interface ProposalAction {
  type: "update_budget" | "pause_entity" | "activate_entity" | "update_bid_strategy"
  entityId: string
  entityLevel: "campaign" | "adset" | "ad"
  entityName: string
  params: Record<string, unknown>
}

export interface ActionResult {
  action: ProposalAction
  status: "success" | "failed"
  error?: string
  metaApiPayload: Record<string, unknown>
  executedAt: string
}

export interface ExecutionResult {
  status: "success" | "partial_failure" | "failed"
  actionResults: ActionResult[]
  executedAt: string
  error?: string
}

export interface ProposalMetadata {
  actions?: ProposalAction[]
  executionResult?: ExecutionResult
}

export interface AiProposal {
  id: string
  adAccountId: string
  agentId: string
  status: "pending" | "approved" | "executed" | "rejected" | "failed"
  risk: "low" | "medium" | "high"
  campaignId: string | null
  campaignName: string
  title: string
  description: string
  impact: string
  confidence: number
  estimatedSavings: number | null
  metadata: ProposalMetadata | null
  createdAt: string
  updatedAt: string
}

export interface ProposalStats {
  pending: number
  approved: number
  executed: number
  rejected: number
  failed: number
  applied: number
  estimatedSavings: number
  lastScan: string | null
  lastScanDuration: number | null
}

export function useProposals(adAccountId?: string | null) {
  return useQuery<{ data: AiProposal[] }>({
    queryKey: ["proposals", adAccountId],
    queryFn: async () => {
      if (!adAccountId) return { data: [] }
      const res = await fetch(`/api/meta/proposals?adAccountId=${adAccountId}`)
      if (!res.ok) throw new Error("Failed to fetch proposals")
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

export function useProposalStats(adAccountId?: string | null) {
  return useQuery<ProposalStats>({
    queryKey: ["proposals", "stats", adAccountId],
    queryFn: async () => {
      if (!adAccountId) return { pending: 0, approved: 0, executed: 0, rejected: 0, applied: 0, estimatedSavings: 0, lastScan: null, lastScanDuration: null }
      const res = await fetch(`/api/meta/proposals/stats?adAccountId=${adAccountId}`)
      if (!res.ok) throw new Error("Failed to fetch proposal stats")
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

export function useScanProposals() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ adAccountId, scanType }: { adAccountId: string; scanType?: "quick" | "daily" }) => {
      const res = await fetch(
        `/api/meta/proposals/scan?adAccountId=${adAccountId}&scanType=${scanType || "quick"}`,
        { method: "POST" }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Scan failed")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] })
    },
  })
}

export function useUpdateProposal() {
  const queryClient = useQueryClient()

  return useMutation<
    { data: AiProposal; execution?: ExecutionResult },
    Error,
    { id: string; action: "approve" | "reject" | "execute" }
  >({
    mutationFn: async ({ id, action }) => {
      const res = await fetch(`/api/meta/proposals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error("Failed to update proposal")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] })
      // Budgets/statuses may have changed on Meta
      queryClient.invalidateQueries({ queryKey: ["campaigns"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}
