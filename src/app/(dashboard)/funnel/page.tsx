"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-fetch"
import { useAppStore } from "@/lib/store"
import { usePlatform } from "@/hooks/use-platform"
import { useCrmLeads, type CrmLead } from "@/hooks/use-crm"
import { DateRangePicker, presetRange } from "@/components/ui/DateRangePicker"
import type { DateRange } from "@/hooks/use-campaigns"
import {
  ArrowDown, Filter, Eye, MousePointerClick, UserCheck,
  TrendingUp, ChevronRight, ChevronDown, Users,
  Search, Facebook, Globe,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────

interface FunnelStage {
  stage: string
  count: number
  dropoff: number
}

interface CampaignBreakdown {
  campaignId: string
  campaignName: string
  impressions: number
  clicks: number
  leads: number
  spend: number
  cpl: number | null
}

interface CrmStageData {
  stage: string
  tier: string
  count: number
}

interface FunnelData {
  funnel: FunnelStage[]
  campaignBreakdown: CampaignBreakdown[]
  crmStages?: CrmStageData[]
  totals: {
    reach: number
    impressions: number
    clicks: number
    leads: number
    totalSpend: number
    crmLeads: number
  }
}

// ── Helpers ────────────────────────────────────────────

import { fmtCompact as fmt, fmtInr as fmtCurrency, conversionRate, fmtDateShort as formatDate } from "@/lib/format"

const CRM_TIERS = new Set(["Converted", "High", "Medium", "Low", "Junk", "Unknown"])

const stageConfig: Record<string, { color: string; gradient: string; icon: typeof Eye }> = {
  Reach:             { color: "#38bdf8", gradient: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)", icon: Users },
  Impressions:       { color: "#60a5fa", gradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)", icon: Eye },
  Clicks:            { color: "#818cf8", gradient: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)", icon: MousePointerClick },
  "Leads / Results": { color: "#a78bfa", gradient: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)", icon: UserCheck },
  Conversions:       { color: "#a78bfa", gradient: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)", icon: UserCheck },
  Converted:         { color: "#4ade80", gradient: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)", icon: TrendingUp },
  High:              { color: "#60a5fa", gradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)", icon: TrendingUp },
  Medium:            { color: "#fbbf24", gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)", icon: TrendingUp },
  Low:               { color: "#fb923c", gradient: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)", icon: TrendingUp },
  Junk:              { color: "#f87171", gradient: "linear-gradient(135deg, #f87171 0%, #ef4444 100%)", icon: TrendingUp },
}

const tierColors: Record<string, string> = {
  Converted: "#4ade80",
  High: "#60a5fa",
  Medium: "#fbbf24",
  Low: "#fb923c",
  Junk: "#f87171",
  Unknown: "#9ca3af",
}

// Colors for actual CRM stages — cycle through a palette
const CRM_STAGE_PALETTE = ["#60a5fa", "#4ade80", "#fbbf24", "#fb923c", "#f87171", "#a78bfa", "#38bdf8", "#818cf8", "#f472b6", "#34d399"]
const stageColors: Record<string, string> = {}
function getStageColor(stage: string, index?: number): string {
  if (!stageColors[stage]) {
    const idx = index ?? Object.keys(stageColors).length
    stageColors[stage] = CRM_STAGE_PALETTE[idx % CRM_STAGE_PALETTE.length]
  }
  return stageColors[stage]
}

function getStageConfig(stage: string) {
  return stageConfig[stage] || { color: "#9ca3af", gradient: "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)", icon: TrendingUp }
}

// ── Main ───────────────────────────────────────────────

export default function FunnelPage() {
  const adAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { platform } = usePlatform()

  const isGoogle = platform === "google"
  // Always use Meta ad account ID for funnel (CRM is linked to Meta account)
  const accountId = adAccountId

  // Date range state
  const [days, setDays] = useState(30)
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined)

  const dateFrom = customRange?.since ?? presetRange(days).since
  const dateTo = customRange?.until ?? presetRange(days).until

  // Expanded CRM stage drill-down
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [leadSearch, setLeadSearch] = useState("")

  // Funnel data
  const { data, isLoading } = useQuery<{ data: FunnelData | null }>({
    queryKey: ["funnel", accountId, platform, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (accountId) params.set("adAccountId", accountId)
      params.set("platform", platform)
      params.set("from", dateFrom)
      params.set("to", dateTo)
      const res = await apiFetch(`/api/crm/insights/funnel?${params}`)
      return res.json()
    },
    enabled: !!accountId,
  })

  // Fetch all leads for CRM drill-down (up to 1000)
  const { data: leadsData, isLoading: leadsLoading } = useCrmLeads(accountId, {
    pageSize: 1000,
    platform,
    from: dateFrom,
    to: dateTo,
  })

  const funnel = useMemo(() => data?.data?.funnel || [], [data])
  const breakdown = useMemo(() => data?.data?.campaignBreakdown || [], [data])
  const totals = data?.data?.totals
  const allLeads = useMemo(() => leadsData?.data || [], [leadsData])

  const metaStages = useMemo(() => funnel.filter((s) => !CRM_TIERS.has(s.stage)), [funnel])
  const crmStages = useMemo(() => funnel.filter((s) => CRM_TIERS.has(s.stage)), [funnel])
  const metaMax = Math.max(...metaStages.map((s) => s.count), 1)
  const crmMax = Math.max(...crmStages.map((s) => s.count), 1)

  // Build campaign lookup from breakdown data
  const campaignMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const c of breakdown) {
      map[c.campaignId] = c.campaignName
    }
    return map
  }, [breakdown])

  // Group leads by CRM stage
  const leadsByStage = useMemo(() => {
    const grouped: Record<string, CrmLead[]> = {}
    for (const lead of allLeads) {
      const stage = lead.crmStage || "Unknown"
      if (!grouped[stage]) grouped[stage] = []
      grouped[stage].push(lead)
    }
    return grouped
  }, [allLeads])

  // CRM stage view toggle: actual CRM stages vs quality tiers
  const [stageView, setStageView] = useState<"crmStage" | "tier">("crmStage")

  // Actual CRM stages from backend (e.g., Dead, Qualified, Contacted, New)
  const backendCrmStages = useMemo(() => data?.data?.crmStages || [], [data])

  // Build CRM stage rows based on selected view
  const crmStageRows = useMemo(() => {
    if (stageView === "crmStage") {
      // Use actual CRM stages from backend or derive from leads
      const stagesSource = backendCrmStages.length > 0
        ? backendCrmStages.map((s: { stage: string; count: number }) => ({ stage: s.stage, count: s.count }))
        : Object.entries(leadsByStage).map(([stage, leads]) => ({ stage, count: leads.length }))

      const total = stagesSource.reduce((sum: number, s: { stage: string; count: number }) => sum + s.count, 0)
      return stagesSource
        .map((s: { stage: string; count: number }) => ({
          stage: s.stage,
          count: s.count,
          pct: total > 0 ? (s.count / total) * 100 : 0,
          color: getStageColor(s.stage),
        }))
        .sort((a, b) => b.count - a.count)
    } else {
      // Quality tier view (High/Medium/Low/Junk)
      const totalCount = crmStages.reduce((sum, s) => sum + s.count, 0)
      return crmStages.map((s) => ({
        stage: s.stage,
        count: s.count,
        pct: totalCount > 0 ? (s.count / totalCount) * 100 : 0,
        color: tierColors[s.stage] || "#9ca3af",
      }))
    }
  }, [stageView, backendCrmStages, leadsByStage, crmStages])

  // Filtered leads for expanded stage
  const filteredLeads = useMemo(() => {
    if (!expandedStage) return []
    const stageName = expandedStage
    // Match leads based on current view mode
    const leads = allLeads.filter((l) => {
      if (stageView === "crmStage") {
        return (l.crmStage || "Unknown") === stageName
      }
      // Tier view: match by qualityTier (capitalize first letter for comparison)
      const tier = l.qualityTier ? l.qualityTier.charAt(0).toUpperCase() + l.qualityTier.slice(1) : "Unknown"
      return tier === stageName
    })
    if (!leadSearch.trim()) return leads
    const q = leadSearch.toLowerCase()
    return leads.filter(
      (l) =>
        (l.firstName && l.firstName.toLowerCase().includes(q)) ||
        (l.lastName && l.lastName.toLowerCase().includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.phone && l.phone.includes(q))
    )
  }, [expandedStage, allLeads, leadSearch, stageView])

  const pipelineLabel = isGoogle ? "Google Ads Pipeline" : "Meta Ads Pipeline"
  const crmLabel = isGoogle ? "CRM Quality (Google Leads)" : "CRM Quality (Meta Leads)"

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isGoogle ? (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "rgba(66, 133, 244, 0.12)" }}
              >
                <Globe size={16} style={{ color: "#4285F4" }} />
              </div>
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "rgba(24, 119, 242, 0.12)" }}
              >
                <Facebook size={16} style={{ color: "#1877F2" }} />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                {isGoogle ? "Google Ads Funnel" : "Conversion Funnel"}
              </h2>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {isGoogle
                  ? "Full journey from Google ad impression to CRM outcome."
                  : "Full journey from ad impression to CRM outcome. Meta-attributed leads only."}
              </p>
            </div>
          </div>

          {totals && totals.leads > 0 && totals.totalSpend > 0 && (
            <div
              className="flex items-center gap-4 rounded-lg px-5 py-3"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
            >
              <MiniStat label="Spend" value={fmtCurrency(totals.totalSpend)} />
              <div className="h-8 w-px" style={{ background: "var(--border-subtle)" }} />
              <MiniStat label="Conv. Rate" value={conversionRate(totals.clicks, totals.leads)} />
              <div className="h-8 w-px" style={{ background: "var(--border-subtle)" }} />
              <MiniStat label="CPL" value={totals.leads > 0 ? fmtCurrency(totals.totalSpend / totals.leads) : "\u2014"} />
            </div>
          )}
        </div>

        {/* Date range + Stage view toggle */}
        <div className="flex items-center justify-between gap-4">
          <DateRangePicker
            days={days}
            dateRange={customRange}
            onPreset={(d) => { setDays(d); setCustomRange(undefined) }}
            onCustomRange={(r) => setCustomRange(r)}
          />
          <div className="flex items-center gap-1 rounded-lg p-0.5 shrink-0" style={{ background: "var(--bg-muted)" }}>
            <button
              onClick={() => { setStageView("crmStage"); setExpandedStage(null) }}
              className="rounded-md px-3 py-1.5 text-[11px] font-medium transition-all"
              style={{
                background: stageView === "crmStage" ? "var(--bg-base)" : "transparent",
                color: stageView === "crmStage" ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: stageView === "crmStage" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
              }}
            >
              CRM Stages
            </button>
            <button
              onClick={() => { setStageView("tier"); setExpandedStage(null) }}
              className="rounded-md px-3 py-1.5 text-[11px] font-medium transition-all"
              style={{
                background: stageView === "tier" ? "var(--bg-base)" : "transparent",
                color: stageView === "tier" ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: stageView === "tier" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
              }}
            >
              Quality Tiers
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <FunnelSkeleton />
      ) : funnel.length === 0 ? (
        <EmptyState isGoogle={isGoogle} />
      ) : (
        <div className="flex flex-col gap-5">
          {/* Funnel visualization */}
          <div>
            {/* Ad pipeline stages */}
            <SectionLabel label={pipelineLabel} />
            <div
              className="mb-4 rounded-lg p-5"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
            >
              {metaStages.map((stage, i) => (
                <FunnelRow
                  key={stage.stage}
                  stage={stage}
                  maxCount={metaMax}
                  prevCount={i > 0 ? metaStages[i - 1].count : 0}
                  isLast={i === metaStages.length - 1 && crmStages.length === 0}
                />
              ))}
            </div>

            {/* CRM distribution bar — switches between tiers and stages based on toggle */}
            {(crmStages.length > 0 || crmStageRows.length > 0) && (
              <>
                <SectionLabel label={stageView === "crmStage"
                  ? (isGoogle ? "CRM Stages (Google Leads)" : "CRM Stages (Meta Leads)")
                  : crmLabel
                } />
                <div
                  className="rounded-lg p-5"
                  style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
                >
                  {/* Stacked bar — shows whichever view is active */}
                  <div className="mb-4">
                    <div className="flex h-10 overflow-hidden rounded-lg">
                      {(stageView === "crmStage" ? crmStageRows : crmStages.map(s => ({ stage: s.stage, count: s.count, pct: 0, color: tierColors[s.stage] || "#9ca3af" }))).map((s, i) => {
                        const total = (stageView === "crmStage" ? crmStageRows : crmStages).reduce((sum: number, x: { count: number }) => sum + x.count, 0)
                        const pct = total > 0 ? (s.count / total) * 100 : 0
                        if (s.count === 0) return null
                        const color = s.color || getStageColor(s.stage, i)
                        const displayPct = Math.max(3, pct)
                        return (
                          <div
                            key={s.stage}
                            className="flex items-center justify-center text-[10px] font-bold text-white transition-all"
                            style={{
                              width: `${displayPct}%`,
                              background: color,
                              opacity: 0.85,
                            }}
                            title={`${s.stage}: ${s.count} (${pct.toFixed(1)}%)`}
                          >
                            {pct > 8 ? `${s.stage} ${Math.round(pct)}%` : pct > 3 ? `${Math.round(pct)}%` : ""}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Individual rows — tiers or CRM stages */}
                  {(stageView === "tier" ? crmStages : []).map((stage, i) => (
                    <FunnelRow
                      key={stage.stage}
                      stage={stage}
                      maxCount={crmMax}
                      prevCount={i > 0 ? crmStages[i - 1].count : 0}
                      isLast={i === crmStages.length - 1}
                      compact
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── CRM Stage Drill-Down ─────────────────────── */}
          {crmStageRows.length > 0 && (
            <div>
              <SectionLabel label={stageView === "crmStage" ? "CRM Stages" : "Quality Tiers"} />
              <div
                className="rounded-lg overflow-hidden"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
              >
                {crmStageRows.map((row) => {
                  const isExpanded = expandedStage === row.stage
                  const barWidth = Math.max(4, row.pct)

                  return (
                    <div key={row.stage}>
                      {/* Stage row */}
                      <button
                        onClick={() => {
                          setExpandedStage(isExpanded ? null : row.stage)
                          setLeadSearch("")
                        }}
                        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors"
                        style={{
                          background: isExpanded ? "var(--bg-subtle)" : "transparent",
                          borderBottom: "1px solid var(--border-subtle)",
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded) e.currentTarget.style.background = "var(--bg-subtle)"
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) e.currentTarget.style.background = "transparent"
                        }}
                      >
                        {/* Expand icon */}
                        <div
                          className="flex h-5 w-5 shrink-0 items-center justify-center transition-transform"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>

                        {/* Quality tier color dot */}
                        <div
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ background: row.color }}
                        />

                        {/* Stage name */}
                        <span className="min-w-[120px] text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                          {row.stage}
                        </span>

                        {/* Lead count */}
                        <span className="font-mono text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                          {row.count} {row.count === 1 ? "lead" : "leads"}
                        </span>

                        {/* Percentage */}
                        <span className="ml-auto font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {row.pct.toFixed(0)}%
                        </span>

                        {/* Mini bar */}
                        <div className="w-28 shrink-0">
                          <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--border-subtle)" }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${barWidth}%`, background: row.color }}
                            />
                          </div>
                        </div>
                      </button>

                      {/* Expanded: lead details */}
                      {isExpanded && (
                        <div
                          className="px-5 py-4"
                          style={{
                            background: "var(--bg-subtle)",
                            borderBottom: "1px solid var(--border-subtle)",
                          }}
                        >
                          {/* Search bar */}
                          <div className="mb-3">
                            <div
                              className="flex items-center gap-2 rounded-lg px-3 py-2"
                              style={{
                                background: "var(--bg-base)",
                                border: "1px solid var(--border-default)",
                              }}
                            >
                              <Search size={13} style={{ color: "var(--text-disabled)" }} />
                              <input
                                type="text"
                                placeholder="Search leads..."
                                value={leadSearch}
                                onChange={(e) => setLeadSearch(e.target.value)}
                                className="flex-1 bg-transparent text-xs outline-none"
                                style={{ color: "var(--text-primary)" }}
                              />
                            </div>
                          </div>

                          {leadsLoading ? (
                            <div className="py-6 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
                              Loading leads...
                            </div>
                          ) : filteredLeads.length === 0 ? (
                            <div className="py-6 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
                              {leadSearch ? "No leads match your search" : "No leads in this stage"}
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr>
                                    {["Name", "Phone", "Email", "Campaign", isGoogle ? "Keyword" : null, "Source", "Score", "Date"].filter(Boolean).map((h) => (
                                      <th
                                        key={h}
                                        className="whitespace-nowrap px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider"
                                        style={{ color: "var(--text-tertiary)", borderBottom: "1px solid var(--border-subtle)" }}
                                      >
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredLeads.map((lead) => {
                                    const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "\u2014"
                                    const campaign = lead.campaignId ? (campaignMap[lead.campaignId] || lead.campaignId) : "\u2014"
                                    const truncatedCampaign = campaign.length > 20 ? campaign.slice(0, 18) + "..." : campaign

                                    return (
                                      <tr
                                        key={lead.id}
                                        className="transition-colors"
                                        style={{ borderBottom: "1px solid var(--border-subtle)" }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = "var(--bg-base)"
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = "transparent"
                                        }}
                                      >
                                        <td className="whitespace-nowrap px-3 py-2.5 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                                          {name}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                                          {lead.phone || "\u2014"}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                                          {lead.email || "\u2014"}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }} title={campaign}>
                                          {truncatedCampaign}
                                        </td>
                                        {isGoogle && (
                                          <td className="whitespace-nowrap px-3 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                                            {lead.utmTerm ? (
                                              <span
                                                className="rounded px-1.5 py-0.5 font-mono text-[11px]"
                                                style={{ background: "var(--bg-muted)", color: "var(--text-primary)" }}
                                              >
                                                &quot;{lead.utmTerm}&quot;
                                              </span>
                                            ) : "\u2014"}
                                          </td>
                                        )}
                                        <td className="whitespace-nowrap px-3 py-2.5 text-xs">
                                          {lead.adPlatform ? (
                                            <span
                                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                              style={{
                                                background: lead.adPlatform === "google" ? "rgba(66,133,244,0.12)" : "rgba(24,119,242,0.12)",
                                                color: lead.adPlatform === "google" ? "#4285F4" : "#1877F2",
                                              }}
                                            >
                                              {lead.adPlatform === "google" ? "Google" : "Meta"}
                                            </span>
                                          ) : (
                                            <span style={{ color: "var(--text-disabled)" }}>{"\u2014"}</span>
                                          )}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                                          {lead.qualityScore != null ? lead.qualityScore : "\u2014"}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                                          {formatDate(lead.crmCreatedAt)}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                              {filteredLeads.length > 0 && (
                                <div className="mt-2 px-3 text-[10px]" style={{ color: "var(--text-disabled)" }}>
                                  Showing {filteredLeads.length} {filteredLeads.length === 1 ? "lead" : "leads"}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Funnel Row ─────────────────────────────────────────

function FunnelRow({
  stage,
  maxCount,
  prevCount,
  compact = false,
}: {
  stage: FunnelStage
  maxCount: number
  prevCount: number
  isLast?: boolean
  compact?: boolean
}) {
  const cfg = getStageConfig(stage.stage)
  const Icon = cfg.icon
  const widthPct = Math.max(8, (stage.count / maxCount) * 100)
  // Only show conversion rate when count is less than previous (actual conversion)
  const rate = prevCount > 0 && stage.count <= prevCount ? conversionRate(prevCount, stage.count) : null
  const dropoff = prevCount > 0 && stage.count < prevCount
    ? Math.round((1 - stage.count / prevCount) * 100)
    : 0

  return (
    <div className={compact ? "mb-2 last:mb-0" : "mb-3 last:mb-0"}>
      {/* Label row */}
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{ background: `${cfg.color}18` }}
          >
            <Icon size={12} style={{ color: cfg.color }} />
          </div>
          <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
            {stage.stage}
          </span>
        </div>
        <span className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {fmt(stage.count)}
        </span>
      </div>

      {/* Bar + inline drop-off */}
      <div className="flex items-center gap-3">
        <div
          className="flex-1 overflow-hidden rounded-lg"
          style={{ height: compact ? 8 : 12, background: "var(--border-subtle)" }}
        >
          <div
            className="h-full rounded-lg transition-all duration-500"
            style={{ width: `${widthPct}%`, background: cfg.gradient }}
          />
        </div>
        {/* Conversion rate + drop-off inline right of bar */}
        {rate && dropoff > 0 && (
          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: `${cfg.color}14`, color: cfg.color }}
            >
              {rate}
            </span>
            <ArrowDown size={9} style={{ color: dropoff > 80 ? "#f87171" : dropoff > 50 ? "#fbbf24" : "var(--text-disabled)" }} />
            <span
              className="font-mono text-[10px]"
              style={{ color: dropoff > 80 ? "#f87171" : dropoff > 50 ? "#fbbf24" : "var(--text-tertiary)" }}
            >
              {dropoff}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <span
      className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.08em]"
      style={{ color: "var(--text-tertiary)" }}
    >
      {label}
    </span>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span className="font-mono text-sm font-bold" style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  )
}

function EmptyState({ isGoogle }: { isGoogle: boolean }) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-lg py-20"
      style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: "var(--bg-muted)" }}
      >
        <Filter size={24} style={{ color: "var(--text-disabled)" }} />
      </div>
      <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        No funnel data yet
      </span>
      <span className="max-w-xs text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
        {isGoogle
          ? "Sync your Google Ads account to see the full conversion funnel from impression to lead"
          : "Sync your Meta ad account to see the full conversion funnel from impression to lead"}
      </span>
    </div>
  )
}

function FunnelSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg p-5" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
        {[100, 70, 30, 10].map((w, i) => (
          <div key={i} className="mb-4">
            <div className="mb-2 flex justify-between">
              <div className="h-3 w-24 animate-pulse rounded" style={{ background: "var(--bg-muted)" }} />
              <div className="h-3 w-12 animate-pulse rounded" style={{ background: "var(--bg-muted)" }} />
            </div>
            <div
              className="h-3 animate-pulse rounded-lg"
              style={{ width: `${w}%`, background: "var(--bg-muted)" }}
            />
          </div>
        ))}
      </div>
      <div className="rounded-lg p-5" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-3 h-12 animate-pulse rounded-lg" style={{ background: "var(--bg-muted)" }} />
        ))}
      </div>
    </div>
  )
}
