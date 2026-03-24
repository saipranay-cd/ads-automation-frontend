"use client"

import { useState, useMemo } from "react"
import {
  IndianRupee, Users, Eye, TrendingUp, Target, BarChart3,
  Zap, Play, AlertTriangle, CheckCircle, Clock, XCircle,
  ArrowRight, RefreshCw, Megaphone, LayoutGrid, Image as ImageIcon,
  ChevronDown, ChevronUp, Sparkles, ThumbsUp, ThumbsDown,
  TrendingDown, Lightbulb, Search, Wrench, ArrowUpRight,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useProposals, useProposalStats, useScanProposals, useUpdateProposal } from "@/hooks/use-campaigns"
import type { AiProposal, ExecutionResult, ProposalAction, EntityMetrics } from "@/hooks/use-campaigns"

// ── Types ──────────────────────────────────────────────────

type AgentId = "budget-sentinel" | "audience-architect" | "creative-fatigue" | "bid-optimizer" | "lead-quality" | "performance-prophet"
type FilterTab = "all" | "pending" | "approved" | "executed" | "rejected" | "failed"

interface AgentConfig {
  id: AgentId
  name: string
  shortName: string
  icon: typeof IndianRupee
  color: string
}

// ── Agents ─────────────────────────────────────────────────

const agents: AgentConfig[] = [
  { id: "budget-sentinel", name: "Budget Sentinel", shortName: "Budget", icon: IndianRupee, color: "#34d399" },
  { id: "audience-architect", name: "Audience Architect", shortName: "Audience", icon: Users, color: "#60a5fa" },
  { id: "creative-fatigue", name: "Creative Fatigue", shortName: "Creative", icon: Eye, color: "#f472b6" },
  { id: "bid-optimizer", name: "Bid Optimizer", shortName: "Bids", icon: TrendingUp, color: "#fbbf24" },
  { id: "lead-quality", name: "Lead Quality", shortName: "Leads", icon: Target, color: "#a78bfa" },
  { id: "performance-prophet", name: "Perf. Prophet", shortName: "Perf.", icon: BarChart3, color: "#fb923c" },
]

const agentMap: Record<string, AgentConfig> = Object.fromEntries(agents.map((a) => [a.id, a]))

// ── Status config ───────────────────────────────────────────

const statusConfig: Record<string, { color: string; bg: string; icon: typeof Clock; label: string }> = {
  pending:  { color: "#fbbf24", bg: "rgba(251, 191, 36, 0.10)", icon: Clock,         label: "Pending"  },
  approved: { color: "#4ade80", bg: "rgba(74, 222, 128, 0.10)", icon: CheckCircle,   label: "Approved" },
  executed: { color: "#a78bfa", bg: "rgba(167, 139, 250, 0.10)", icon: Zap,           label: "Executed" },
  rejected: { color: "var(--text-tertiary)", bg: "rgba(255, 255, 255, 0.04)", icon: XCircle, label: "Rejected" },
  failed:   { color: "#f87171", bg: "rgba(248, 113, 113, 0.10)", icon: AlertTriangle, label: "Failed"   },
}

const levelIcons: Record<string, typeof ImageIcon> = { ad: ImageIcon, adset: LayoutGrid, campaign: Megaphone }

// ── Section styling ─────────────────────────────────────────

const sectionStyles: Record<string, { icon: typeof Search; color: string }> = {
  situation:       { icon: Search,       color: "#60a5fa" },
  diagnosis:       { icon: Lightbulb,    color: "#fbbf24" },
  recommendation:  { icon: Wrench,       color: "#34d399" },
  expectedOutcome: { icon: ArrowUpRight, color: "#a78bfa" },
}

// ── Helpers ────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function actionLabel(action: ProposalAction): string {
  switch (action.type) {
    case "update_budget": return `Set budget to ₹${action.params.daily_budget}/day`
    case "pause_entity": return `Pause "${action.entityName}"`
    case "activate_entity": return `Activate "${action.entityName}"`
    case "update_bid_strategy": return `Change bid to ${(action.params.bid_strategy as string || "").replace(/_/g, " ").toLowerCase()}`
    default: return action.type
  }
}

function fmtInr(n: number | null | undefined): string {
  if (n == null) return "—"
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

function proxyUrl(url: string): string {
  return `/api/meta/image-proxy?url=${encodeURIComponent(url)}`
}

// ── Page ───────────────────────────────────────────────────

export default function InsightsPage() {
  const adAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { data: proposalsData, isLoading: proposalsLoading } = useProposals(adAccountId)
  const { data: stats, isLoading: statsLoading } = useProposalStats(adAccountId)
  const scanMutation = useScanProposals()
  const updateMutation = useUpdateProposal()

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all")
  const [executingId, setExecutingId] = useState<string | null>(null)
  const [lastExecution, setLastExecution] = useState<{ id: string; result: ExecutionResult } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAgents, setShowAgents] = useState(false)

  const proposals: AiProposal[] = proposalsData?.data || []

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: proposals.length, pending: 0, approved: 0, executed: 0, rejected: 0, failed: 0 }
    for (const p of proposals) c[p.status] = (c[p.status] || 0) + 1
    return c
  }, [proposals])

  const agentStats = useMemo(() => {
    const m: Record<string, number> = {}
    for (const p of proposals) m[p.agentId] = (m[p.agentId] || 0) + 1
    return m
  }, [proposals])

  const filtered = useMemo(() => {
    if (activeFilter === "all") return proposals
    return proposals.filter((p) => p.status === activeFilter)
  }, [proposals, activeFilter])

  const handleScan = (t: "quick" | "daily") => { if (adAccountId) scanMutation.mutate({ adAccountId, scanType: t }) }

  const handleApprove = (id: string) => {
    setExecutingId(id); setLastExecution(null)
    updateMutation.mutate({ id, action: "approve" }, {
      onSuccess: (d) => { if (d.execution) setLastExecution({ id, result: d.execution }); setExecutingId(null) },
      onError: () => setExecutingId(null),
    })
  }

  const handleRetry = (id: string) => {
    setExecutingId(id); setLastExecution(null)
    updateMutation.mutate({ id, action: "execute" }, {
      onSuccess: (d) => { if (d.execution) setLastExecution({ id, result: d.execution }); setExecutingId(null) },
      onError: () => setExecutingId(null),
    })
  }

  const handleReject = (id: string) => updateMutation.mutate({ id, action: "reject" })

  if (proposalsLoading || statsLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl" style={{ background: "var(--bg-muted)" }} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>AI Insights</h1>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
            {stats?.lastScan ? `Last scan ${timeAgo(stats.lastScan)}` : "Run a scan to analyze your ads"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleScan("quick")}
            disabled={scanMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-all"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)", color: "var(--text-primary)", opacity: scanMutation.isPending ? 0.6 : 1 }}
          >
            {scanMutation.isPending ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
            {scanMutation.isPending ? "Scanning…" : "Quick Scan"}
          </button>
          <button
            onClick={() => handleScan("daily")}
            disabled={scanMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-white transition-all"
            style={{ background: "var(--acc)", opacity: scanMutation.isPending ? 0.6 : 1 }}
          >
            <Play size={12} fill="white" />
            Full Review
          </button>
        </div>
      </div>

      {/* ── Stat strip ──────────────────────────────── */}
      <div
        className="flex items-center gap-6 rounded-xl px-5 py-3.5"
        style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
      >
        <StatPill label="Pending" value={stats?.pending ?? 0} color="#fbbf24" />
        <Sep />
        <StatPill label="Applied" value={stats?.applied ?? 0} color="#4ade80" />
        <Sep />
        <StatPill label="Savings" value={stats?.estimatedSavings ? fmtInr(stats.estimatedSavings) : "—"} color="#34d399" />
        <Sep />
        <StatPill label="Rejected" value={stats?.rejected ?? 0} />
        <button
          onClick={() => setShowAgents(!showAgents)}
          className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all"
          style={{ color: "var(--text-tertiary)", background: showAgents ? "var(--bg-muted)" : "transparent" }}
        >
          {showAgents ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Agents
        </button>
      </div>

      {/* ── Agent strip ─────────────────────────────── */}
      {showAgents && (
        <div className="grid grid-cols-6 gap-2">
          {agents.map((a) => {
            const c = agentStats[a.id] || 0
            const AgentIcon = a.icon
            return (
              <div
                key={a.id}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
              >
                <AgentIcon size={14} style={{ color: a.color, opacity: 0.8 }} />
                <div>
                  <p className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>{a.shortName}</p>
                  <p className="text-[10px]" style={{ color: c > 0 ? a.color : "var(--text-tertiary)" }}>
                    {c} {c === 1 ? "issue" : "issues"}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Filters ─────────────────────────────────── */}
      <div className="flex items-center gap-1">
        {(["all", "pending", "approved", "executed", "rejected", "failed"] as FilterTab[]).map((tab) => {
          const active = activeFilter === tab
          const count = statusCounts[tab] || 0
          const tabColor = tab !== "all" && tab !== "rejected" ? statusConfig[tab]?.color : undefined
          return (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all"
              style={{
                background: active ? "var(--bg-muted)" : "transparent",
                color: active ? (tabColor || "var(--text-primary)") : "var(--text-tertiary)",
                border: `1px solid ${active ? "var(--border-default)" : "transparent"}`,
              }}
            >
              {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {count > 0 && (
                <span
                  className="rounded-full px-1.5 text-[9px] font-bold"
                  style={{
                    background: active && tabColor ? `${tabColor}15` : "transparent",
                    color: active && tabColor ? tabColor : "var(--text-tertiary)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Proposals ───────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtered.map((p) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              expanded={expandedId === p.id}
              onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
              isExecuting={executingId === p.id}
              lastExecution={lastExecution?.id === p.id ? lastExecution.result : null}
              onApprove={() => handleApprove(p.id)}
              onReject={() => handleReject(p.id)}
              onRetry={() => handleRetry(p.id)}
            />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center gap-2 rounded-xl py-14"
          style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
        >
          <Sparkles size={20} style={{ color: "var(--text-tertiary)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {proposals.length ? "No proposals match this filter" : "No insights yet"}
          </p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {proposals.length ? "Try a different filter" : "Run a scan to analyze your campaigns, ad sets, and ads"}
          </p>
          {!proposals.length && (
            <button
              onClick={() => handleScan("quick")}
              disabled={scanMutation.isPending}
              className="mt-2 flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white"
              style={{ background: "var(--acc)" }}
            >
              <Zap size={13} />
              Run Quick Scan
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Small components ───────────────────────────────────────

function Sep() { return <div className="h-5 w-px" style={{ background: "var(--border-default)" }} /> }

function StatPill({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: color && value !== 0 && value !== "—" ? color : "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  )
}

// ── Proposal card ──────────────────────────────────────────

function ProposalCard({
  proposal: p, expanded, onToggle, isExecuting, lastExecution, onApprove, onReject, onRetry,
}: {
  proposal: AiProposal; expanded: boolean; onToggle: () => void
  isExecuting: boolean; lastExecution: ExecutionResult | null
  onApprove: () => void; onReject: () => void; onRetry: () => void
}) {
  const agent = agentMap[p.agentId] || agents[0]
  const stCfg = statusConfig[p.status] || statusConfig.pending
  const LevelIcon = p.metadata?.level ? levelIcons[p.metadata.level] || Megaphone : null
  const levelLabel = p.metadata?.level === "ad" ? "Ad" : p.metadata?.level === "adset" ? "Ad Set" : p.metadata?.level === "campaign" ? "Campaign" : null
  const hasStructured = !!(p.metadata?.situation || p.metadata?.diagnosis || p.metadata?.recommendation)
  const hasActions = p.metadata?.actions && p.metadata.actions.length > 0
  const creativeUrl = p.metadata?.creativeUrl
  const hasMetrics = p.metadata?.entityMetrics || p.metadata?.comparisonMetrics
  const riskColor = p.risk === "high" ? "#f87171" : p.risk === "medium" ? "#fbbf24" : "#4ade80"

  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
    >
      {/* ── Card header ── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 overflow-hidden text-[11px]">
          {/* Agent badge */}
          <span
            className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
            style={{ background: `${agent.color}12`, color: agent.color }}
          >
            <agent.icon size={10} />
            {agent.shortName}
          </span>
          {/* Level + entity path */}
          {LevelIcon && levelLabel && (
            <span className="flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
              <LevelIcon size={10} />
              <span>{levelLabel}</span>
            </span>
          )}
          {p.metadata?.parentInfo && (
            <span className="truncate text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              {p.metadata.parentInfo}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2.5 pl-3">
          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{timeAgo(p.createdAt)}</span>
          <span
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
            style={{ background: stCfg.bg, color: stCfg.color }}
          >
            <stCfg.icon size={9} />
            {stCfg.label}
          </span>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="px-5 pb-4">

        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <h3
            className="cursor-pointer text-[13px] font-semibold leading-snug"
            style={{ color: "var(--text-primary)" }}
            onClick={onToggle}
          >
            {p.title}
          </h3>
          <div className="flex shrink-0 items-center gap-3">
            {p.estimatedSavings != null && p.estimatedSavings > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#34d399" }}>
                <TrendingDown size={12} />
                {fmtInr(p.estimatedSavings)}/wk
              </span>
            )}
          </div>
        </div>

        {/* Content: thumbnail + analysis sections */}
        <div className={`mt-3 ${creativeUrl ? "flex gap-4" : ""}`}>

          {/* Thumbnail via proxy */}
          {creativeUrl && (
            <div className="shrink-0">
              <div
                className="overflow-hidden rounded-lg"
                style={{ width: 120, height: 120, border: "1px solid var(--border-default)", background: "var(--bg-muted)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={proxyUrl(creativeUrl)}
                  alt="Ad creative"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement
                    el.style.display = "none"
                    // Show a fallback icon
                    const parent = el.parentElement
                    if (parent && !parent.querySelector(".fallback-icon")) {
                      parent.classList.add("flex", "items-center", "justify-center")
                      const div = document.createElement("div")
                      div.className = "fallback-icon"
                      div.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-tertiary)"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`
                      parent.appendChild(div)
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Analysis body */}
          <div className="min-w-0 flex-1 space-y-2.5">
            {hasStructured ? (
              <>
                {p.metadata?.situation && (
                  <AnalysisSection type="situation" label="What's happening" text={p.metadata.situation} />
                )}
                {p.metadata?.diagnosis && (
                  <AnalysisSection type="diagnosis" label="Why" text={p.metadata.diagnosis} />
                )}
                {p.metadata?.recommendation && (
                  <div>
                    <AnalysisSection
                      type="recommendation"
                      label="What to do"
                      text={expanded ? p.metadata.recommendation : p.metadata.recommendation.split("\n")[0]}
                      multiline={expanded}
                    />
                    {p.metadata.recommendation.includes("\n") && (
                      <button onClick={onToggle} className="mt-1 text-[11px] font-medium" style={{ color: "var(--acc)" }}>
                        {expanded ? "Show less" : `Show all ${p.metadata.recommendation.split("\n").filter(Boolean).length} steps`}
                      </button>
                    )}
                  </div>
                )}
                {p.metadata?.expectedOutcome && (
                  <AnalysisSection type="expectedOutcome" label="Expected outcome" text={p.metadata.expectedOutcome} />
                )}
              </>
            ) : (
              <>
                <p className={`text-xs leading-relaxed ${expanded ? "" : "line-clamp-3"}`} style={{ color: "var(--text-secondary)" }}>
                  {p.description}
                </p>
                {p.description.length > 180 && (
                  <button onClick={onToggle} className="text-[11px] font-medium" style={{ color: "var(--acc)" }}>
                    {expanded ? "Show less" : "Read more"}
                  </button>
                )}
                {p.impact && <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{p.impact}</p>}
              </>
            )}
          </div>
        </div>

        {/* Metrics comparison */}
        {hasMetrics && (
          <div
            className="mt-3.5 grid gap-px overflow-hidden rounded-lg"
            style={{ background: "var(--border-default)", gridTemplateColumns: p.metadata!.entityMetrics && p.metadata!.comparisonMetrics ? "1fr 1fr" : "1fr" }}
          >
            {p.metadata!.entityMetrics && (
              <MetricStrip
                label={p.metadata!.entityName || "This entity"}
                m={p.metadata!.entityMetrics}
                highlight
              />
            )}
            {p.metadata!.comparisonMetrics && (
              <MetricStrip
                label={p.metadata!.comparisonMetrics.label}
                m={p.metadata!.comparisonMetrics as Partial<EntityMetrics>}
              />
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3.5 flex items-center gap-3 border-t pt-3" style={{ borderColor: "var(--border-default)" }}>
          {/* Confidence + Risk */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="relative h-1.5 w-10 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${p.confidence}%`, background: p.confidence >= 85 ? "#4ade80" : p.confidence >= 70 ? "#fbbf24" : "#f87171" }}
                />
              </div>
              <span className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>{p.confidence}%</span>
            </div>
            <span
              className="flex items-center gap-1 text-[10px] capitalize"
              style={{ color: riskColor }}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: riskColor }} />
              {p.risk}
            </span>
          </div>

          {/* Action previews */}
          {hasActions && (
            <div className="flex min-w-0 items-center gap-1 overflow-hidden">
              {p.metadata!.actions!.slice(0, 2).map((a, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px]"
                  style={{ background: "var(--bg-muted)", color: "var(--text-secondary)" }}
                >
                  <ArrowRight size={8} style={{ color: "var(--text-tertiary)" }} />
                  <span className="max-w-[140px] truncate">{actionLabel(a)}</span>
                </span>
              ))}
              {p.metadata!.actions!.length > 2 && (
                <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>+{p.metadata!.actions!.length - 2}</span>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {p.status === "pending" && (
              <>
                <button
                  onClick={onReject} disabled={isExecuting}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all hover:bg-[rgba(255,255,255,0.04)]"
                  style={{ color: "var(--text-tertiary)", border: "1px solid var(--border-default)" }}
                >
                  <ThumbsDown size={11} />
                  Reject
                </button>
                <button
                  onClick={onApprove} disabled={isExecuting}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-all"
                  style={{ background: "var(--acc)", opacity: isExecuting ? 0.6 : 1 }}
                >
                  {isExecuting ? <RefreshCw size={11} className="animate-spin" /> : <ThumbsUp size={11} />}
                  {isExecuting ? "Executing…" : "Approve & Execute"}
                </button>
              </>
            )}
            {p.status === "failed" && (
              <button
                onClick={onRetry} disabled={isExecuting}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all"
                style={{ color: "var(--text-secondary)", border: "1px solid var(--border-default)", opacity: isExecuting ? 0.6 : 1 }}
              >
                {isExecuting ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                {isExecuting ? "Retrying…" : "Retry"}
              </button>
            )}
          </div>
        </div>

        {/* Execution result */}
        {lastExecution && <ExecResult result={lastExecution} />}
        {!lastExecution && (p.status === "executed" || p.status === "failed") && p.metadata?.executionResult && (
          <ExecResult result={p.metadata.executionResult} />
        )}
      </div>
    </div>
  )
}

// ── Analysis section with colored left border ───────────────

function AnalysisSection({ type, label, text, multiline }: { type: string; label: string; text: string; multiline?: boolean }) {
  const style = sectionStyles[type] || sectionStyles.situation
  const SectionIcon = style.icon
  const lines = text.split("\\n").flatMap((l) => l.split("\n")).filter(Boolean)

  return (
    <div
      className="rounded-r-md border-l-2 py-0.5 pl-3"
      style={{ borderColor: `${style.color}40` }}
    >
      <p className="mb-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider" style={{ color: style.color, opacity: 0.8 }}>
        <SectionIcon size={10} />
        {label}
      </p>
      {lines.length > 1 && multiline !== false ? (
        <div className="space-y-0.5">
          {lines.map((l, i) => (
            <p key={i} className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{l.trim()}</p>
          ))}
        </div>
      ) : (
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{lines[0]}</p>
      )}
    </div>
  )
}

// ── Metric strip ────────────────────────────────────────────

function MetricStrip({ label, m, highlight }: { label: string; m: Partial<EntityMetrics>; highlight?: boolean }) {
  return (
    <div className="px-3.5 py-2.5" style={{ background: "var(--bg-muted)" }}>
      <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wider" style={{ color: highlight ? "var(--text-secondary)" : "var(--text-tertiary)" }}>
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px]">
        {m.spend != null && <MiniVal k="Spend" v={fmtInr(m.spend)} />}
        {m.leads != null && <MiniVal k="Leads" v={String(m.leads)} />}
        {m.cpl !== undefined && <MiniVal k="CPL" v={m.cpl ? fmtInr(m.cpl) : "—"} accent={highlight} />}
        {m.ctr != null && <MiniVal k="CTR" v={`${m.ctr}%`} />}
        {m.cpc != null && <MiniVal k="CPC" v={fmtInr(m.cpc)} />}
      </div>
    </div>
  )
}

function MiniVal({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <span style={{ color: accent ? "#fbbf24" : "var(--text-primary)" }}>
      <span className="font-sans text-[9px] uppercase" style={{ color: "var(--text-tertiary)" }}>{k} </span>
      {v}
    </span>
  )
}

// ── Execution result ────────────────────────────────────────

function ExecResult({ result }: { result: ExecutionResult }) {
  const ok = result.status === "success"
  return (
    <div className="mt-3 rounded-lg px-3 py-2.5" style={{ background: ok ? "rgba(74, 222, 128, 0.06)" : "rgba(248, 113, 113, 0.06)" }}>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: ok ? "#4ade80" : "#f87171" }}>
        {ok ? "Executed successfully" : result.status === "partial_failure" ? "Partial execution" : "Execution failed"}
      </p>
      {result.actionResults.map((r, i) => (
        <div key={i} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
          {r.status === "success" ? <CheckCircle size={10} style={{ color: "#4ade80" }} /> : <XCircle size={10} style={{ color: "#f87171" }} />}
          {actionLabel(r.action)}
          {r.error && <span className="text-[10px]" style={{ color: "#f87171" }}>— {r.error}</span>}
        </div>
      ))}
    </div>
  )
}
