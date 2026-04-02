"use client"

import { useState, useMemo } from "react"
import {
  Target, Users, IndianRupee, TrendingUp, ArrowUpRight,
  ArrowDownRight, RefreshCw, ChevronLeft, ChevronRight,
  Circle, CheckCircle, XCircle, Minus,
  Link2, Search, SlidersHorizontal,
  Megaphone, Layers, Image, BarChart3, Info, X,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts"
import { useTheme } from "@/lib/theme"
import { useAppStore } from "@/lib/store"
import { usePlatform } from "@/hooks/use-platform"
import { EmptyState as EmptyStateUI } from "@/components/ui/empty-state"
import { DateRangePicker, presetRange } from "@/components/ui/DateRangePicker"
import type { DateRange } from "@/hooks/use-campaigns"
import {
  useCrmConnection,
  useCrmInsights,
  useCrmLeads,
  useCrmTrends,
  useSyncCrm,
  useEntityQuality,
  type CrmLead,
  type CampaignQualityMetrics,
  type EntityLevel,
  type QualityBreakdown,
  type PlatformBreakdown as PlatformBreakdownType,
} from "@/hooks/use-crm"

// ── Tier + platform config ──────────────────────────────

const tierConfig: Record<string, { color: string; bg: string; label: string; icon: typeof Circle }> = {
  converted: { color: "#4ade80", bg: "rgba(74, 222, 128, 0.10)", label: "Converted", icon: CheckCircle },
  high:      { color: "#60a5fa", bg: "rgba(96, 165, 250, 0.10)", label: "High",      icon: ArrowUpRight },
  medium:    { color: "#fbbf24", bg: "rgba(251, 191, 36, 0.10)", label: "Medium",    icon: Minus },
  low:       { color: "#fb923c", bg: "rgba(251, 146, 60, 0.10)", label: "Low",       icon: ArrowDownRight },
  junk:      { color: "#f87171", bg: "rgba(248, 113, 113, 0.10)", label: "Junk",      icon: XCircle },
  unknown:   { color: "var(--text-tertiary)", bg: "rgba(255,255,255,0.04)", label: "Unknown", icon: Circle },
}

const TIER_ORDER = ["converted", "high", "medium", "low", "junk", "unknown"]

const platformMeta: Record<string, { color: string; label: string }> = {
  meta:     { color: "#1877F2", label: "Meta" },
  google:   { color: "#34A853", label: "Google" },
  bing:     { color: "#00809D", label: "Bing" },
  linkedin: { color: "#0A66C2", label: "LinkedIn" },
  twitter:  { color: "#1DA1F2", label: "Twitter" },
  other:    { color: "#9CA3AF", label: "Other" },
  unknown:  { color: "#6B7280", label: "Unknown" },
}

// ── Helpers ─────────────────────────────────────────────

function fmt(v: number | null | undefined): string {
  if (v == null) return "—"
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

function fmtDate(d: string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

function fmtNum(n: number): string {
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// ── Chart Colors (theme-aware — SVG can't use CSS vars) ──

const CHART_COLORS = {
  obsidian: {
    grid: "rgba(255,255,255,0.04)",
    tick: "rgba(255,255,255,0.35)",
    tooltipBg: "rgba(30, 30, 36, 0.95)",
    tooltipBorder: "rgba(255,255,255,0.1)",
    tooltipLabel: "rgba(255,255,255,0.7)",
    tooltipShadow: "0 8px 24px rgba(0,0,0,0.4)",
  },
  violet: {
    grid: "rgba(0,0,0,0.06)",
    tick: "rgba(0,0,0,0.35)",
    tooltipBg: "rgba(255, 255, 255, 0.95)",
    tooltipBorder: "rgba(0,0,0,0.1)",
    tooltipLabel: "rgba(0,0,0,0.7)",
    tooltipShadow: "0 8px 24px rgba(0,0,0,0.1)",
  },
} as const

// ── Skeleton ────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md ${className}`} style={{ background: "var(--bg-muted)" }} />
}

// ── KPI Card ────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string; icon: typeof Target; accent: string
}) {
  return (
    <div
      className="flex-1 min-w-[170px] rounded-xl p-5 transition-colors"
      style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${accent}14` }}
        >
          <Icon size={15} style={{ color: accent }} />
        </div>
        <span className="text-[12px] font-medium" style={{ color: "var(--text-tertiary)" }}>{label}</span>
      </div>
      <div className="font-mono text-[26px] font-bold leading-none" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
      {sub && (
        <p className="mt-1.5 text-[11px]" style={{ color: "var(--text-tertiary)" }}>{sub}</p>
      )}
    </div>
  )
}

// ── Quality Distribution ────────────────────────────────

function QualityDistribution({ breakdown }: { breakdown: QualityBreakdown[] }) {
  const sorted = [...breakdown].sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
      <h3 className="text-[13px] font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        Quality Distribution
      </h3>

      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-5" style={{ background: "var(--bg-muted)" }}>
        {sorted.map((item) => {
          const cfg = tierConfig[item.tier] || tierConfig.unknown
          if (item.percentage === 0) return null
          return (
            <div
              key={item.tier}
              className="transition-all duration-500"
              style={{ width: `${item.percentage}%`, background: cfg.color, minWidth: 3 }}
              title={`${cfg.label}: ${item.count} (${item.percentage}%)`}
            />
          )
        })}
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-5 gap-2">
        {TIER_ORDER.filter(t => t !== "unknown").map((tier) => {
          const item = sorted.find(s => s.tier === tier)
          const cfg = tierConfig[tier]
          const TierIcon = cfg.icon
          const count = item?.count || 0
          const pct = item?.percentage || 0
          return (
            <div
              key={tier}
              className="rounded-lg px-3 py-2.5 text-center"
              style={{ background: cfg.bg }}
            >
              <TierIcon size={13} style={{ color: cfg.color, margin: "0 auto 4px" }} />
              <div className="font-mono text-[15px] font-bold" style={{ color: cfg.color }}>
                {fmtNum(count)}
              </div>
              <div className="text-[10px] font-medium mt-0.5" style={{ color: cfg.color, opacity: 0.75 }}>
                {pct}% &middot; {cfg.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Platform Breakdown ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PlatformCard({ platforms }: { platforms: PlatformBreakdownType[] }) {
  if (!platforms.length) return null
  const maxCount = Math.max(...platforms.map(p => p.count), 1)

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
      <h3 className="text-[13px] font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        Quality by Source
      </h3>
      <div className="flex flex-col gap-3">
        {platforms.map((p) => {
          const pm = platformMeta[p.platform] || platformMeta.unknown
          return (
            <div key={p.platform}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: pm.color }} />
                  <span className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
                    {pm.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px]" style={{ color: pm.color }}>
                    {p.qualityPercentage}% quality
                  </span>
                  <span className="font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    {fmtNum(p.count)}
                  </span>
                </div>
              </div>
              {/* Bar */}
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                <div className="h-full rounded-full relative" style={{ width: `${(p.count / maxCount) * 100}%`, background: `${pm.color}30` }}>
                  <div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ width: `${p.qualityPercentage}%`, background: pm.color }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Improvement #4: Quality Score Tooltip on KPI Card ──

function QualityKpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string; icon: typeof Target; accent: string
}) {
  const [showTip, setShowTip] = useState(false)
  return (
    <div
      className="flex-1 min-w-[170px] rounded-xl p-5 transition-colors"
      style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${accent}14` }}
        >
          <Icon size={15} style={{ color: accent }} />
        </div>
        <span className="text-[12px] font-medium" style={{ color: "var(--text-tertiary)" }}>{label}</span>
        <div
          className="relative"
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
        >
          <Info size={12} style={{ color: "var(--text-tertiary)", cursor: "help" }} />
          {showTip && (
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-[260px] rounded-lg px-3 py-2.5 text-[11px] leading-[1.5] z-50 pointer-events-none"
              style={{
                background: "rgba(20, 20, 26, 0.96)",
                color: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              Leads with quality score &ge; 70, based on your CRM stage mapping in Settings. Stages like Qualified, Site Visit, Converted score 70+.
            </div>
          )}
        </div>
      </div>
      <div className="font-mono text-[26px] font-bold leading-none" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
      {sub && (
        <p className="mt-1.5 text-[11px]" style={{ color: "var(--text-tertiary)" }}>{sub}</p>
      )}
    </div>
  )
}

// ── Improvement #1: Quality Trend Chart ─────────────────

function QualityTrendChart({ adAccountId, dateRange }: {
  adAccountId: string; dateRange?: { from: string; to: string }
}) {
  const { theme } = useTheme()
  const colors = CHART_COLORS[theme]
  const { data: trendsData } = useCrmTrends(adAccountId, dateRange)
  const trends = trendsData?.data || []

  if (trends.length === 0) return null

  const chartData = trends.map(t => ({
    date: new Date(t.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    total: t.totalLeads,
    quality: t.qualityLeads,
  }))

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
      <h3 className="text-[13px] font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        Lead Quality Trend
      </h3>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5eead4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#5eead4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradQuality" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: colors.tick, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: colors.tick, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <RechartsTooltip
              contentStyle={{
                background: colors.tooltipBg,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: 8,
                fontSize: 11,
                boxShadow: colors.tooltipShadow,
              }}
              labelStyle={{ color: colors.tooltipLabel, fontWeight: 600, marginBottom: 4 }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#5eead4"
              strokeWidth={2}
              fill="url(#gradTotal)"
              name="Total Leads"
            />
            <Area
              type="monotone"
              dataKey="quality"
              stroke="#4ade80"
              strokeWidth={2}
              fill="url(#gradQuality)"
              name="Quality Leads"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Improvement #3: Junk Lead Alert Banner ──────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function JunkAlertBanner({ campaigns }: { campaigns: CampaignQualityMetrics[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const getId = (c: CampaignQualityMetrics) => c.campaignId || c.entityId || ''
  const getName = (c: CampaignQualityMetrics) => c.campaignName || c.entityName || 'Unknown'

  const highJunk = campaigns
    .filter(c => c.junkPercentage > 40 && !dismissed.has(getId(c)))
    .sort((a, b) => b.junkPercentage - a.junkPercentage)
    .slice(0, 3)

  if (highJunk.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {highJunk.map(c => {
        const name = getName(c)
        const displayName = name.length > 50 ? name.slice(0, 47) + "..." : name
        return (
        <div
          key={getId(c)}
          className="flex items-center justify-between rounded-lg px-4 py-3"
          style={{
            background: "rgba(251, 191, 36, 0.08)",
            border: "1px solid rgba(251, 191, 36, 0.20)",
            color: "#fbbf24",
          }}
        >
          <span className="text-[12px] font-medium">
            &#9888; {displayName} has {c.junkPercentage}% junk leads &mdash; review targeting or pause
          </span>
          <button
            onClick={() => setDismissed(prev => new Set(prev).add(getId(c)))}
            className="flex h-5 w-5 items-center justify-center rounded-md transition-colors hover:opacity-70"
            style={{ color: "#fbbf24" }}
          >
            <X size={13} />
          </button>
        </div>
        )
      })}
    </div>
  )
}

// ── Improvement #2: CPQL Comparison Bars ────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CpqlComparisonBars({ campaigns }: { campaigns: CampaignQualityMetrics[] }) {
  const withCpql = campaigns.filter(c => c.cpql != null && c.cpql > 0).slice(0, 8)
  if (withCpql.length === 0) return null

  const cpqlValues = withCpql.map(c => c.cpql!)
  const sortedCpql = [...cpqlValues].sort((a, b) => a - b)
  const median = sortedCpql.length % 2 === 0
    ? (sortedCpql[sortedCpql.length / 2 - 1] + sortedCpql[sortedCpql.length / 2]) / 2
    : sortedCpql[Math.floor(sortedCpql.length / 2)]

  const maxCpql = Math.max(...cpqlValues)
  const maxCpl = Math.max(...withCpql.map(c => c.metaCpl || 0), 1)
  const barMax = Math.max(maxCpql, maxCpl)

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
      <h3 className="text-[13px] font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        CPQL by Campaign
      </h3>
      <div className="flex flex-col gap-3">
        {withCpql.sort((a, b) => (a.cpql || 0) - (b.cpql || 0)).map(c => {
          const cpql = c.cpql!
          const cpl = c.metaCpl || 0
          const isGood = cpql <= median
          const barColor = isGood ? "#4ade80" : cpql <= median * 1.5 ? "#fbbf24" : "#f87171"

          return (
            <div key={c.campaignId || c.entityId}>
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-[11px] font-medium truncate max-w-[280px]"
                  style={{ color: "var(--text-primary)" }}
                  title={c.campaignName || c.entityName || 'Unknown'}
                >
                  {c.campaignName || c.entityName || 'Unknown'}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    CPL {fmt(cpl)}
                  </span>
                  <span className="font-mono text-[11px] font-bold" style={{ color: barColor }}>
                    CPQL {fmt(cpql)}
                  </span>
                </div>
              </div>
              <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                {/* CPL bar (lighter, behind) */}
                {cpl > 0 && (
                  <div
                    className="absolute top-0 left-0 h-full rounded-full"
                    style={{ width: `${(cpl / barMax) * 100}%`, background: `${barColor}20` }}
                  />
                )}
                {/* CPQL bar (foreground) */}
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all"
                  style={{ width: `${(cpql / barMax) * 100}%`, background: barColor }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Improvement #5: Top Keywords by Quality (Google only) ──

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TopKeywordsByQuality({ leads }: { leads: CrmLead[] }) {
  const keywordData = useMemo(() => {
    const map = new Map<string, { total: number; quality: number; junk: number }>()
    for (const lead of leads) {
      const kw = lead.utmTerm
      if (!kw) continue
      const entry = map.get(kw) || { total: 0, quality: 0, junk: 0 }
      entry.total++
      if ((lead.bestQualityScore ?? lead.qualityScore ?? 0) >= 70) entry.quality++
      if ((lead.bestQualityTier ?? lead.qualityTier) === "junk") entry.junk++
      map.set(kw, entry)
    }
    return [...map.entries()]
      .filter(([, v]) => v.total >= 2)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 15)
      .map(([keyword, v]) => ({
        keyword,
        total: v.total,
        quality: v.quality,
        junkPct: v.total > 0 ? Math.round((v.junk / v.total) * 100) : 0,
        qualityRatio: v.total > 0 ? Math.round((v.quality / v.total) * 100) : 0,
      }))
  }, [leads])

  if (keywordData.length === 0) return null

  const thStyle = "px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.06em] text-left"

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
      <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <h3 className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Top Keywords by Lead Quality
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              {["Keyword", "Total Leads", "Quality Leads", "Junk %", "Quality Ratio"].map(h => (
                <th key={h} className={thStyle} style={{ color: "var(--text-tertiary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keywordData.map(kw => {
              const qrColor = kw.qualityRatio > 50 ? "#4ade80" : kw.qualityRatio < 25 ? "#f87171" : "var(--text-secondary)"
              return (
                <tr
                  key={kw.keyword}
                  className="transition-colors"
                  style={{ borderBottom: "1px solid var(--border-default)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-subtle)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td className="px-4 py-2.5 text-[12px] font-medium max-w-[260px] truncate" style={{ color: "var(--text-primary)" }}>
                    {kw.keyword}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px]" style={{ color: "var(--text-secondary)" }}>
                    {kw.total}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] font-semibold" style={{ color: "#4ade80" }}>
                    {kw.quality}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: kw.junkPct > 40 ? "#f87171" : "var(--text-secondary)" }}>
                    {kw.junkPct}%
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)", maxWidth: 64 }}>
                        <div className="h-full rounded-full" style={{ width: `${kw.qualityRatio}%`, background: qrColor }} />
                      </div>
                      <span className="font-mono text-[11px] w-8 text-right" style={{ color: qrColor }}>
                        {kw.qualityRatio}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Level config ────────────────────────────────────────

const META_LEVELS: { key: EntityLevel; label: string; icon: typeof Megaphone }[] = [
  { key: "campaign", label: "Campaigns", icon: Megaphone },
  { key: "adset", label: "Ad Sets", icon: Layers },
  { key: "ad", label: "Ads", icon: Image },
]

const GOOGLE_LEVELS: { key: string; label: string; icon: typeof Megaphone }[] = [
  { key: "campaign", label: "Campaigns", icon: Megaphone },
  { key: "adset", label: "Ad Groups", icon: Layers },
  { key: "keyword", label: "Keywords", icon: Search },
]

// ── Entity Quality Table (Campaign / AdSet / Ad) ────────

function EntityQualityTable({ adAccountId, dateRange, platform = "meta", onEntityClick, selectedEntityId, campaignMetrics, leads }: {
  adAccountId: string; dateRange?: { from: string; to: string }; platform?: "meta" | "google"
  onEntityClick?: (entityId: string, entityName: string, level: string) => void
  selectedEntityId?: string | null
  campaignMetrics?: CampaignQualityMetrics[]
  leads?: CrmLead[]
}) {
  const isGoogle = platform === "google"
  const [level, setLevel] = useState<string>("campaign")
  const entityLevel = level === "keyword" ? "campaign" : level as EntityLevel // keyword uses client-side grouping
  const { data: entityData, isLoading } = useEntityQuality(adAccountId, entityLevel, platform, dateRange)
  const [sortKey, setSortKey] = useState<"totalLeads" | "qualityLeads" | "junkPercentage" | "cpql" | "qualityRatio">("totalLeads")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  // For keyword level, group leads by utmTerm client-side
  const keywordEntities = useMemo(() => {
    if (level !== "keyword" || !leads?.length) return []
    // Build campaign name lookup from campaignMetrics
    const campaignNameLookup = new Map<string, string>()
    if (campaignMetrics) {
      for (const c of campaignMetrics) {
        const id = c.campaignId || c.entityId || ''
        const name = c.campaignName || c.entityName || ''
        if (id && name) campaignNameLookup.set(id, name)
      }
    }

    const byKeyword = new Map<string, { total: number; quality: number; junk: number; campaignIds: Map<string, number> }>()
    for (const lead of leads) {
      const kw = lead.utmTerm || "(not set)"
      const entry = byKeyword.get(kw) || { total: 0, quality: 0, junk: 0, campaignIds: new Map() }
      entry.total++
      if ((lead.bestQualityScore ?? lead.qualityScore ?? 0) >= 70) entry.quality++
      if ((lead.bestQualityTier ?? lead.qualityTier) === "junk") entry.junk++
      // Track which campaign this keyword is in (most common one becomes parent)
      if (lead.campaignId) {
        entry.campaignIds.set(lead.campaignId, (entry.campaignIds.get(lead.campaignId) || 0) + 1)
      }
      byKeyword.set(kw, entry)
    }
    return Array.from(byKeyword.entries())
      .filter(([, v]) => v.total >= 1)
      .map(([keyword, v]) => {
        // Find the most common campaign for this keyword
        let topCampaignId = ''
        let topCount = 0
        for (const [cId, count] of v.campaignIds) {
          if (count > topCount) { topCampaignId = cId; topCount = count }
        }
        const parentName = campaignNameLookup.get(topCampaignId) || topCampaignId || undefined

        return {
          entityId: keyword,
          entityName: keyword,
          parentName,
          totalLeads: v.total,
          qualityLeads: v.quality,
          junkLeads: v.junk,
          junkPercentage: v.total > 0 ? Math.round((v.junk / v.total) * 100) : 0,
          cpql: null as number | null,
          metaCpl: null as number | null,
          qualityRatio: v.total > 0 ? Math.round((v.quality / v.total) * 100) / 100 : 0,
          avgDealValue: null as number | null,
        }
      })
  }, [level, leads, campaignMetrics])

  const entities = useMemo(() => level === "keyword" ? keywordEntities : (entityData?.data || []), [level, keywordEntities, entityData])

  // Improvement #6: Estimate spend for ad sets/ad groups by proportioning campaign spend
  const estimatedSpend = useMemo(() => {
    if (level !== "adset" || !campaignMetrics?.length) return new Map<string, number>()
    // Build a map: parentName → { totalSpend (from CPL × totalLeads), totalLeads across all adsets }
    const campaignMap = new Map<string, { spend: number; cpl: number | null }>()
    for (const c of campaignMetrics) {
      if (c.metaCpl != null && c.totalLeads > 0) {
        campaignMap.set(c.campaignName || c.entityName || 'Unknown', { spend: c.metaCpl * c.totalLeads, cpl: c.metaCpl })
      }
    }
    // For each adset, find parent campaign total leads, compute proportion
    const parentLeadTotals = new Map<string, number>()
    for (const e of entities) {
      if (!e.parentName) continue
      parentLeadTotals.set(e.parentName, (parentLeadTotals.get(e.parentName) || 0) + e.totalLeads)
    }
    const result = new Map<string, number>()
    for (const e of entities) {
      if (!e.parentName) continue
      const campaign = campaignMap.get(e.parentName)
      const parentTotal = parentLeadTotals.get(e.parentName) || 1
      if (campaign && campaign.spend > 0 && e.totalLeads > 0) {
        result.set(e.entityId, (e.totalLeads / parentTotal) * campaign.spend)
      }
    }
    return result
  }, [level, entities, campaignMetrics])

  const sorted = [...entities].sort((a, b) => {
    const av = a[sortKey] ?? 0
    const bv = b[sortKey] ?? 0
    return sortDir === "desc" ? (bv as number) - (av as number) : (av as number) - (bv as number)
  })

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc")
    else { setSortKey(key); setSortDir("desc") }
  }

  const renderSortIcon = (k: string) => {
    if (sortKey !== k) return null
    return sortDir === "desc"
      ? <ArrowDownRight size={10} style={{ marginLeft: 2 }} />
      : <ArrowUpRight size={10} style={{ marginLeft: 2 }} />
  }

  const thStyle = "px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.06em] text-left cursor-pointer select-none"
  const LEVELS = isGoogle ? GOOGLE_LEVELS : META_LEVELS
  const levelConfig = LEVELS.find(l => l.key === level) || LEVELS[0]

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <h3 className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
          {isGoogle ? "Google" : "Meta"} Lead Quality by Entity
        </h3>
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: "var(--bg-muted)" }}>
          {LEVELS.map((l) => {
            const active = level === l.key
            const LIcon = l.icon
            return (
              <button
                key={l.key}
                onClick={() => { setLevel(l.key); setSortKey("totalLeads"); setSortDir("desc") }}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-all"
                style={{
                  background: active ? "var(--bg-base)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                  boxShadow: active ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                }}
              >
                <LIcon size={11} />
                {l.label}
              </button>
            )
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 flex justify-center">
          <div className="animate-pulse h-32 w-full rounded-md" style={{ background: "var(--bg-muted)" }} />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "rgba(251,191,36,0.10)" }}>
            <SlidersHorizontal size={18} style={{ color: "#fbbf24" }} />
          </div>
          <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
            No {levelConfig.label.toLowerCase()} matches yet
          </p>
          <p className="text-[11px] max-w-[320px] text-center" style={{ color: "var(--text-tertiary)" }}>
            Leads need UTM parameters or manual matching to link with Meta {levelConfig.label.toLowerCase()}.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 420 }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead className="sticky top-0 z-10" style={{ background: "var(--bg-base)" }}>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                <th className={thStyle} style={{ color: "var(--text-tertiary)" }}>
                  {level === "campaign" ? "Campaign" : level === "adset" ? (isGoogle ? "Ad Group" : "Ad Set") : level === "keyword" ? "Keyword" : "Ad"}
                </th>
                {level !== "campaign" && (
                  <th className={thStyle} style={{ color: "var(--text-tertiary)" }}>Parent</th>
                )}
                <th className={thStyle} style={{ color: "var(--text-tertiary)", width: 70 }} onClick={() => toggleSort("totalLeads")}>
                  <span className="inline-flex items-center">Total {renderSortIcon("totalLeads")}</span>
                </th>
                <th className={thStyle} style={{ color: "var(--text-tertiary)", width: 80 }} onClick={() => toggleSort("qualityLeads")}>
                  <span className="inline-flex items-center">Quality {renderSortIcon("qualityLeads")}</span>
                </th>
                <th className={thStyle} style={{ color: "var(--text-tertiary)", width: 80 }} onClick={() => toggleSort("junkPercentage")}>
                  <span className="inline-flex items-center">Junk % {renderSortIcon("junkPercentage")}</span>
                </th>
                {level === "campaign" && (
                  <th className={thStyle} style={{ color: "var(--text-tertiary)", width: 90 }} onClick={() => toggleSort("cpql")}>
                    <span className="inline-flex items-center">CPQL {renderSortIcon("cpql")}</span>
                  </th>
                )}
                {level === "campaign" && (
                  <th className={thStyle} style={{ color: "var(--text-tertiary)", width: 90 }}>CPL</th>
                )}
                {level === "adset" && estimatedSpend.size > 0 && (
                  <th className={thStyle} style={{ color: "var(--text-tertiary)", width: 100 }}>Est. Spend</th>
                )}
                {level === "adset" && estimatedSpend.size > 0 && (
                  <th className={thStyle} style={{ color: "var(--text-tertiary)", width: 90 }}>Est. CPL</th>
                )}
                <th className={thStyle} style={{ color: "var(--text-tertiary)", width: 130 }} onClick={() => toggleSort("qualityRatio")}>
                  <span className="inline-flex items-center">Quality Ratio {renderSortIcon("qualityRatio")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => {
                const qrPct = Math.round(e.qualityRatio * 100)
                const qrColor = qrPct > 50 ? "#4ade80" : qrPct > 25 ? "#fbbf24" : "#f87171"
                const junkColor = e.junkPercentage > 50 ? "#f87171" : e.junkPercentage > 30 ? "#fbbf24" : "var(--text-secondary)"
                return (
                  <tr
                    key={e.entityId}
                    className="transition-colors cursor-pointer"
                    style={{
                      borderBottom: "1px solid var(--border-default)",
                      background: selectedEntityId === e.entityId ? "var(--acc-subtle)" : "transparent",
                    }}
                    onClick={() => {
                      if (onEntityClick) {
                        if (selectedEntityId === e.entityId) {
                          onEntityClick("", "", "") // deselect
                        } else {
                          onEntityClick(e.entityId, e.entityName, level)
                        }
                      }
                    }}
                    onMouseEnter={ev => { if (selectedEntityId !== e.entityId) ev.currentTarget.style.background = "var(--bg-subtle)" }}
                    onMouseLeave={ev => { if (selectedEntityId !== e.entityId) ev.currentTarget.style.background = "transparent" }}
                  >
                    <td className="px-4 py-3 text-[12px] font-medium max-w-[260px] truncate" style={{ color: selectedEntityId === e.entityId ? "var(--acc-text)" : "var(--text-primary)" }}>
                      {e.entityName}
                    </td>
                    {level !== "campaign" && (
                      <td className="px-4 py-3 text-[11px] max-w-[180px] truncate" style={{ color: "var(--text-tertiary)" }}>
                        {e.parentName || "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 font-mono text-[12px]" style={{ color: "var(--text-secondary)" }}>
                      {e.totalLeads}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] font-semibold" style={{ color: "#4ade80" }}>
                      {e.qualityLeads}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] font-medium" style={{ color: junkColor }}>
                        {e.junkPercentage}%
                      </span>
                    </td>
                    {level === "campaign" && (
                      <td className="px-4 py-3 font-mono text-[12px] font-bold" style={{ color: "var(--text-primary)" }}>
                        {fmt(e.cpql)}
                      </td>
                    )}
                    {level === "campaign" && (
                      <td className="px-4 py-3 font-mono text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                        {fmt(e.metaCpl)}
                      </td>
                    )}
                    {level === "adset" && estimatedSpend.size > 0 && (
                      <td className="px-4 py-3 font-mono text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                        {estimatedSpend.has(e.entityId)
                          ? `~${fmt(Math.round(estimatedSpend.get(e.entityId)!))}`
                          : "—"}
                      </td>
                    )}
                    {level === "adset" && estimatedSpend.size > 0 && (
                      <td className="px-4 py-3 font-mono text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                        {estimatedSpend.has(e.entityId) && e.totalLeads > 0
                          ? `~${fmt(Math.round(estimatedSpend.get(e.entityId)! / e.totalLeads))}`
                          : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)", maxWidth: 64 }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${qrPct}%`, background: qrColor }} />
                        </div>
                        <span className="font-mono text-[11px] w-8 text-right" style={{ color: qrColor }}>
                          {qrPct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Leads Table ─────────────────────────────────────────

function LeadsTable({ leads, total, page, setPage, tierFilter, setTierFilter, entityFilter, onClearEntity, isGoogle = false }: {
  leads: CrmLead[]; total: number; page: number; setPage: (p: number) => void
  tierFilter: string; setTierFilter: (t: string) => void
  entityFilter?: { id: string; name: string; level: string } | null
  onClearEntity?: () => void
  isGoogle?: boolean
}) {
  const totalPages = Math.ceil(total / 50)

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
      {/* Header with filters */}
      <div
        className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-3"
        style={{ borderBottom: "1px solid var(--border-default)" }}
      >
        <div className="flex items-center gap-2.5">
          <h3 className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Leads
          </h3>
          <span
            className="font-mono text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: "var(--bg-muted)", color: "var(--text-tertiary)" }}
          >
            {total.toLocaleString()}
          </span>
          {entityFilter?.id && (
            <button
              onClick={onClearEntity}
              className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors"
              style={{ background: "var(--acc-subtle)", color: "var(--acc-text)", border: "1px solid var(--acc-border)" }}
            >
              {entityFilter.level === "campaign" ? "Campaign" : entityFilter.level === "adset" ? "Ad Group" : entityFilter.level === "keyword" ? "Keyword" : "Ad"}: {entityFilter.name.length > 30 ? entityFilter.name.slice(0, 27) + "..." : entityFilter.name}
              <XCircle size={10} />
            </button>
          )}
        </div>
        {/* Tier pills */}
        <div className="flex gap-1">
          {["all", ...TIER_ORDER.filter(t => t !== "unknown")].map((t) => {
            const active = (t === "all" && !tierFilter) || tierFilter === t
            const cfg = t !== "all" ? tierConfig[t] : null
            return (
              <button
                key={t}
                onClick={() => setTierFilter(t === "all" ? "" : t)}
                className="px-2.5 py-1 rounded-md text-[10px] font-medium capitalize transition-all"
                style={{
                  background: active ? (cfg?.bg || "var(--bg-muted)") : "transparent",
                  color: active ? (cfg?.color || "var(--text-primary)") : "var(--text-tertiary)",
                  border: active ? `1px solid ${cfg?.color || "var(--border-default)"}30` : "1px solid transparent",
                }}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              {["Lead", "Stage", "Quality", "Source", isGoogle ? "Keyword" : "Match", "Date"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.06em] text-left"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const tier = tierConfig[lead.qualityTier || "unknown"] || tierConfig.unknown
              const TierIcon = tier.icon
              const pm = platformMeta[lead.adPlatform || "unknown"] || platformMeta.unknown
              return (
                <tr
                  key={lead.id}
                  className="transition-colors"
                  style={{ borderBottom: "1px solid var(--border-default)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-subtle)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td className="px-4 py-2.5">
                    <div className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
                      {[lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.email || "Unknown"}
                    </div>
                    {lead.company && (
                      <div className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{lead.company}</div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                      {lead.crmStage || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold"
                      style={{ background: tier.bg, color: tier.color }}
                    >
                      <TierIcon size={9} />
                      {tier.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {lead.adPlatform ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: pm.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: pm.color }} />
                        {pm.label}
                      </span>
                    ) : (
                      <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {isGoogle ? (
                      lead.utmTerm ? (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium truncate max-w-[180px] inline-block"
                          style={{ background: "var(--bg-muted)", color: "var(--text-primary)" }}
                          title={lead.utmTerm}
                        >
                          {lead.utmTerm}
                        </span>
                      ) : (
                        <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>—</span>
                      )
                    ) : lead.matchMethod ? (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium uppercase"
                        style={{ background: "var(--bg-muted)", color: "var(--text-secondary)" }}
                      >
                        {lead.matchMethod}
                      </span>
                    ) : (
                      <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    {fmtDate(lead.crmCreatedAt)}
                  </td>
                </tr>
              )
            })}
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                  No leads found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: "1px solid var(--border-default)" }}
        >
          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, total)} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{
                border: "1px solid var(--border-default)",
                color: page === 1 ? "var(--text-tertiary)" : "var(--text-secondary)",
                opacity: page === 1 ? 0.4 : 1,
                cursor: page === 1 ? "not-allowed" : "pointer",
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
              {page}/{totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{
                border: "1px solid var(--border-default)",
                color: page >= totalPages ? "var(--text-tertiary)" : "var(--text-secondary)",
                opacity: page >= totalPages ? 0.4 : 1,
                cursor: page >= totalPages ? "not-allowed" : "pointer",
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Empty state ─────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="rounded-xl flex flex-col items-center justify-center py-20 gap-4"
      style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: "rgba(167, 139, 250, 0.10)" }}
      >
        <Link2 size={24} style={{ color: "#a78bfa" }} />
      </div>
      <div className="text-center">
        <h2 className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Connect Your CRM
        </h2>
        <p className="text-[13px] mt-1 max-w-[380px]" style={{ color: "var(--text-tertiary)" }}>
          Link Zoho CRM to unlock lead quality insights, CPQL metrics, and optimize ad spend based on real conversion outcomes.
        </p>
      </div>
      <a
        href="/settings"
        className="mt-2 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[12px] font-semibold text-white transition-all hover:opacity-90"
        style={{ background: "var(--acc)" }}
      >
        <Link2 size={13} />
        Connect Zoho CRM
      </a>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────

export default function LeadQualityPage() {
  const { platform } = usePlatform()
  const isGoogle = platform === "google"
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  // CRM data is always stored under the Meta ad account ID.
  // Platform filter ("meta" or "google") distinguishes which leads to show.
  const { data: connData } = useCrmConnection(selectedAdAccountId)
  const [days, setDays] = useState(30)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  const range = dateRange || presetRange(days)
  const crmDateRange = { from: range.since, to: range.until }

  // Always use Meta ad account ID for CRM queries, platform param filters by ad source
  const { data: insightsData, isLoading: insightsLoading } = useCrmInsights(selectedAdAccountId, crmDateRange, platform)
  const [leadPage, setLeadPage] = useState(1)
  const [tierFilter, setTierFilter] = useState("")
  const [entityFilter, setEntityFilter] = useState<{ id: string; name: string; level: string } | null>(null)

  // Paginated leads for the table (filtered by entity selection)
  const { data: leadsData } = useCrmLeads(selectedAdAccountId, {
    page: leadPage,
    tier: tierFilter || undefined,
    platform,
    campaignId: entityFilter?.level === "campaign" ? entityFilter.id : undefined,
    adSetId: entityFilter?.level === "adset" ? entityFilter.id : undefined,
    from: crmDateRange.from,
    to: crmDateRange.to,
  })

  // ALL leads for keyword grouping (large page size, date-filtered)
  const { data: allLeadsData } = useCrmLeads(selectedAdAccountId, {
    page: 1,
    pageSize: 1000,
    platform,
    from: crmDateRange.from,
    to: crmDateRange.to,
  })
  const allLeadsForKeywords = allLeadsData?.data || []

  // For keyword filtering, use the full leads list (not paginated)
  const paginatedLeads = leadsData?.data || []
  const filteredByKeyword = entityFilter?.level === "keyword"
    ? allLeadsForKeywords.filter(l => (l.utmTerm || "(not set)") === entityFilter.id)
    : paginatedLeads
  const syncMutation = useSyncCrm()

  const connection = connData?.data?.find((c: { isActive: boolean }) => c.isActive)
  const insights = insightsData?.data
  const leads = filteredByKeyword
  const leadsTotal = entityFilter?.level === "keyword" ? filteredByKeyword.length : (leadsData?.total || 0)

  // No CRM connected
  if (!connection) {
    return (
      <div className="space-y-4 p-1">
        <h1 className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
          Lead Quality
        </h1>
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="space-y-5 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: isGoogle ? "#34A85315" : "#1877F215" }}>
            {isGoogle ? (
              <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.47 3.77 1.18 5.42l3.66-3.33z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 3.33c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            )}
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
              {isGoogle ? "Google" : "Meta"} Lead Quality
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              {isGoogle ? "Google" : "Meta"} Ads lead insights
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {connection.lastSyncAt && (
            <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
              {fmtDate(connection.lastSyncAt)}
            </span>
          )}
          <button
            onClick={() => syncMutation.mutate(connection.id)}
            disabled={syncMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[11px] font-medium transition-all"
            style={{
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
              opacity: syncMutation.isPending ? 0.6 : 1,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-subtle)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <RefreshCw size={12} className={syncMutation.isPending ? "animate-spin" : ""} />
            {syncMutation.isPending ? "Syncing…" : "Sync"}
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <DateRangePicker
        days={days}
        dateRange={dateRange}
        onPreset={(d) => { setDays(d); setDateRange(undefined); setLeadPage(1) }}
        onCustomRange={(r) => { setDateRange(r); setLeadPage(1) }}
      />

      {/* KPI Cards */}
      {insightsLoading ? (
        <div className="flex gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="flex-1 h-[110px] rounded-xl" />)}
        </div>
      ) : (
        <div className="flex gap-4 flex-wrap">
          <KpiCard
            label={isGoogle ? "Google Leads" : "Meta Leads"}
            value={insights ? fmtNum(insights.totalLeads) : "—"}
            sub={insights?.totalSpend ? `Spend: ${fmt(insights.totalSpend)}` : `from ${isGoogle ? "Google" : "Meta"}`}
            icon={Users}
            accent={isGoogle ? "#34A853" : "#1877F2"}
          />
          <QualityKpiCard
            label="Quality Leads"
            value={insights ? fmtNum(insights.qualityLeads) : "—"}
            sub={insights && insights.totalLeads > 0 ? `${Math.round((insights.qualityLeads / insights.totalLeads) * 100)}% quality ratio` : "Score ≥ 70"}
            icon={Target}
            accent="#4ade80"
          />
          <KpiCard
            label="CPL"
            value={fmt(insights?.cpl)}
            sub="Cost per lead"
            icon={IndianRupee}
            accent="#60a5fa"
          />
          <KpiCard
            label="CPQL"
            value={fmt(insights?.cpql)}
            sub="Cost per quality lead"
            icon={IndianRupee}
            accent="#a78bfa"
          />
          <KpiCard
            label="Conversion Rate"
            value={insights ? `${insights.conversionRate}%` : "—"}
            sub={insights?.avgDealValue ? `Avg deal ${fmt(insights.avgDealValue)}` : undefined}
            icon={TrendingUp}
            accent="#fbbf24"
          />
        </div>
      )}

      {/* Improvement #3: Junk Lead Alert Banner */}
      {/* JunkAlertBanner removed — data visible in entity table */}

      {/* No leads empty state */}
      {!insightsLoading && insights && insights.totalLeads === 0 && (
        <EmptyStateUI
          icon={BarChart3}
          title="No leads yet"
          description="Leads appear after campaigns start running"
        />
      )}

      {/* Quality Distribution */}
      {insights && insights.qualityBreakdown.length > 0 && (
        <QualityDistribution breakdown={insights.qualityBreakdown} />
      )}

      {/* Improvement #1: Quality Trend Chart */}
      {selectedAdAccountId && (
        <QualityTrendChart adAccountId={selectedAdAccountId} dateRange={crmDateRange} />
      )}

      {/* Entity Quality Table (Campaign / Ad Set / Ad) — clickable rows filter the leads below */}
      <EntityQualityTable
        adAccountId={selectedAdAccountId!}
        dateRange={crmDateRange}
        platform={platform}
        onEntityClick={(entityId, entityName, level) => {
          if (!entityId) {
            setEntityFilter(null)
          } else {
            setEntityFilter({ id: entityId, name: entityName, level })
          }
          setLeadPage(1)
        }}
        selectedEntityId={entityFilter?.id || null}
        campaignMetrics={insights?.cpqlByCampaign}
        leads={allLeadsForKeywords}
      />

      {/* CpqlComparisonBars removed — data visible in entity table */}

      {/* Improvement #5: Top Keywords by Quality (Google only) */}
      {/* TopKeywordsByQuality removed — keyword data now integrated in entity table */}

      {/* Leads Table — filtered by entity selection + tier + date */}
      <LeadsTable
        leads={leads}
        total={leadsTotal}
        page={leadPage}
        setPage={setLeadPage}
        tierFilter={tierFilter}
        setTierFilter={setTierFilter}
        entityFilter={entityFilter}
        onClearEntity={() => setEntityFilter(null)}
        isGoogle={isGoogle}
      />
    </div>
  )
}
