"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAppStore } from "@/lib/store"
import {
  ArrowDown, Filter, Eye, MousePointerClick, UserCheck,
  TrendingUp, ChevronRight, IndianRupee, Users,
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

interface FunnelData {
  funnel: FunnelStage[]
  campaignBreakdown: CampaignBreakdown[]
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

function fmt(n: number | null | undefined): string {
  if (n == null) return "—"
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)}Cr`
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString("en-IN")
}

function fmtCurrency(n: number | null | undefined): string {
  if (n == null) return "—"
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

function conversionRate(from: number, to: number): string {
  if (from === 0) return "—"
  const pct = (to / from) * 100
  return pct < 1 ? `${pct.toFixed(2)}%` : `${pct.toFixed(1)}%`
}

const CRM_TIERS = new Set(["Converted", "High", "Medium", "Low", "Junk", "Unknown"])

const stageConfig: Record<string, { color: string; gradient: string; icon: typeof Eye }> = {
  Reach:             { color: "#38bdf8", gradient: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)", icon: Users },
  Impressions:       { color: "#60a5fa", gradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)", icon: Eye },
  Clicks:            { color: "#818cf8", gradient: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)", icon: MousePointerClick },
  "Leads / Results": { color: "#a78bfa", gradient: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)", icon: UserCheck },
  Converted:         { color: "#4ade80", gradient: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)", icon: TrendingUp },
  High:              { color: "#60a5fa", gradient: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)", icon: TrendingUp },
  Medium:            { color: "#fbbf24", gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)", icon: TrendingUp },
  Low:               { color: "#fb923c", gradient: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)", icon: TrendingUp },
  Junk:              { color: "#f87171", gradient: "linear-gradient(135deg, #f87171 0%, #ef4444 100%)", icon: TrendingUp },
}

function getStageConfig(stage: string) {
  return stageConfig[stage] || { color: "#9ca3af", gradient: "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)", icon: TrendingUp }
}

// ── Main ───────────────────────────────────────────────

export default function FunnelPage() {
  const adAccountId = useAppStore((s) => s.selectedAdAccountId)
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null)

  const { data, isLoading } = useQuery<{ data: FunnelData | null }>({
    queryKey: ["funnel", adAccountId],
    queryFn: async () => {
      const res = await fetch(`/api/crm/insights/funnel?adAccountId=${adAccountId}`)
      return res.json()
    },
    enabled: !!adAccountId,
  })

  const funnel = data?.data?.funnel || []
  const breakdown = data?.data?.campaignBreakdown || []
  const totals = data?.data?.totals

  const metaStages = funnel.filter((s) => !CRM_TIERS.has(s.stage))
  const crmStages = funnel.filter((s) => CRM_TIERS.has(s.stage))
  const metaMax = Math.max(...metaStages.map((s) => s.count), 1)
  const crmMax = Math.max(...crmStages.map((s) => s.count), 1)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Conversion Funnel
          </h2>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Full journey from ad impression to CRM outcome. Meta-attributed leads only.
          </p>
        </div>
        {totals && totals.leads > 0 && totals.totalSpend > 0 && (
          <div
            className="flex items-center gap-4 rounded-xl px-5 py-3"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
          >
            <MiniStat label="Spend" value={fmtCurrency(totals.totalSpend)} />
            <div className="h-8 w-px" style={{ background: "var(--border-subtle)" }} />
            <MiniStat label="Conv. Rate" value={conversionRate(totals.clicks, totals.leads)} />
            <div className="h-8 w-px" style={{ background: "var(--border-subtle)" }} />
            <MiniStat label="CPL" value={totals.leads > 0 ? fmtCurrency(totals.totalSpend / totals.leads) : "—"} />
          </div>
        )}
      </div>

      {isLoading ? (
        <FunnelSkeleton />
      ) : funnel.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-5 xl:flex-row">
          {/* Left: Funnel visualization */}
          <div className="flex-1">
            {/* Meta ad stages */}
            <SectionLabel label="Meta Ads Pipeline" />
            <div
              className="mb-4 rounded-xl p-5"
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

            {/* CRM stages */}
            {crmStages.length > 0 && (
              <>
                <SectionLabel label="CRM Quality (Meta Leads)" />
                <div
                  className="rounded-xl p-5"
                  style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
                >
                  {/* CRM tier distribution as horizontal stacked bar */}
                  <div className="mb-4">
                    <div className="flex h-10 overflow-hidden rounded-lg">
                      {crmStages.map((s) => {
                        const totalCrm = crmStages.reduce((sum, x) => sum + x.count, 0)
                        const pct = totalCrm > 0 ? (s.count / totalCrm) * 100 : 0
                        if (s.count === 0) return null
                        const cfg = getStageConfig(s.stage)
                        // Ensure tiny segments are still visible (min 3%)
                        const displayPct = Math.max(3, pct)
                        return (
                          <div
                            key={s.stage}
                            className="flex items-center justify-center text-[10px] font-bold text-white transition-all"
                            style={{
                              width: `${displayPct}%`,
                              background: cfg.gradient,
                            }}
                            title={`${s.stage}: ${s.count} (${pct.toFixed(1)}%)`}
                          >
                            {pct > 5 ? `${s.stage} ${Math.round(pct)}%` : pct > 2 ? `${Math.round(pct)}%` : ""}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Individual tier rows */}
                  {crmStages.map((stage, i) => (
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

          {/* Right: Campaign breakdown */}
          <div className="w-full xl:w-[340px]">
            <SectionLabel label="By Campaign" />
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
            >
              {breakdown.length === 0 ? (
                <p className="py-8 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Sync your ad account to see breakdown
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {breakdown.slice(0, 12).map((c, i) => {
                    const isExpanded = expandedCampaign === c.campaignId
                    const topSpend = breakdown[0]?.spend || 1
                    const barPct = Math.max(5, ((c.spend ?? 0) / topSpend) * 100)

                    return (
                      <button
                        key={c.campaignId}
                        onClick={() => setExpandedCampaign(isExpanded ? null : c.campaignId)}
                        className="group w-full rounded-lg px-3 py-2.5 text-left transition-all"
                        style={{
                          background: isExpanded ? "var(--acc-subtle)" : i % 2 === 0 ? "var(--bg-subtle)" : "transparent",
                        }}
                      >
                        {/* Campaign name + spend */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="max-w-[180px] truncate text-xs font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {c.campaignName}
                          </span>
                          <span className="shrink-0 font-mono text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>
                            {fmtCurrency(c.spend)}
                          </span>
                        </div>

                        {/* Spend bar */}
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--border-subtle)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${barPct}%`, background: "var(--accent-primary)", opacity: 0.7 }}
                          />
                        </div>

                        {/* Quick stats row */}
                        <div className="mt-1.5 flex items-center gap-3 text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                          <span>{fmt(c.impressions)} impr</span>
                          <span>{fmt(c.clicks)} clicks</span>
                          <span>{c.leads ?? 0} leads</span>
                          {c.cpl != null && (
                            <span style={{ color: "var(--accent-primary)" }}>
                              CPL {fmtCurrency(c.cpl)}
                            </span>
                          )}
                        </div>

                        {/* Expanded: conversion rates */}
                        {isExpanded && (
                          <div
                            className="mt-2 flex gap-3 border-t pt-2"
                            style={{ borderColor: "var(--border-subtle)" }}
                          >
                            <MicroRate label="CTR" value={conversionRate(c.impressions, c.clicks)} />
                            <MicroRate label="Conv" value={conversionRate(c.clicks, c.leads)} />
                            <MicroRate label="CPC" value={c.clicks > 0 ? fmtCurrency((c.spend ?? 0) / c.clicks) : "—"} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Totals footer */}
              {totals && (
                <div
                  className="mt-3 flex flex-col gap-1.5 border-t pt-3"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <TotalRow label="Reach" value={fmt(totals.reach)} />
                  <TotalRow label="Impressions" value={fmt(totals.impressions)} />
                  <TotalRow label="Clicks" value={fmt(totals.clicks)} />
                  <TotalRow label="Meta Leads" value={fmt(totals.leads)} />
                  {(totals.crmLeads ?? 0) > 0 && (
                    <TotalRow label="CRM Leads (Meta)" value={fmt(totals.crmLeads)} accent />
                  )}
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>Total Spend</span>
                    <span className="font-mono text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                      {fmtCurrency(totals.totalSpend)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
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
  isLast,
  compact = false,
}: {
  stage: FunnelStage
  maxCount: number
  prevCount: number
  isLast: boolean
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

function MicroRate({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[9px] uppercase" style={{ color: "var(--text-disabled)" }}>{label}</span>
      <span className="ml-1 font-mono text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>{value}</span>
    </div>
  )
}

function TotalRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span
        className="font-mono text-[11px] font-medium"
        style={{ color: accent ? "var(--accent-primary)" : "var(--text-secondary)" }}
      >
        {value}
      </span>
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-xl py-20"
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
        Sync your Meta ad account to see the full conversion funnel from impression to lead
      </span>
    </div>
  )
}

function FunnelSkeleton() {
  return (
    <div className="flex flex-col gap-5 xl:flex-row">
      <div className="flex-1 rounded-xl p-5" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
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
      <div className="w-full rounded-xl p-5 xl:w-[340px]" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="mb-3 h-12 animate-pulse rounded-lg" style={{ background: "var(--bg-muted)" }} />
        ))}
      </div>
    </div>
  )
}
