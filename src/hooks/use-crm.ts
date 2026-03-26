"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// ── Types ──────────────────────────────────────────────

export interface CrmConnection {
  id: string
  provider: string
  isActive: boolean
  lastSyncAt: string | null
  syncStatus: string
  syncError: string | null
  createdAt: string
  _count: { leads: number }
}

export interface CrmLead {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  company: string | null
  crmStage: string | null
  qualityScore: number | null
  qualityTier: string | null
  adPlatform: string | null
  campaignId: string | null
  matchMethod: string | null
  matchConfidence: number | null
  dealValue: number | null
  crmCreatedAt: string | null
}

export interface QualityMapping {
  id: string
  crmStage: string
  qualityScore: number
  qualityTier: string
  sortOrder: number
}

export interface QualityBreakdown {
  tier: string
  count: number
  percentage: number
}

export interface PlatformBreakdown {
  platform: string
  count: number
  qualityCount: number
  qualityPercentage: number
}

export interface CampaignQualityMetrics {
  campaignId: string
  campaignName: string
  totalLeads: number
  qualityLeads: number
  junkLeads: number
  junkPercentage: number
  cpql: number | null
  metaCpl: number | null
  qualityRatio: number
  avgDealValue: number | null
}

export interface EntityQualityMetrics {
  entityId: string
  entityName: string
  parentName?: string
  totalLeads: number
  qualityLeads: number
  junkLeads: number
  junkPercentage: number
  cpql: number | null
  metaCpl: number | null
  qualityRatio: number
  avgDealValue: number | null
}

export type EntityLevel = "campaign" | "adset" | "ad"

export interface CrmInsights {
  totalLeads: number
  qualityLeads: number
  cpql: number | null
  conversionRate: number
  avgDealValue: number | null
  qualityBreakdown: QualityBreakdown[]
  platformBreakdown: PlatformBreakdown[]
  cpqlByCampaign: CampaignQualityMetrics[]
}

export interface QualityTrend {
  date: string
  totalLeads: number
  qualityLeads: number
  cpql: number | null
}

// ── Connection ─────────────────────────────────────────

export function useCrmConnection(adAccountId?: string | null) {
  return useQuery<{ data: CrmConnection[] }>({
    queryKey: ["crm-connection", adAccountId],
    queryFn: async () => {
      if (!adAccountId) return { data: [] }
      const res = await fetch(`/api/crm/connections?adAccountId=${adAccountId}`)
      if (!res.ok) throw new Error("Failed to fetch CRM connections")
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

// ── Sync ───────────────────────────────────────────────

export function useSyncCrm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await fetch("/api/crm/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, action: "sync" }),
      })
      if (!res.ok) throw new Error("CRM sync failed")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-connection"] })
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] })
      queryClient.invalidateQueries({ queryKey: ["crm-insights"] })
    },
  })
}

// ── Leads ──────────────────────────────────────────────

export function useCrmLeads(
  adAccountId?: string | null,
  params?: { page?: number; tier?: string; platform?: string; matched?: string }
) {
  const searchParams = new URLSearchParams()
  if (adAccountId) searchParams.set("adAccountId", adAccountId)
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.tier) searchParams.set("tier", params.tier)
  if (params?.platform) searchParams.set("platform", params.platform)
  if (params?.matched) searchParams.set("matched", params.matched)

  return useQuery<{ data: CrmLead[]; total: number }>({
    queryKey: ["crm-leads", adAccountId, params],
    queryFn: async () => {
      const res = await fetch(`/api/crm/leads?${searchParams}`)
      if (!res.ok) throw new Error("Failed to fetch leads")
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

// ── Insights ───────────────────────────────────────────

export function useCrmInsights(
  adAccountId?: string | null,
  dateRange?: { from: string; to: string },
  platform?: string
) {
  const searchParams = new URLSearchParams()
  if (adAccountId) searchParams.set("adAccountId", adAccountId)
  if (dateRange?.from) searchParams.set("from", dateRange.from)
  if (dateRange?.to) searchParams.set("to", dateRange.to)
  if (platform) searchParams.set("platform", platform)

  return useQuery<{ data: CrmInsights }>({
    queryKey: ["crm-insights", adAccountId, dateRange?.from, dateRange?.to, platform],
    queryFn: async () => {
      const res = await fetch(`/api/crm/insights?${searchParams}`)
      if (!res.ok) throw new Error("Failed to fetch insights")
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

export function useCrmTrends(
  adAccountId?: string | null,
  dateRange?: { from: string; to: string }
) {
  const searchParams = new URLSearchParams()
  if (adAccountId) searchParams.set("adAccountId", adAccountId)
  if (dateRange?.from) searchParams.set("from", dateRange.from)
  if (dateRange?.to) searchParams.set("to", dateRange.to)
  searchParams.set("type", "trends")

  return useQuery<{ data: QualityTrend[] }>({
    queryKey: ["crm-trends", adAccountId, dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/crm/insights?${searchParams}`)
      if (!res.ok) throw new Error("Failed to fetch trends")
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

// ── Entity Quality (campaign / adset / ad) ─────────────

export function useEntityQuality(
  adAccountId?: string | null,
  level?: EntityLevel,
  platform?: string,
  dateRange?: { from: string; to: string }
) {
  const searchParams = new URLSearchParams()
  if (adAccountId) searchParams.set("adAccountId", adAccountId)
  if (level) searchParams.set("level", level)
  if (platform) searchParams.set("platform", platform)
  if (dateRange?.from) searchParams.set("from", dateRange.from)
  if (dateRange?.to) searchParams.set("to", dateRange.to)
  searchParams.set("type", "entity")

  return useQuery<{ data: EntityQualityMetrics[] }>({
    queryKey: ["crm-entity-quality", adAccountId, level, platform, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      const res = await fetch(`/api/crm/insights?${searchParams}`)
      if (!res.ok) throw new Error("Failed to fetch entity quality")
      return res.json()
    },
    enabled: !!adAccountId && !!level,
  })
}

// ── Quality Mapping ────────────────────────────────────

export function useCrmQualityMap(connectionId?: string) {
  return useQuery<{ data: QualityMapping[] }>({
    queryKey: ["crm-quality-map", connectionId],
    queryFn: async () => {
      if (!connectionId) return { data: [] }
      const res = await fetch(`/api/crm/connections?action=get-quality-map&connectionId=${connectionId}`)
      if (!res.ok) return { data: [] }
      return res.json()
    },
    enabled: !!connectionId,
  })
}

export function useUpdateQualityMap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      connectionId,
      mappings,
    }: {
      connectionId: string
      mappings: { crmStage: string; qualityScore: number; qualityTier: string; sortOrder?: number }[]
    }) => {
      const res = await fetch("/api/crm/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, action: "update-quality-map", mappings }),
      })
      if (!res.ok) throw new Error("Failed to update quality map")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-quality-map"] })
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] })
      queryClient.invalidateQueries({ queryKey: ["crm-insights"] })
    },
  })
}

export function useDiscoverStages() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await fetch("/api/crm/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, action: "discover-stages" }),
      })
      if (!res.ok) throw new Error("Failed to discover stages")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-quality-map"] })
    },
  })
}

// ── Field Mapping (Zoho field → Meta ID) ───────────────

export interface FieldMapping {
  id: string
  metaField: string
  zohoField: string
}

export interface ZohoField {
  apiName: string
  displayLabel: string
  dataType: string
}

export function useFieldMap(connectionId?: string) {
  return useQuery<{ data: FieldMapping[] }>({
    queryKey: ["crm-field-map", connectionId],
    queryFn: async () => {
      if (!connectionId) return { data: [] }
      const res = await fetch(`/api/crm/connections?action=get-field-map&connectionId=${connectionId}`)
      if (!res.ok) return { data: [] }
      return res.json()
    },
    enabled: !!connectionId,
  })
}

export function useZohoFields(connectionId?: string) {
  return useQuery<{ data: ZohoField[] }>({
    queryKey: ["zoho-fields", connectionId],
    queryFn: async () => {
      if (!connectionId) return { data: [] }
      const res = await fetch(`/api/crm/connections?action=get-zoho-fields&connectionId=${connectionId}`)
      if (!res.ok) return { data: [] }
      return res.json()
    },
    enabled: !!connectionId,
  })
}

export function useUpdateFieldMap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      connectionId,
      mappings,
    }: {
      connectionId: string
      mappings: { metaField: string; zohoField: string }[]
    }) => {
      const res = await fetch("/api/crm/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, action: "update-field-map", mappings }),
      })
      if (!res.ok) throw new Error("Failed to update field map")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-field-map"] })
    },
  })
}

// ── Source Mapping ──────────────────────────────────────

export interface SourceMapping {
  id: string
  crmSource: string
  adPlatform: string
}

export function useSourceMap(connectionId?: string) {
  return useQuery<{ data: SourceMapping[] }>({
    queryKey: ["crm-source-map", connectionId],
    queryFn: async () => {
      if (!connectionId) return { data: [] }
      const res = await fetch(`/api/crm/connections?action=get-source-map&connectionId=${connectionId}`)
      if (!res.ok) return { data: [] }
      return res.json()
    },
    enabled: !!connectionId,
  })
}

export function useUpdateSourceMap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      connectionId,
      mappings,
    }: {
      connectionId: string
      mappings: { crmSource: string; adPlatform: string }[]
    }) => {
      const res = await fetch("/api/crm/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, action: "update-source-map", mappings }),
      })
      if (!res.ok) throw new Error("Failed to update source map")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-source-map"] })
      queryClient.invalidateQueries({ queryKey: ["crm-insights"] })
    },
  })
}

export function useDiscoverSources() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await fetch("/api/crm/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, action: "discover-sources" }),
      })
      if (!res.ok) throw new Error("Failed to discover sources")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-source-map"] })
    },
  })
}

// ── Manual match ───────────────────────────────────────

export function useMatchLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      leadId,
      campaignId,
      adSetId,
      adId,
    }: {
      leadId: string
      campaignId: string
      adSetId?: string
      adId?: string
    }) => {
      const res = await fetch("/api/crm/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, campaignId, adSetId, adId }),
      })
      if (!res.ok) throw new Error("Failed to match lead")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] })
      queryClient.invalidateQueries({ queryKey: ["crm-insights"] })
    },
  })
}
