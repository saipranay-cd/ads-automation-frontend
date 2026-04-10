"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-fetch"
import { showApiError } from "@/components/layout/ErrorToast"
import type { CampaignTableRow, AdSetTableRow, AdTableRow, WizardDraft } from "@/types/adsflow"

// ── Helpers ──────────────────────────────────────────────
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ── Campaigns ──────────────────────────────────────────
export function useCampaigns(adAccountId?: string | null, limit?: number) {
  return useQuery<{ data: CampaignTableRow[] }>({
    queryKey: ["campaigns", adAccountId],
    queryFn: async () => {
      if (!adAccountId) return { data: [] }
      const params = new URLSearchParams({ adAccountId })
      const res = await apiFetch(`/api/meta/campaigns?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch campaigns")
      return res.json()
    },
    enabled: !!adAccountId,
    select: limit ? (data) => ({ ...data, data: data.data?.slice(0, limit) }) : undefined,
  })
}

// ── Sync ───────────────────────────────────────────────

// Global sync state so multiple components can observe background sync
let _syncingFlag = false
const _syncListeners = new Set<() => void>()
function setSyncing(v: boolean) {
  _syncingFlag = v
  _syncListeners.forEach((fn) => fn())
}

/** Returns true while a background Meta sync is in progress */
export function useIsSyncing() {
  const [syncing, setSyncState] = useState(_syncingFlag)
  useEffect(() => {
    const listener = () => setSyncState(_syncingFlag)
    _syncListeners.add(listener)
    return () => { _syncListeners.delete(listener) }
  }, [])
  return syncing
}

/** Poll for sync completion and refetch data when done */
function pollSyncCompletion(queryClient: ReturnType<typeof useQueryClient>) {
  let attempts = 0
  const maxAttempts = 60 // ~3 minutes at 3s intervals
  const interval = setInterval(async () => {
    attempts++
    if (attempts > maxAttempts) {
      clearInterval(interval)
      setSyncing(false)
      return
    }

    // Refetch accounts to check if syncedAt updated
    await queryClient.invalidateQueries({ queryKey: ["accounts"] })

    const accountsData = queryClient.getQueryData<{ data: AdAccount[] }>(["accounts"])
    const accounts = accountsData?.data
    if (accounts?.length && accounts.some((a) => {
      if (!a.syncedAt) return false
      const syncedAt = new Date(a.syncedAt).getTime()
      return Date.now() - syncedAt < 10_000 // synced within last 10s
    })) {
      clearInterval(interval)
      setSyncing(false)
      // Sync done — refetch all data
      queryClient.invalidateQueries({ queryKey: ["campaigns"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
      queryClient.invalidateQueries({ queryKey: ["adsets"] })
      queryClient.invalidateQueries({ queryKey: ["ads"] })
      queryClient.invalidateQueries({ queryKey: ["predictions"] })
      queryClient.invalidateQueries({ queryKey: ["creatives"] })
      queryClient.invalidateQueries({ queryKey: ["sync-statuses"] })
    }
  }, 3000)
}

export function useSync() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (adAccountId?: string) => {
      const res = await apiFetch("/api/meta/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adAccountId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg = typeof data.error === "string" ? data.error : data.error?.message || "Sync failed"
        throw new Error(msg)
      }
      return res.json()
    },
    onSuccess: () => {
      // Sync is now non-blocking — track state and poll for completion
      setSyncing(true)
      pollSyncCompletion(queryClient)
    },
    onError: (error) => {
      showApiError(error)
    },
  })
}

// ── Bulk Actions ──────────────────────────────────────
export interface BulkActionParams {
  entityIds: string[]
  entityLevel: "campaign" | "adset" | "ad"
  action: "pause" | "activate" | "update_budget"
  params?: Record<string, unknown>
}

export function useBulkAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: BulkActionParams) => {
      const res = await apiFetch("/api/meta/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Bulk action failed")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["adsets"] })
      queryClient.invalidateQueries({ queryKey: ["ads"] })
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
  business?: { id: string; name: string } | null
}

export function useAdAccounts() {
  return useQuery<{ data: AdAccount[]; error?: string }>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await apiFetch("/api/meta/accounts")
      if (res.status === 429) {
        return { data: [], error: "Meta API rate limit reached. Wait a few minutes before syncing again." }
      }
      if (!res.ok) throw new Error("Failed to fetch accounts")
      return res.json()
    },
    staleTime: 30 * 60 * 1000, // 30 min — accounts rarely change, avoid rate limits
    retry: (count, error) => {
      // Don't retry on rate limits
      if (error?.message?.includes("429")) return false
      return count < 2
    },
  })
}

// ── Ad Sets ────────────────────────────────────────────
export function useAdSets(adAccountId?: string | null) {
  return useQuery<{ data: AdSetTableRow[] }>({
    queryKey: ["adsets", adAccountId],
    queryFn: async () => {
      if (!adAccountId) return { data: [] }
      const res = await apiFetch(
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
      const res = await apiFetch(
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
      if (!adAccountId) throw new Error("No account ID")
      const res = await apiFetch(`/api/meta/dashboard?adAccountId=${adAccountId}`)
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
      const res = await apiFetch(`/api/meta/drafts?id=${id}`)
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

      const res = await apiFetch("/api/meta/drafts", {
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
      const res = await apiFetch(`/api/meta/drafts/${draftId}/publish`, {
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
      const res = await apiFetch(`/api/meta/audiences?adAccountId=${adAccountId}`)
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
      const res = await apiFetch(`/api/meta/audiences/${audienceId}`, {
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
      const res = await apiFetch(`/api/meta/lead-forms?adAccountId=${adAccountId}`)
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
  const debouncedQuery = useDebouncedValue(query, 300)
  return useQuery<{ data: TargetingResult[] }>({
    queryKey: ["targeting-search", type, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return { data: [] }
      const res = await apiFetch(
        `/api/meta/targeting/search?type=${type}&q=${encodeURIComponent(debouncedQuery)}`
      )
      if (!res.ok) throw new Error("Search failed")
      return res.json()
    },
    enabled: debouncedQuery.length >= 2,
  })
}

// ── Analytics ─────────────────────────────────────────

export interface DateRange {
  since: string // YYYY-MM-DD
  until: string // YYYY-MM-DD
}

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

export type InsightLevel = "campaign" | "adset" | "ad"

export interface EntityInsight {
  id: string
  name: string
  parentId?: string
  parentName?: string
  campaignId?: string
  campaignName?: string
  spend: number
  leads: number
  impressions: number
  clicks: number
  reach: number
  cpl: number
  ctr: number
  cpc: number
}

export function useEntityInsights(
  adAccountId?: string | null,
  level?: InsightLevel,
  days = 30,
  dateRange?: DateRange,
  parentId?: string
) {
  return useQuery<EntityInsight[]>({
    queryKey: ["analytics", "entity-insights", adAccountId, level, dateRange?.since ?? days, dateRange?.until ?? "", parentId ?? ""],
    queryFn: async () => {
      if (!adAccountId || !level) return []
      const params = new URLSearchParams({ type: "entity-insights", adAccountId, days: String(days), level })
      if (dateRange) { params.set("since", dateRange.since); params.set("until", dateRange.until) }
      if (parentId) params.set("parentId", parentId)
      const res = await apiFetch(`/api/analytics?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch entity insights")
      const json = await res.json()
      return Array.isArray(json) ? json : json.data ?? []
    },
    enabled: !!adAccountId && !!level,
  })
}

export function useAggregatedMetrics(adAccountId?: string | null, days = 30, dateRange?: DateRange) {
  return useQuery<PerformanceMetric[]>({
    queryKey: ["analytics", "metrics", adAccountId, dateRange?.since ?? days, dateRange?.until ?? ""],
    queryFn: async () => {
      if (!adAccountId) return []
      const params = new URLSearchParams({ type: "metrics", adAccountId, days: String(days) })
      if (dateRange) { params.set("since", dateRange.since); params.set("until", dateRange.until) }
      const res = await apiFetch(`/api/analytics?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch metrics")
      const json = await res.json()
      // Backend may return { data: [...] } or [...] directly
      return Array.isArray(json) ? json : json.data ?? []
    },
    enabled: !!adAccountId,
  })
}

export function usePlacementBreakdown(adAccountId?: string | null, days = 30, dateRange?: DateRange) {
  return useQuery<PlacementData[]>({
    queryKey: ["analytics", "placements", adAccountId, dateRange?.since ?? days, dateRange?.until ?? ""],
    queryFn: async () => {
      if (!adAccountId) return []
      const params = new URLSearchParams({ type: "placements", adAccountId, days: String(days) })
      if (dateRange) { params.set("since", dateRange.since); params.set("until", dateRange.until) }
      const res = await apiFetch(`/api/analytics?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch placements")
      const json = await res.json()
      return Array.isArray(json) ? json : json.data ?? []
    },
    enabled: !!adAccountId,
  })
}

export function useAgeGenderBreakdown(adAccountId?: string | null, days = 30, dateRange?: DateRange) {
  return useQuery<AgeGenderData[]>({
    queryKey: ["analytics", "age-gender", adAccountId, dateRange?.since ?? days, dateRange?.until ?? ""],
    queryFn: async () => {
      if (!adAccountId) return []
      const params = new URLSearchParams({ type: "age-gender", adAccountId, days: String(days) })
      if (dateRange) { params.set("since", dateRange.since); params.set("until", dateRange.until) }
      const res = await apiFetch(`/api/analytics?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch age-gender data")
      const json = await res.json()
      return Array.isArray(json) ? json : json.data ?? []
    },
    enabled: !!adAccountId,
  })
}

export function useCityBreakdown(adAccountId?: string | null, days = 30, dateRange?: DateRange) {
  return useQuery<CityData[]>({
    queryKey: ["analytics", "cities", adAccountId, dateRange?.since ?? days, dateRange?.until ?? ""],
    queryFn: async () => {
      if (!adAccountId) return []
      const params = new URLSearchParams({ type: "cities", adAccountId, days: String(days) })
      if (dateRange) { params.set("since", dateRange.since); params.set("until", dateRange.until) }
      const res = await apiFetch(`/api/analytics?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch city data")
      const json = await res.json()
      return Array.isArray(json) ? json : json.data ?? []
    },
    enabled: !!adAccountId,
  })
}

// ── AI Chat ─────────────────────────────────────────────

export type ContextArea = "campaigns" | "adsets" | "audiences" | "analytics" | "proposals"

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export function useAiChat() {
  return useMutation<
    { reply: string },
    Error,
    { message: string; contextAreas: ContextArea[]; history: ChatMessage[]; adAccountId: string; platform?: "meta" | "google" }
  >({
    mutationFn: async (payload) => {
      const res = await apiFetch("/api/meta/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Chat failed")
      }
      return res.json()
    },
  })
}

// ── AI Analyze ─────────────────────────────────────────
export function useAnalyze() {
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await apiFetch("/api/meta/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      })
      if (!res.ok) throw new Error("Analysis failed")
      return res.json()
    },
  })
}

// ── AI Skill Prompt ──────────────────────────────────────

export interface AiModelOption {
  id: string
  name: string
  description: string
}

export function useSkillPrompt(adAccountId?: string | null, platform: "meta" | "google" = "meta") {
  return useQuery<{ prompt: string; aiModel: string; availableModels: AiModelOption[] }>({
    queryKey: ["skill-prompt", adAccountId, platform],
    queryFn: async () => {
      if (!adAccountId) return { prompt: "", aiModel: "gpt-4.1-mini", availableModels: [] }
      const res = await apiFetch(`/api/meta/skill-prompt?adAccountId=${adAccountId}&platform=${platform}`)
      if (!res.ok) throw new Error("Failed to fetch skill prompt")
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

export function useUpdateSkillPrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: { adAccountId: string; prompt?: string; aiModel?: string; platform?: "meta" | "google" }) => {
      const res = await apiFetch("/api/meta/skill-prompt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      })
      if (!res.ok) throw new Error("Failed to update skill prompt")
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["skill-prompt", variables.adAccountId] })
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

export interface EntityMetrics {
  spend: number
  impressions: number
  clicks: number
  leads: number
  cpl: number | null
  ctr: number
  cpc: number
}

export interface ComparisonMetrics {
  label: string
  spend?: number
  cpl?: number | null
  ctr?: number
  cpc?: number
}

export interface ProposalMetadata {
  actions?: ProposalAction[]
  executionResult?: ExecutionResult
  level?: "campaign" | "adset" | "ad"
  entityId?: string
  entityName?: string
  parentInfo?: string
  // Structured analysis
  situation?: string
  diagnosis?: string
  recommendation?: string
  expectedOutcome?: string
  creativeUrl?: string | null
  entityMetrics?: EntityMetrics | null
  comparisonMetrics?: ComparisonMetrics | null
}

export interface AiProposal {
  id: string
  adAccountId: string
  agentId: string
  status: "pending" | "approved" | "executed" | "rejected" | "failed" | "superseded" | "undone"
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
      const res = await apiFetch(`/api/meta/proposals?adAccountId=${adAccountId}`)
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
      const res = await apiFetch(`/api/meta/proposals/stats?adAccountId=${adAccountId}`)
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
      const res = await apiFetch(
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
    { id: string; action: "approve" | "reject" | "execute" | "undo" }
  >({
    mutationFn: async ({ id, action }) => {
      const res = await apiFetch(`/api/meta/proposals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error("Failed to update proposal")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] })
      queryClient.invalidateQueries({ queryKey: ["google-proposals"] })
      queryClient.invalidateQueries({ queryKey: ["proposal-stats"] })
      queryClient.invalidateQueries({ queryKey: ["google-proposal-stats"] })
      queryClient.invalidateQueries({ queryKey: ["impact-stats"] })
      queryClient.invalidateQueries({ queryKey: ["campaigns"] })
      queryClient.invalidateQueries({ queryKey: ["google-campaigns"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

// ── Impact Stats ───────────────────────────────────────

export interface ImpactStats {
  executed: number
  measured: number
  improved: number
  degraded: number
  successRate: number
  totalSavings: number
}

export function useImpactStats(adAccountId?: string | null) {
  return useQuery<{ data: ImpactStats }>({
    queryKey: ["impact-stats", adAccountId],
    queryFn: async () => {
      if (!adAccountId) return { data: { executed: 0, measured: 0, improved: 0, degraded: 0, successRate: 0, totalSavings: 0 } }
      const res = await apiFetch(`/api/meta/proposals?adAccountId=${adAccountId}&type=impact-stats`)
      if (!res.ok) throw new Error("Failed to fetch impact stats")
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

export function useMeasureProposals() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (adAccountId: string) => {
      const res = await apiFetch(`/api/meta/proposals?adAccountId=${adAccountId}`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to measure proposals")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] })
      queryClient.invalidateQueries({ queryKey: ["impact-stats"] })
    },
  })
}
