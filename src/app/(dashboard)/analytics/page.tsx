"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { Download, ChevronDown, ChevronRight, FileSpreadsheet, BarChart3, Users, MapPin, Layers, FileDown, ArrowUp, ArrowDown, Target, Megaphone, LayoutGrid, Image } from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import {
  useCampaigns,
  useAdSets,
  useAds,
  useAggregatedMetrics,
  usePlacementBreakdown,
  useAgeGenderBreakdown,
  useCityBreakdown,
  useEntityInsights,
  type BreakdownMetrics,
  type DateRange,
  type InsightLevel,
  type EntityInsight,
} from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { DateRangePicker } from "@/components/ui/DateRangePicker"

// ── Constants ────────────────────────────────────────────

type ViewLevel = "account" | InsightLevel

const VIEW_LEVELS = [
  { key: "account" as ViewLevel, label: "Account", icon: Target },
  { key: "campaign" as ViewLevel, label: "Campaigns", icon: Megaphone },
  { key: "adset" as ViewLevel, label: "Ad Sets", icon: LayoutGrid },
  { key: "ad" as ViewLevel, label: "Ads", icon: Image },
] as const

const METRICS = [
  { label: "Spend", key: "spend" },
  { label: "Leads", key: "leads" },
  { label: "CPL", key: "cpl" },
  { label: "CTR", key: "ctr" },
  { label: "CPC", key: "cpc" },
  { label: "Impr.", key: "impressions" },
  { label: "Reach", key: "reach" },
] as const

type MetricKey = (typeof METRICS)[number]["key"]

const CITY_COLORS = ["#2dd4bf", "#fbbf24", "#a78bfa", "#4ade80", "#fb923c", "#f87171", "#38bdf8", "#818cf8"]

// ── Helpers ──────────────────────────────────────────────

function fmtVal(key: MetricKey, value: number): string {
  switch (key) {
    case "spend":
    case "cpl":
    case "cpc":
      return formatCurrency(value)
    case "ctr":
      return `${value.toFixed(2)}%`
    default:
      return formatNumber(value)
  }
}

function metricLabel(key: MetricKey): string {
  return METRICS.find((m) => m.key === key)?.label || key
}

function cplColor(value: number): string {
  if (value < 300) return "#4ade80"
  if (value < 450) return "#fbbf24"
  return "#f87171"
}

// ── Skeleton ─────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md ${className}`}
      style={{ background: "var(--bg-muted)" }}
    />
  )
}

// ── Page ─────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("spend")
  const [viewLevel, setViewLevel] = useState<ViewLevel>("account")
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)

  // Drill-down: filter child entities by parent
  const [drillCampaign, setDrillCampaign] = useState<{ id: string; name: string } | null>(null)
  const [drillAdSet, setDrillAdSet] = useState<{ id: string; name: string } | null>(null)

  const adAccountId = useAppStore((s) => s.selectedAdAccountId)

  // Entity table data (campaigns / ad sets / ads) — fetched when on entity tabs
  const entityParentId = viewLevel === "adset" && drillCampaign ? drillCampaign.id
    : viewLevel === "ad" && drillAdSet ? drillAdSet.id
    : undefined
  const { data: entityData, isLoading: entityLoading } = useEntityInsights(
    viewLevel !== "account" ? adAccountId : null,
    viewLevel !== "account" ? viewLevel as InsightLevel : undefined,
    days,
    dateRange,
    entityParentId
  )

  // Auto-select first entity when data loads
  useEffect(() => {
    if (viewLevel !== "account" && entityData?.length && !selectedEntityId) {
      setSelectedEntityId(entityData[0].id)
    }
  }, [entityData, viewLevel, selectedEntityId])

  const selectedEntity = entityData?.find((e) => e.id === selectedEntityId) || null

  // The ID whose insights power all the charts: account or selected entity
  const insightsSourceId = viewLevel === "account" ? adAccountId : selectedEntityId

  // Chart + breakdown data — always fetched, scoped to insightsSourceId
  const { data: metricsData, isLoading: metricsLoading } = useAggregatedMetrics(insightsSourceId, days, dateRange)
  const { data: rawPlacements, isLoading: placementsLoading } = usePlacementBreakdown(insightsSourceId, days, dateRange)
  const { data: ageGenderData, isLoading: ageGenderLoading } = useAgeGenderBreakdown(insightsSourceId, days, dateRange)
  const { data: rawCities, isLoading: citiesLoading } = useCityBreakdown(insightsSourceId, days, dateRange)
  const { data: campaignsData, isLoading: campaignsLoading } = useCampaigns(adAccountId)
  const { data: adSetsData } = useAdSets(adAccountId)
  const { data: adsData } = useAds(adAccountId)

  // Deduplicate placements by name
  const placementsData = useMemo(() => {
    if (!rawPlacements?.length) return []
    const map = new Map<string, BreakdownMetrics>()
    for (const p of rawPlacements) {
      const cur = map.get(p.name)
      if (cur) {
        cur.spend += p.spend; cur.leads += p.leads; cur.impressions += p.impressions
        cur.clicks += p.clicks; cur.reach += p.reach
      } else {
        map.set(p.name, { spend: p.spend, leads: p.leads, impressions: p.impressions, clicks: p.clicks, reach: p.reach, cpl: 0, ctr: 0, cpc: 0 })
      }
    }
    return Array.from(map.entries())
      .map(([name, m]) => ({
        name,
        ...m,
        cpl: m.leads > 0 ? Math.round((m.spend / m.leads) * 100) / 100 : 0,
        ctr: m.impressions > 0 ? Math.round((m.clicks / m.impressions) * 10000) / 100 : 0,
        cpc: m.clicks > 0 ? Math.round((m.spend / m.clicks) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.spend - a.spend)
  }, [rawPlacements])

  // Deduplicate cities
  const citiesData = useMemo(() => {
    if (!rawCities?.length) return []
    const map = new Map<string, BreakdownMetrics>()
    for (const c of rawCities) {
      const cur = map.get(c.city)
      if (cur) {
        cur.spend += c.spend; cur.leads += c.leads; cur.impressions += c.impressions
        cur.clicks += c.clicks; cur.reach += c.reach
      } else {
        map.set(c.city, { spend: c.spend, leads: c.leads, impressions: c.impressions, clicks: c.clicks, reach: c.reach, cpl: 0, ctr: 0, cpc: 0 })
      }
    }
    return Array.from(map.entries())
      .map(([city, m]) => ({
        city,
        ...m,
        cpl: m.leads > 0 ? Math.round((m.spend / m.leads) * 100) / 100 : 0,
        ctr: m.impressions > 0 ? Math.round((m.clicks / m.impressions) * 10000) / 100 : 0,
        cpc: m.clicks > 0 ? Math.round((m.spend / m.clicks) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.spend - a.spend)
  }, [rawCities])

  // Summary KPIs from time series
  const summary = useMemo(() => {
    if (!metricsData?.length) return null
    const totalSpend = metricsData.reduce((s, m) => s + m.spend, 0)
    const totalLeads = metricsData.reduce((s, m) => s + m.leads, 0)
    const totalImpressions = metricsData.reduce((s, m) => s + m.impressions, 0)
    const totalClicks = metricsData.reduce((s, m) => s + m.clicks, 0)
    const totalReach = metricsData.reduce((s, m) => s + m.reach, 0)
    return {
      spend: totalSpend,
      leads: totalLeads,
      cpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      impressions: totalImpressions,
      reach: totalReach,
    }
  }, [metricsData])

  // ── Entity table sorting ──────────────────────────────────
  type EntitySortKey = keyof EntityInsight
  const [entitySortKey, setEntitySortKey] = useState<EntitySortKey>("spend")
  const [entitySortDir, setEntitySortDir] = useState<"asc" | "desc">("desc")

  function toggleEntitySort(key: EntitySortKey) {
    if (entitySortKey === key) setEntitySortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setEntitySortKey(key); setEntitySortDir("desc") }
  }

  const sortedEntities = useMemo(() => {
    if (!entityData?.length) return []
    return [...entityData].sort((a, b) => {
      let av = (a as any)[entitySortKey] ?? 0
      let bv = (b as any)[entitySortKey] ?? 0
      if (typeof av === "string") av = av.toLowerCase()
      if (typeof bv === "string") bv = bv.toLowerCase()
      if (av < bv) return entitySortDir === "asc" ? -1 : 1
      if (av > bv) return entitySortDir === "asc" ? 1 : -1
      return 0
    })
  }, [entityData, entitySortKey, entitySortDir])

  // Drill-down: navigate to child entities of the selected entity
  function handleDrill(entity: EntityInsight) {
    if (viewLevel === "campaign") {
      setDrillCampaign({ id: entity.id, name: entity.name })
      setDrillAdSet(null)
      setSelectedEntityId(null) // will auto-select first child
      setViewLevel("adset")
    } else if (viewLevel === "adset") {
      setDrillAdSet({ id: entity.id, name: entity.name })
      setSelectedEntityId(null)
      setViewLevel("ad")
    }
  }

  function handleLevelChange(level: ViewLevel) {
    setViewLevel(level)
    setSelectedEntityId(null) // reset selection for new level
    if (level === "account" || level === "campaign") { setDrillCampaign(null); setDrillAdSet(null) }
    if (level === "adset") setDrillAdSet(null)
  }

  // Sortable campaign table
  type SortKey = "name" | "status" | "amountSpent" | "leads" | "costPerLead" | "impressions" | "reach" | "ctr" | "cpc" | "cpm" | "dailyBudget"
  const [sortKey, setSortKey] = useState<SortKey>("amountSpent")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("desc") }
  }

  // Compute ctr/cpc for sorting since they're not on CampaignTableRow
  function getCampaignVal(c: (typeof allCampaigns)[number], key: SortKey): number | string {
    if (key === "ctr") return c.impressions > 0 ? (c.linkClicks / c.impressions) * 100 : 0
    if (key === "cpc") return c.linkClicks > 0 ? c.amountSpent / c.linkClicks : 0
    return (c as any)[key] ?? 0
  }

  const sortedCampaigns = useMemo(() => {
    const all = campaignsData?.data || []
    return [...all].sort((a, b) => {
      let av = getCampaignVal(a, sortKey)
      let bv = getCampaignVal(b, sortKey)
      if (typeof av === "string") av = av.toLowerCase()
      if (typeof bv === "string") bv = bv.toLowerCase()
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignsData, sortKey, sortDir])

  // ── Export Helpers ──────────────────────────────────────
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const dateLabel = dateRange ? `${dateRange.since} to ${dateRange.until}` : `Last ${days} Days`
  const filePrefix = dateRange
    ? `analytics_${dateRange.since}_${dateRange.until}`
    : `analytics_${days}d_${new Date().toISOString().split("T")[0]}`

  const downloadCSV = useCallback((filename: string, headers: string[], rows: string[][]) => {
    const escape = (v: string | number) => {
      const s = String(v)
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const metricsHeaders = ["Date", "Spend", "Leads", "CPL", "Impressions", "Clicks", "Reach", "CTR %", "CPC"]
  const metricsRows = useMemo(() =>
    (metricsData || []).map((m) => [m.date, m.spend, m.leads, m.cpl, m.impressions, m.clicks, m.reach, m.ctr, m.cpc].map(String)),
  [metricsData])

  const placementHeaders = ["Placement", "Spend", "Leads", "CPL", "Impressions", "Clicks", "Reach", "CTR %", "CPC"]
  const placementRows = useMemo(() =>
    placementsData.map((p) => [p.name, p.spend, p.leads, p.cpl, p.impressions, p.clicks, p.reach, p.ctr, p.cpc].map(String)),
  [placementsData])

  const ageGenderHeaders = ["Age", "Male Spend", "Male Leads", "Male CPL", "Male Impr.", "Male Clicks", "Male CTR %", "Male CPC", "Female Spend", "Female Leads", "Female CPL", "Female Impr.", "Female Clicks", "Female CTR %", "Female CPC"]
  const ageGenderRows = useMemo(() =>
    (ageGenderData || []).map((r) => [
      r.age,
      r.male.spend, r.male.leads, r.male.cpl, r.male.impressions, r.male.clicks, r.male.ctr, r.male.cpc,
      r.female.spend, r.female.leads, r.female.cpl, r.female.impressions, r.female.clicks, r.female.ctr, r.female.cpc,
    ].map(String)),
  [ageGenderData])

  const regionHeaders = ["Region", "Spend", "Leads", "CPL", "Impressions", "Clicks", "Reach", "CTR %", "CPC"]
  const regionRows = useMemo(() =>
    citiesData.map((c) => [c.city, c.spend, c.leads, c.cpl, c.impressions, c.clicks, c.reach, c.ctr, c.cpc].map(String)),
  [citiesData])

  const allCampaigns = campaignsData?.data || []
  const campaignHeaders = ["Campaign ID", "Campaign", "Status", "Spend", "Leads", "CPL", "Impressions", "Reach", "Clicks", "CTR %", "CPC", "CPM", "Daily Budget"]
  const campaignRows = useMemo(() =>
    allCampaigns.map((c) => {
      const ctr = c.impressions > 0 ? Math.round((c.linkClicks / c.impressions) * 10000) / 100 : 0
      const cpc = c.linkClicks > 0 ? Math.round((c.amountSpent / c.linkClicks) * 100) / 100 : 0
      return [c.id, c.name, c.status, c.amountSpent, c.leads, c.costPerLead ?? 0, c.impressions, c.reach, c.linkClicks, ctr, cpc, c.cpm, c.dailyBudget].map(String)
    }),
  [allCampaigns])

  const allAdSets = adSetsData?.data || []
  const adSetHeaders = ["Ad Set ID", "Ad Set", "Status", "Campaign ID", "Campaign", "Spend", "Leads", "CPL", "Impressions", "Reach", "Clicks", "CTR %", "CPC", "CPM", "Daily Budget"]
  const adSetRows = useMemo(() =>
    allAdSets.map((a) => [a.id, a.name, a.status, a.campaignId, a.campaignName, a.amountSpent, a.leads, a.costPerLead ?? 0, a.impressions, a.reach, a.clicks, a.ctr, a.cpc, a.cpm, a.dailyBudget].map(String)),
  [allAdSets])

  const allAds = adsData?.data || []
  const adHeaders = ["Ad ID", "Ad", "Status", "Ad Set ID", "Ad Set", "Spend", "Leads", "CPL", "Impressions", "Reach", "Clicks", "CTR %", "CPC", "CPM"]
  const adRows = useMemo(() =>
    allAds.map((a) => [a.id, a.name, a.status, a.adSetId, a.adSetName, a.amountSpent, a.leads, a.costPerLead ?? 0, a.impressions, a.reach, a.clicks, a.ctr, a.cpc, a.cpm].map(String)),
  [allAds])

  function exportFullXlsx() {
    import("xlsx").then((XLSX) => {
      const wb = XLSX.utils.book_new()

      const addSheet = (name: string, headers: string[], rows: string[][], nameColWidth = 32) => {
        if (!rows.length) return
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
        ws["!cols"] = headers.map((h, i) => ({
          wch: h.toLowerCase().includes("id") ? 22 : (i === 0 || h.toLowerCase().includes("name") || h.toLowerCase().includes("campaign") || h.toLowerCase().includes("ad set") || h.toLowerCase().includes("ad")) ? nameColWidth : 14,
        }))
        XLSX.utils.book_append_sheet(wb, ws, name)
      }

      // Account-level breakdowns
      addSheet("Daily Performance", metricsHeaders, metricsRows, 14)
      addSheet("Placements", placementHeaders, placementRows, 24)
      addSheet("Age & Gender", ageGenderHeaders, ageGenderRows, 14)
      addSheet("Regions", regionHeaders, regionRows, 20)

      // Entity-level data
      addSheet("Campaigns", campaignHeaders, campaignRows)
      addSheet("Ad Sets", adSetHeaders, adSetRows)
      addSheet("Ads", adHeaders, adRows)

      XLSX.writeFile(wb, `${filePrefix}_full_report.xlsx`)
    })
  }

  const hasAnyData = metricsRows.length > 0 || placementRows.length > 0 || (ageGenderData?.length ?? 0) > 0 || regionRows.length > 0 || campaignRows.length > 0 || adSetRows.length > 0 || adRows.length > 0

  const exportOptions = [
    { key: "daily", label: "Daily Performance", icon: BarChart3, disabled: !metricsRows.length, desc: `${metricsRows.length} days`, action: () => downloadCSV(`${filePrefix}_daily.csv`, metricsHeaders, metricsRows) },
    { key: "placement", label: "Placement Breakdown", icon: Layers, disabled: !placementRows.length, desc: `${placementRows.length} placements`, action: () => downloadCSV(`${filePrefix}_placements.csv`, placementHeaders, placementRows) },
    { key: "demographics", label: "Age & Gender", icon: Users, disabled: !ageGenderRows.length, desc: `${ageGenderRows.length} age groups`, action: () => downloadCSV(`${filePrefix}_demographics.csv`, ageGenderHeaders, ageGenderRows) },
    { key: "region", label: "Region Breakdown", icon: MapPin, disabled: !regionRows.length, desc: `${regionRows.length} regions`, action: () => downloadCSV(`${filePrefix}_regions.csv`, regionHeaders, regionRows) },
    { key: "divider1" } as any,
    { key: "campaigns", label: "Campaigns", icon: Megaphone, disabled: !campaignRows.length, desc: `${campaignRows.length} campaigns · with IDs`, action: () => downloadCSV(`${filePrefix}_campaigns.csv`, campaignHeaders, campaignRows) },
    { key: "adsets", label: "Ad Sets", icon: LayoutGrid, disabled: !adSetRows.length, desc: `${adSetRows.length} ad sets · with campaign info`, action: () => downloadCSV(`${filePrefix}_adsets.csv`, adSetHeaders, adSetRows) },
    { key: "ads", label: "Ads", icon: Image, disabled: !adRows.length, desc: `${adRows.length} ads · with ad set info`, action: () => downloadCSV(`${filePrefix}_ads.csv`, adHeaders, adRows) },
    { key: "divider2" } as any,
    { key: "full", label: "Full Report (.xlsx)", icon: FileSpreadsheet, disabled: !hasAnyData, desc: "All sheets including ad sets & ads", action: exportFullXlsx },
  ]

  // ── Tooltip ─────────────────────────────────────────────
  function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    const row = payload[0]?.payload || {}
    return (
      <div
        className="rounded-lg px-3 py-2.5 text-xs"
        style={{
          background: "#1a1a22",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}
      >
        <div className="mb-1.5 font-medium" style={{ color: "#ededf0" }}>
          {label}
        </div>
        <div className="flex flex-col gap-0.5">
          {([
            { k: "spend" as MetricKey, l: "Spend" },
            { k: "leads" as MetricKey, l: "Leads" },
            { k: "cpl" as MetricKey, l: "CPL" },
            { k: "impressions" as MetricKey, l: "Impr." },
            { k: "ctr" as MetricKey, l: "CTR" },
            { k: "cpc" as MetricKey, l: "CPC" },
          ] as const).map(({ k, l }) => (
            <div key={k} className="flex items-center justify-between gap-4">
              <span style={{ color: k === selectedMetric ? "#ededf0" : "#6b6b78" }}>{l}</span>
              <span
                className="font-mono font-semibold"
                style={{ color: k === selectedMetric ? "#2dd4bf" : "#a0a0aa" }}
              >
                {fmtVal(k, row[k] ?? 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function BreakdownTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    const row = payload[0]?.payload || {}
    return (
      <div
        className="rounded-lg px-3 py-2 text-xs"
        style={{
          background: "#1a1a22",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}
      >
        <div className="mb-1.5 font-medium" style={{ color: "#ededf0" }}>
          {label}
        </div>
        <div className="flex flex-col gap-0.5">
          {([
            { k: "spend" as MetricKey, l: "Spend" },
            { k: "leads" as MetricKey, l: "Leads" },
            { k: "cpl" as MetricKey, l: "CPL" },
            { k: "impressions" as MetricKey, l: "Impr." },
            { k: "ctr" as MetricKey, l: "CTR" },
          ] as const).map(({ k, l }) => (
            <div key={k} className="flex items-center justify-between gap-4">
              <span style={{ color: k === selectedMetric ? "#ededf0" : "#6b6b78" }}>{l}</span>
              <span
                className="font-mono font-semibold"
                style={{ color: k === selectedMetric ? "#2dd4bf" : "#a0a0aa" }}
              >
                {fmtVal(k, row[k] ?? 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Analytics
        </h1>

        {/* Export dropdown */}
        <div ref={exportRef} className="relative">
          <button
            onClick={() => setExportOpen((v) => !v)}
            disabled={!hasAnyData}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40"
            style={{
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
              background: exportOpen ? "var(--bg-subtle)" : "transparent",
            }}
          >
            <Download size={13} />
            Export
            <ChevronDown size={12} className={`transition-transform ${exportOpen ? "rotate-180" : ""}`} />
          </button>

          {exportOpen && (
            <div
              className="absolute right-0 z-50 mt-1.5 w-[260px] rounded-lg py-1.5 shadow-xl"
              style={{
                background: "var(--bg-base)",
                border: "1px solid var(--border-default)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              }}
            >
              <div className="px-3 pb-1.5 pt-1">
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  Export — {dateLabel}
                </span>
              </div>
              {exportOptions.map((opt) =>
                opt.key.startsWith("divider") ? (
                  <div key={opt.key} className="mx-3 my-1" style={{ borderTop: "1px solid var(--border-subtle)" }} />
                ) : (
                  <button
                    key={opt.key}
                    disabled={opt.disabled}
                    onClick={() => { opt.action(); setExportOpen(false) }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors disabled:opacity-30"
                    style={{ color: "var(--text-primary)" }}
                    onMouseEnter={(e) => {
                      if (!opt.disabled) e.currentTarget.style.background = "var(--bg-subtle)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent"
                    }}
                  >
                    <opt.icon size={14} style={{ color: opt.key === "full" ? "var(--acc)" : "var(--text-tertiary)", flexShrink: 0 }} />
                    <div className="flex flex-1 flex-col">
                      <span className={`text-xs font-medium ${opt.key === "full" ? "" : ""}`}
                        style={{ color: opt.key === "full" ? "var(--acc-text)" : "var(--text-primary)" }}
                      >
                        {opt.label}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                        {opt.desc}
                      </span>
                    </div>
                    <Download size={11} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-2.5 rounded-lg px-4 py-2.5"
        style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
      >
        {/* Row 1: Level tabs + Date range */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5 rounded-md p-0.5" style={{ background: "var(--bg-subtle)" }}>
            {VIEW_LEVELS.map((l) => {
              const active = viewLevel === l.key
              return (
                <button
                  key={l.key}
                  onClick={() => handleLevelChange(l.key)}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-all"
                  style={{
                    background: active ? "var(--bg-base)" : "transparent",
                    color: active ? "var(--acc-text)" : "var(--text-tertiary)",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                  }}
                >
                  <l.icon size={12} />
                  {l.label}
                </button>
              )
            })}
          </div>
          <DateRangePicker
            days={days}
            dateRange={dateRange}
            onPreset={(d) => { setDays(d); setDateRange(undefined) }}
            onCustomRange={(r) => setDateRange(r)}
          />
        </div>

        {/* Row 2: Metric selector (all tabs) */}
        <div className="flex items-center gap-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className="rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors"
              style={{
                background: selectedMetric === m.key ? "var(--acc-subtle)" : "transparent",
                color: selectedMetric === m.key ? "var(--acc-text)" : "var(--text-tertiary)",
                border: selectedMetric === m.key ? "1px solid var(--acc-border)" : "1px solid transparent",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ ENTITY SELECTOR (Campaigns / Ad Sets / Ads tabs) ═══════ */}
      {viewLevel !== "account" && (
        <div
          className="overflow-hidden rounded-lg"
          style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                Select {viewLevel === "campaign" ? "Campaign" : viewLevel === "adset" ? "Ad Set" : "Ad"}
              </span>
              {entityData && (
                <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  ({entityData.length})
                </span>
              )}
            </div>
            {/* Breadcrumb */}
            {(drillCampaign || drillAdSet) && (
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  onClick={() => handleLevelChange("campaign")}
                  className="font-medium hover:underline"
                  style={{ color: "var(--acc)" }}
                >
                  All Campaigns
                </button>
                {drillCampaign && (
                  <>
                    <ChevronRight size={9} style={{ color: "var(--text-tertiary)" }} />
                    <button
                      onClick={() => { setDrillAdSet(null); setSelectedEntityId(null); setViewLevel("adset"); }}
                      className="max-w-[140px] truncate font-medium hover:underline"
                      style={{ color: drillAdSet ? "var(--acc)" : "var(--text-secondary)" }}
                    >
                      {drillCampaign.name}
                    </button>
                  </>
                )}
                {drillAdSet && (
                  <>
                    <ChevronRight size={9} style={{ color: "var(--text-tertiary)" }} />
                    <span className="max-w-[140px] truncate font-medium" style={{ color: "var(--text-secondary)" }}>
                      {drillAdSet.name}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          {entityLoading ? (
            <div className="space-y-1 px-4 pb-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : sortedEntities.length > 0 ? (
            <div className="max-h-[220px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10" style={{ background: "var(--bg-muted)" }}>
                  <tr>
                    {([
                      { key: "name" as EntitySortKey, label: viewLevel === "campaign" ? "Campaign" : viewLevel === "adset" ? "Ad Set" : "Ad", align: "left" },
                      ...(viewLevel !== "campaign" ? [{ key: "parentName" as EntitySortKey, label: viewLevel === "adset" ? "Campaign" : "Ad Set", align: "left" as const }] : []),
                      { key: "spend" as EntitySortKey, label: "Spend", align: "right" as const },
                      { key: "leads" as EntitySortKey, label: "Leads", align: "right" as const },
                      { key: "cpl" as EntitySortKey, label: "CPL", align: "right" as const },
                      { key: "impressions" as EntitySortKey, label: "Impr.", align: "right" as const },
                      { key: "ctr" as EntitySortKey, label: "CTR", align: "right" as const },
                      { key: "cpc" as EntitySortKey, label: "CPC", align: "right" as const },
                    ] as const).map((col) => (
                      <th
                        key={col.key}
                        onClick={() => toggleEntitySort(col.key)}
                        className={`cursor-pointer select-none whitespace-nowrap px-3 py-2 text-${col.align} text-[10px] font-medium uppercase tracking-[0.06em]`}
                        style={{
                          color: entitySortKey === col.key ? "var(--acc-text)" : "var(--text-tertiary)",
                          borderBottom: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span className="inline-flex items-center gap-0.5">
                          {col.label}
                          {entitySortKey === col.key && (entitySortDir === "desc" ? <ArrowDown size={9} /> : <ArrowUp size={9} />)}
                        </span>
                      </th>
                    ))}
                    {viewLevel !== "ad" && (
                      <th className="w-8 px-2 py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }} />
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedEntities.map((entity, i) => {
                    const isSelected = entity.id === selectedEntityId
                    const canDrill = viewLevel === "campaign" || viewLevel === "adset"
                    return (
                      <tr
                        key={entity.id}
                        onClick={() => setSelectedEntityId(entity.id)}
                        className="cursor-pointer transition-colors"
                        style={{
                          background: isSelected ? "var(--acc-subtle)" : "transparent",
                          borderBottom: i < sortedEntities.length - 1 ? "1px solid var(--border-subtle)" : "none",
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--bg-subtle)" }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent" }}
                      >
                        <td className="px-3 py-2">
                          <span
                            className="max-w-[200px] truncate text-xs font-medium inline-block"
                            style={{ color: isSelected ? "var(--acc-text)" : "var(--text-primary)" }}
                          >
                            {entity.name}
                          </span>
                        </td>
                        {viewLevel !== "campaign" && (
                          <td className="max-w-[120px] truncate px-3 py-2 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                            {entity.parentName || "—"}
                          </td>
                        )}
                        <td className="whitespace-nowrap px-3 py-2 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                          {entity.spend > 0 ? formatCurrency(entity.spend) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                          {entity.leads > 0 ? formatNumber(entity.leads) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-mono font-semibold" style={{ color: entity.cpl > 0 ? cplColor(entity.cpl) : "var(--text-tertiary)" }}>
                          {entity.cpl > 0 ? formatCurrency(entity.cpl) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                          {entity.impressions > 0 ? formatNumber(entity.impressions) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                          {entity.ctr > 0 ? `${entity.ctr.toFixed(2)}%` : "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                          {entity.cpc > 0 ? formatCurrency(entity.cpc) : "—"}
                        </td>
                        {viewLevel !== "ad" && (
                          <td className="px-2 py-2 text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDrill(entity) }}
                              className="rounded p-0.5 transition-colors hover:bg-[var(--bg-muted)]"
                              title={`View ${viewLevel === "campaign" ? "ad sets" : "ads"}`}
                            >
                              <ChevronRight size={12} style={{ color: "var(--text-tertiary)" }} />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-16 items-center justify-center">
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                No data for this period
              </span>
            </div>
          )}
        </div>
      )}

      {/* ═══════ SHARED ANALYTICS (all tabs) ═══════ */}

      {/* Selected entity label */}
      {viewLevel !== "account" && selectedEntity && (
        <div className="flex items-center gap-2">
          <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
            {selectedEntity.name}
          </span>
          <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
        </div>
      )}

      {/* ── Summary KPIs ─────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-4 gap-3 lg:grid-cols-7">
          {([
            { label: "Total Spend", value: formatCurrency(summary.spend) },
            { label: "Leads", value: formatNumber(summary.leads) },
            { label: "Avg CPL", value: formatCurrency(summary.cpl) },
            { label: "Avg CTR", value: `${summary.ctr.toFixed(2)}%` },
            { label: "Avg CPC", value: formatCurrency(summary.cpc) },
            { label: "Impressions", value: formatNumber(summary.impressions) },
            { label: "Reach", value: formatNumber(summary.reach) },
          ] as const).map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg px-3 py-2.5"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
            >
              <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                {kpi.label}
              </div>
              <div className="mt-0.5 font-mono text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {kpi.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Main Chart ──────────────────────────────────────── */}
      <div
        className="rounded-lg p-5"
        style={{
          background: "var(--bg-base)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          {metricLabel(selectedMetric)} — {dateLabel}
        </div>
        {metricsLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : metricsData && metricsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={metricsData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#55555f" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) => {
                  const d = new Date(v)
                  return `${d.getDate()}/${d.getMonth() + 1}`
                }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#55555f" }}
                tickLine={false}
                axisLine={false}
                width={50}
                tickFormatter={(v: number) =>
                  selectedMetric === "ctr" ? `${v}%` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke="#2dd4bf"
                strokeWidth={2}
                fill="url(#tealGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#2dd4bf", stroke: "#111116", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[280px] items-center justify-center">
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              No data — sync your ad account to see analytics
            </span>
          </div>
        )}
      </div>

      {/* ── Breakdown Row ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* By Placement */}
        <div
          className="rounded-lg p-4"
          style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
        >
          <div className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
            {metricLabel(selectedMetric)} by Placement
          </div>
          {placementsLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : placementsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={placementsData} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 9, fill: "#55555f" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => selectedMetric === "ctr" ? `${v}%` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 9, fill: "#a0a0aa" }}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip content={<BreakdownTooltip />} />
                <Bar dataKey={selectedMetric} radius={[0, 4, 4, 0]} fill="#a78bfa" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center">
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>No data</span>
            </div>
          )}
        </div>

        {/* By Age & Gender */}
        <div
          className="rounded-lg p-4"
          style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
        >
          <div className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
            {metricLabel(selectedMetric)} by Age & Gender
          </div>
          {ageGenderLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : ageGenderData && ageGenderData.length > 0 ? (
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ color: "var(--text-tertiary)" }}>
                  <th className="pb-2 text-left font-medium">Age</th>
                  <th className="pb-2 text-right font-medium">Male</th>
                  <th className="pb-2 text-right font-medium">Female</th>
                </tr>
              </thead>
              <tbody>
                {ageGenderData.map((row) => {
                  const maleVal = row.male[selectedMetric as keyof BreakdownMetrics]
                  const femaleVal = row.female[selectedMetric as keyof BreakdownMetrics]
                  return (
                    <tr key={row.age} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <td className="py-1.5 font-mono" style={{ color: "var(--text-secondary)" }}>
                        {row.age}
                      </td>
                      <td
                        className="py-1.5 text-right font-mono font-semibold"
                        style={{ color: selectedMetric === "cpl" ? cplColor(maleVal) : "var(--text-primary)" }}
                      >
                        {fmtVal(selectedMetric, maleVal)}
                      </td>
                      <td
                        className="py-1.5 text-right font-mono font-semibold"
                        style={{ color: selectedMetric === "cpl" ? cplColor(femaleVal) : "var(--text-primary)" }}
                      >
                        {fmtVal(selectedMetric, femaleVal)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex h-[200px] items-center justify-center">
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>No data</span>
            </div>
          )}
        </div>

        {/* By City */}
        <div
          className="rounded-lg p-4"
          style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
        >
          <div className="mb-3 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
            {metricLabel(selectedMetric)} by Region
          </div>
          {citiesLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : citiesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={citiesData} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="city" tick={{ fontSize: 9, fill: "#a0a0aa" }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 9, fill: "#55555f" }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tickFormatter={(v: number) => selectedMetric === "ctr" ? `${v}%` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                />
                <Tooltip content={<BreakdownTooltip />} />
                <Bar dataKey={selectedMetric} radius={[4, 4, 0, 0]}>
                  {citiesData.map((_, i) => (
                    <Cell key={i} fill={CITY_COLORS[i % CITY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center">
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>No data</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Campaign Comparison (account tab only) ──── */}
      {viewLevel === "account" && (
      <div
        className="overflow-hidden rounded-lg"
        style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
            Campaign Comparison — All ({sortedCampaigns.length})
          </div>
          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            Click column headers to sort
          </span>
        </div>
        {campaignsLoading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : sortedCampaigns.length > 0 ? (
          <div className="max-h-[400px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10" style={{ background: "var(--bg-muted)" }}>
                <tr>
                  {([
                    { key: "name" as SortKey, label: "Campaign", align: "left" },
                    { key: "status" as SortKey, label: "Status", align: "left" },
                    { key: "amountSpent" as SortKey, label: "Spend", align: "right" },
                    { key: "leads" as SortKey, label: "Leads", align: "right" },
                    { key: "costPerLead" as SortKey, label: "CPL", align: "right" },
                    { key: "impressions" as SortKey, label: "Impr.", align: "right" },
                    { key: "reach" as SortKey, label: "Reach", align: "right" },
                    { key: "ctr" as SortKey, label: "CTR", align: "right" },
                    { key: "cpc" as SortKey, label: "CPC", align: "right" },
                    { key: "cpm" as SortKey, label: "CPM", align: "right" },
                    { key: "dailyBudget" as SortKey, label: "Budget", align: "right" },
                  ] as const).map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className={`cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-${col.align} text-[10px] font-medium uppercase tracking-[0.06em]`}
                      style={{
                        color: sortKey === col.key ? "var(--acc-text)" : "var(--text-tertiary)",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span className="inline-flex items-center gap-0.5">
                        {col.label}
                        {sortKey === col.key && (
                          sortDir === "desc"
                            ? <ArrowDown size={10} />
                            : <ArrowUp size={10} />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCampaigns.map((c, i) => {
                  const ctr = c.impressions > 0 ? (c.linkClicks / c.impressions) * 100 : 0
                  const cpc = c.linkClicks > 0 ? c.amountSpent / c.linkClicks : 0
                  return (
                    <tr
                      key={c.id}
                      style={{ borderBottom: i < sortedCampaigns.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                      className="transition-colors"
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-subtle)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                    >
                      <td className="max-w-[220px] truncate px-3 py-2 font-medium" style={{ color: "var(--text-primary)" }}>
                        {c.name}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            background: c.isActive ? "var(--green-bg)" : "var(--bg-muted)",
                            color: c.isActive ? "var(--green-text)" : "var(--text-tertiary)",
                          }}
                        >
                          <span className="h-1 w-1 rounded-full" style={{ background: "currentColor" }} />
                          {c.isActive ? "Active" : c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                        {c.amountSpent > 0 ? formatCurrency(c.amountSpent) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                        {c.leads > 0 ? formatNumber(c.leads) : "—"}
                      </td>
                      <td
                        className="whitespace-nowrap px-3 py-2 text-right font-mono font-semibold"
                        style={{ color: c.costPerLead ? cplColor(c.costPerLead) : "var(--text-tertiary)" }}
                      >
                        {c.costPerLead ? formatCurrency(c.costPerLead) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                        {c.impressions > 0 ? formatNumber(c.impressions) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                        {c.reach > 0 ? formatNumber(c.reach) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                        {ctr > 0 ? `${ctr.toFixed(2)}%` : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                        {cpc > 0 ? formatCurrency(cpc) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                        {c.cpm > 0 ? formatCurrency(c.cpm) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                        {c.dailyBudget > 0 ? formatCurrency(c.dailyBudget) : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-20 items-center justify-center">
            <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              No campaigns — sync your ad account
            </span>
          </div>
        )}
      </div>
      )}
    </div>
  )
}
