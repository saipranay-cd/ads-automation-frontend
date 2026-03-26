"use client"

import { useState } from "react"
import {
  Target, Users, IndianRupee, TrendingUp, ArrowUpRight,
  ArrowDownRight, RefreshCw, ChevronLeft, ChevronRight,
  Circle, AlertTriangle, CheckCircle, XCircle, Minus,
  Link2, Search, SlidersHorizontal,
  Megaphone, Layers, Image,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
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
  type EntityQualityMetrics,
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

function QualityDistribution({ breakdown, total }: { breakdown: QualityBreakdown[]; total: number }) {
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

// ── Level config ────────────────────────────────────────

const LEVELS: { key: EntityLevel; label: string; icon: typeof Megaphone }[] = [
  { key: "campaign", label: "Campaigns", icon: Megaphone },
  { key: "adset", label: "Ad Sets", icon: Layers },
  { key: "ad", label: "Ads", icon: Image },
]

// ── Entity Quality Table (Campaign / AdSet / Ad) ────────

function EntityQualityTable({ adAccountId, dateRange }: { adAccountId: string; dateRange?: { from: string; to: string } }) {
  const [level, setLevel] = useState<EntityLevel>("campaign")
  const { data: entityData, isLoading } = useEntityQuality(adAccountId, level, "meta", dateRange)
  const [sortKey, setSortKey] = useState<"totalLeads" | "qualityLeads" | "junkPercentage" | "cpql" | "qualityRatio">("totalLeads")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const entities = entityData?.data || []

  const sorted = [...entities].sort((a, b) => {
    const av = a[sortKey] ?? 0
    const bv = b[sortKey] ?? 0
    return sortDir === "desc" ? (bv as number) - (av as number) : (av as number) - (bv as number)
  })

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc")
    else { setSortKey(key); setSortDir("desc") }
  }

  const SortIcon = ({ k }: { k: typeof sortKey }) => {
    if (sortKey !== k) return null
    return sortDir === "desc"
      ? <ArrowDownRight size={10} style={{ marginLeft: 2 }} />
      : <ArrowUpRight size={10} style={{ marginLeft: 2 }} />
  }

  const thStyle = "px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.06em] text-left cursor-pointer select-none"
  const levelConfig = LEVELS.find(l => l.key === level)!

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <h3 className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Meta Lead Quality by Entity
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
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                <th className={thStyle} style={{ color: "var(--text-tertiary)" }}>
                  {level === "campaign" ? "Campaign" : level === "adset" ? "Ad Set" : "Ad"}
                </th>
                {level !== "campaign" && (
                  <th className={thStyle} style={{ color: "var(--text-tertiary)" }}>Parent</th>
                )}
                <th className={thStyle} style={{ color: "var(--text-tertiary)", width: 70 }} onClick={() => toggleSort("totalLeads")}>
                  <span className="inline-flex items-center">Total <SortIcon k="totalLeads" /></span>
                </th>
                <th className={thStyle} style={{ color: "var(--text-tertiary)", width: 80 }} onClick={() => toggleSort("qualityLeads")}>
                  <span className="inline-flex items-center">Quality <SortIcon k="qualityLeads" /></span>
                </th>
                <th className={thStyle} style={{ color: "var(--text-tertiary)", width: 80 }} onClick={() => toggleSort("junkPercentage")}>
                  <span className="inline-flex items-center">Junk % <SortIcon k="junkPercentage" /></span>
                </th>
                {level === "campaign" && (
                  <th className={thStyle} style={{ color: "var(--text-tertiary)", width: 90 }} onClick={() => toggleSort("cpql")}>
                    <span className="inline-flex items-center">CPQL <SortIcon k="cpql" /></span>
                  </th>
                )}
                {level === "campaign" && (
                  <th className={thStyle} style={{ color: "var(--text-tertiary)", width: 90 }}>CPL</th>
                )}
                <th className={thStyle} style={{ color: "var(--text-tertiary)", width: 130 }} onClick={() => toggleSort("qualityRatio")}>
                  <span className="inline-flex items-center">Quality Ratio <SortIcon k="qualityRatio" /></span>
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
                    className="transition-colors"
                    style={{ borderBottom: "1px solid var(--border-default)" }}
                    onMouseEnter={ev => ev.currentTarget.style.background = "var(--bg-subtle)"}
                    onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}
                  >
                    <td className="px-4 py-3 text-[12px] font-medium max-w-[260px] truncate" style={{ color: "var(--text-primary)" }}>
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

function LeadsTable({ leads, total, page, setPage, tierFilter, setTierFilter }: {
  leads: CrmLead[]; total: number; page: number; setPage: (p: number) => void
  tierFilter: string; setTierFilter: (t: string) => void
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
              {["Lead", "Stage", "Quality", "Source", "Match", "Date"].map((h) => (
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
                    {lead.matchMethod ? (
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
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { data: connData } = useCrmConnection(selectedAdAccountId)
  const [days, setDays] = useState(30)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // Always compute actual date range — presets use `days`, custom uses `dateRange`
  const crmDateRange = dateRange
    ? { from: dateRange.since, to: dateRange.until }
    : {
        from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        to: new Date().toISOString().split("T")[0],
      }

  const { data: insightsData, isLoading: insightsLoading } = useCrmInsights(selectedAdAccountId, crmDateRange, "meta")
  const [leadPage, setLeadPage] = useState(1)
  const [tierFilter, setTierFilter] = useState("")
  const { data: leadsData } = useCrmLeads(selectedAdAccountId, { page: leadPage, tier: tierFilter || undefined, platform: "meta" })
  const syncMutation = useSyncCrm()

  const connection = connData?.data?.find((c: any) => c.isActive)
  const insights = insightsData?.data
  const leads = leadsData?.data || []
  const leadsTotal = leadsData?.total || 0

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
          <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: "#1877F215" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </div>
          <div>
            <h1 className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>
              Meta Lead Quality
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              Meta Ads lead insights
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
            label="Meta Leads"
            value={insights ? fmtNum(insights.totalLeads) : "—"}
            sub={insights && insights.totalLeads > 0 ? `${insights.totalLeads.toLocaleString()} from Meta` : undefined}
            icon={Users}
            accent="#1877F2"
          />
          <KpiCard
            label="Quality Leads"
            value={insights ? fmtNum(insights.qualityLeads) : "—"}
            sub="Score ≥ 70"
            icon={Target}
            accent="#4ade80"
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

      {/* Quality Distribution */}
      {insights && insights.qualityBreakdown.length > 0 && (
        <QualityDistribution breakdown={insights.qualityBreakdown} total={insights.totalLeads} />
      )}

      {/* Entity Quality Table (Campaign / Ad Set / Ad) */}
      <EntityQualityTable adAccountId={selectedAdAccountId!} dateRange={crmDateRange} />

      {/* Leads Table */}
      <LeadsTable
        leads={leads}
        total={leadsTotal}
        page={leadPage}
        setPage={setLeadPage}
        tierFilter={tierFilter}
        setTierFilter={setTierFilter}
      />
    </div>
  )
}
