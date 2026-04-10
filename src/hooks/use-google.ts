"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-fetch"
import type {
  GoogleCampaignRow,
  GoogleAdGroupRow,
  GoogleAdRow,
  GoogleKeywordRow,
} from "@/types/google-ads"
import type { AiProposal, ProposalStats } from "@/hooks/use-campaigns"

// ── Google Ad Accounts ──────────────────────────────────

export interface GoogleAdAccountInfo {
  id: string
  name: string
  currency: string
  timezone: string
  syncedAt: string | null
}

export function useGoogleAccounts() {
  return useQuery<{ data: GoogleAdAccountInfo[] }>({
    queryKey: ["google-accounts"],
    queryFn: async () => {
      const res = await apiFetch("/api/google/accounts")
      if (!res.ok) throw new Error("Failed to fetch Google accounts")
      return res.json()
    },
    staleTime: 30 * 60 * 1000,
  })
}

// ── Google Auth Status ──────────────────────────────────

export function useGoogleAuthStatus() {
  return useQuery<{ connected: boolean; email?: string }>({
    queryKey: ["google-auth-status"],
    queryFn: async () => {
      const res = await apiFetch("/api/google/auth/status")
      if (!res.ok) return { connected: false }
      return res.json()
    },
    staleTime: 60_000,
  })
}

// ── Error handling ──────────────────────────────────────

export class GoogleAuthExpiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GoogleAuthExpiredError"
  }
}

async function googleFetch(url: string): Promise<Response> {
  const res = await apiFetch(url)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const code = data?.error?.code
    const message = data?.error?.message || "Google Ads API error"
    if (code === "GOOGLE_AUTH_EXPIRED") {
      throw new GoogleAuthExpiredError(message)
    }
    throw new Error(message)
  }
  return res
}

// ── Google Campaigns ────────────────────────────────────

type DR = { since: string; until: string }

function buildParams(accountId: string, days?: number, dateRange?: DR): string {
  const p = new URLSearchParams({ accountId })
  if (dateRange) { p.set("since", dateRange.since); p.set("until", dateRange.until) }
  else if (days) p.set("days", String(days))
  return p.toString()
}

export function useGoogleCampaigns(googleAccountId?: string | null, days = 30, dateRange?: DR) {
  return useQuery<{ data: GoogleCampaignRow[] }>({
    queryKey: ["google-campaigns", googleAccountId, dateRange?.since ?? days, dateRange?.until ?? ""],
    queryFn: async () => {
      if (!googleAccountId) return { data: [] }
      const res = await googleFetch(`/api/google/campaigns?${buildParams(googleAccountId, days, dateRange)}`)
      return res.json()
    },
    enabled: !!googleAccountId,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Google Ad Groups ────────────────────────────────────

export function useGoogleAdGroups(googleAccountId?: string | null, days = 30, dateRange?: DR) {
  return useQuery<{ data: GoogleAdGroupRow[] }>({
    queryKey: ["google-ad-groups", googleAccountId, dateRange?.since ?? days, dateRange?.until ?? ""],
    queryFn: async () => {
      if (!googleAccountId) return { data: [] }
      const res = await googleFetch(`/api/google/ad-groups?${buildParams(googleAccountId, days, dateRange)}`)
      return res.json()
    },
    enabled: !!googleAccountId,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Google Ads ──────────────────────────────────────────

export function useGoogleAds(googleAccountId?: string | null, days = 30, dateRange?: DR) {
  return useQuery<{ data: GoogleAdRow[] }>({
    queryKey: ["google-ads", googleAccountId, dateRange?.since ?? days, dateRange?.until ?? ""],
    queryFn: async () => {
      if (!googleAccountId) return { data: [] }
      const res = await googleFetch(`/api/google/ads?${buildParams(googleAccountId, days, dateRange)}`)
      return res.json()
    },
    enabled: !!googleAccountId,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Google Keywords ─────────────────────────────────────

export function useGoogleKeywords(googleAccountId?: string | null, days = 30, dateRange?: DR) {
  return useQuery<{ data: GoogleKeywordRow[] }>({
    queryKey: ["google-keywords", googleAccountId, dateRange?.since ?? days, dateRange?.until ?? ""],
    queryFn: async () => {
      if (!googleAccountId) return { data: [] }
      const res = await googleFetch(`/api/google/keywords?${buildParams(googleAccountId, days, dateRange)}`)
      return res.json()
    },
    enabled: !!googleAccountId,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Google Analytics Metrics ────────────────────────────

export interface GoogleAnalyticsMetric {
  date: string
  spend: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
}

export function useGoogleAnalyticsMetrics(
  accountId?: string | null,
  days = 30,
  dateRange?: { since: string; until: string }
) {
  return useQuery<GoogleAnalyticsMetric[]>({
    queryKey: ["google-analytics-metrics", accountId, dateRange?.since ?? days, dateRange?.until ?? ""],
    queryFn: async () => {
      if (!accountId) return []
      const params = new URLSearchParams({ accountId, days: String(days) })
      if (dateRange) {
        params.set("since", dateRange.since)
        params.set("until", dateRange.until)
      }
      const res = await apiFetch(`/api/google/analytics/metrics?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch Google analytics metrics")
      const json = await res.json()
      return json.data || []
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Google Entity Insights ─────────────────────────────

export interface GoogleEntityInsight {
  id: string
  name: string
  status?: string
  campaignType?: string
  dailyBudget?: number | null
  spend: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  costPerConversion?: number | null
}

export function useGoogleEntityInsights(
  accountId?: string | null,
  level: "campaign" | "adgroup" = "campaign",
  days = 30,
  dateRange?: { since: string; until: string }
) {
  return useQuery<GoogleEntityInsight[]>({
    queryKey: ["google-entity-insights", accountId, level, dateRange?.since ?? days, dateRange?.until ?? ""],
    queryFn: async () => {
      if (!accountId) return []
      const params = new URLSearchParams({ accountId, level, days: String(days) })
      if (dateRange) {
        params.set("since", dateRange.since)
        params.set("until", dateRange.until)
      }
      const res = await apiFetch(`/api/google/analytics/entity-insights?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch Google entity insights")
      const json = await res.json()
      return json.data || []
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Google Dashboard Metrics ────────────────────────────

export interface GoogleDashboardMetrics {
  totalSpend: number
  conversions: number
  costPerConversion: number
  activeCampaigns: number
  pausedCampaigns: number
}

export function useGoogleDashboard(googleAccountId?: string | null) {
  return useQuery<GoogleDashboardMetrics>({
    queryKey: ["google-dashboard", googleAccountId],
    queryFn: async () => {
      if (!googleAccountId) throw new Error("No Google account ID")
      const res = await apiFetch(`/api/google/dashboard?accountId=${googleAccountId}`)
      if (!res.ok) throw new Error("Failed to fetch Google dashboard")
      return res.json()
    },
    enabled: !!googleAccountId,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Google Sync ─────────────────────────────────────────

export function useGoogleSync() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (googleAccountId?: string) => {
      const res = await apiFetch("/api/google/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleAccountId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Google sync failed")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-campaigns"] })
      queryClient.invalidateQueries({ queryKey: ["google-ad-groups"] })
      queryClient.invalidateQueries({ queryKey: ["google-ads"] })
      queryClient.invalidateQueries({ queryKey: ["google-keywords"] })
      queryClient.invalidateQueries({ queryKey: ["google-accounts"] })
      queryClient.invalidateQueries({ queryKey: ["google-dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

// ── Google AI Proposals ─────────────────────────────────

export function useGoogleProposals(accountId?: string | null) {
  return useQuery<{ data: AiProposal[] }>({
    queryKey: ["google-proposals", accountId],
    queryFn: async () => {
      if (!accountId) return { data: [] }
      const res = await apiFetch(`/api/google/proposals?adAccountId=${accountId}`)
      if (!res.ok) throw new Error("Failed to fetch Google proposals")
      return res.json()
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useGoogleProposalStats(accountId?: string | null) {
  return useQuery<ProposalStats>({
    queryKey: ["google-proposals", "stats", accountId],
    queryFn: async () => {
      if (!accountId) return { pending: 0, approved: 0, executed: 0, rejected: 0, failed: 0, applied: 0, estimatedSavings: 0, lastScan: null, lastScanDuration: null }
      const res = await apiFetch(`/api/google/proposals/stats?adAccountId=${accountId}`)
      if (!res.ok) throw new Error("Failed to fetch Google proposal stats")
      return res.json()
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useScanGoogleProposals() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ adAccountId, scanType }: { adAccountId: string; scanType?: "quick" | "daily" }) => {
      const res = await apiFetch(
        `/api/google/proposals/scan?adAccountId=${adAccountId}&scanType=${scanType || "quick"}`,
        { method: "POST" }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok && res.status !== 202) {
        throw new Error(data.error || "Google scan failed")
      }
      // 202 = scan running in background, treat as success
      return { ...data, isBackground: res.status === 202 }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-proposals"] })
      queryClient.invalidateQueries({ queryKey: ["google-proposals", "stats"] })
    },
  })
}
