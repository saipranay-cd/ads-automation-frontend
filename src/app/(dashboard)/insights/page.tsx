"use client"

import { useState, useMemo } from "react"
import {
  IndianRupee, Users, Eye, TrendingUp, Target, BarChart3,
  Zap, Play, AlertTriangle, CheckCircle, Clock, XCircle,
  ArrowRight, RefreshCw, Megaphone, LayoutGrid, Image as ImageIcon,
  ChevronDown, ChevronUp, Sparkles, ThumbsUp, ThumbsDown,
  TrendingDown, Lightbulb, Search, Wrench, ArrowUpRight, Download,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { usePlatform } from "@/hooks/use-platform"
import { useProposals, useProposalStats, useScanProposals, useUpdateProposal, useImpactStats, useMeasureProposals } from "@/hooks/use-campaigns"
import type { AiProposal, ExecutionResult, ProposalAction, EntityMetrics, ImpactStats } from "@/hooks/use-campaigns"
import { useGoogleProposals, useGoogleProposalStats, useScanGoogleProposals } from "@/hooks/use-google"
import { EmptyState } from "@/components/ui/empty-state"
import { useCanEdit } from "@/hooks/use-role"

// ── Types ──────────────────────────────────────────────────

type AgentId = "budget-sentinel" | "audience-architect" | "creative-fatigue" | "bid-optimizer" | "lead-quality" | "performance-prophet"
type FilterTab = "all" | "pending" | "approved" | "executed" | "rejected" | "failed" | "superseded" | "undone"

interface AgentConfig {
  id: AgentId
  name: string
  shortName: string
  icon: typeof IndianRupee
  color: string
}

// ── Agents ─────────────────────────────────────────────────

// Meta agents
const metaAgents: AgentConfig[] = [
  { id: "budget-sentinel" as AgentId, name: "Budget Sentinel", shortName: "Budget", icon: IndianRupee, color: "#34d399" },
  { id: "audience-architect" as AgentId, name: "Audience Architect", shortName: "Audience", icon: Users, color: "#60a5fa" },
  { id: "creative-fatigue" as AgentId, name: "Creative Fatigue", shortName: "Creative", icon: Eye, color: "#f472b6" },
  { id: "bid-optimizer" as AgentId, name: "Bid Optimizer", shortName: "Bids", icon: TrendingUp, color: "#fbbf24" },
  { id: "lead-quality" as AgentId, name: "Lead Quality", shortName: "Leads", icon: Target, color: "#a78bfa" },
  { id: "performance-prophet" as AgentId, name: "Perf. Prophet", shortName: "Perf.", icon: BarChart3, color: "#fb923c" },
]

// Google agents
const googleAgents: AgentConfig[] = [
  { id: "keyword-optimizer" as AgentId, name: "Keyword Optimizer", shortName: "Keywords", icon: Search, color: "#34d399" },
  { id: "quality-score-improver" as AgentId, name: "Quality Score", shortName: "QS", icon: Target, color: "#60a5fa" },
  { id: "bid-strategist" as AgentId, name: "Bid Strategist", shortName: "Bids", icon: TrendingUp, color: "#fbbf24" },
  { id: "negative-keyword-finder" as AgentId, name: "Neg. Keywords", shortName: "Negatives", icon: XCircle, color: "#f472b6" },
  { id: "ad-copy-tester" as AgentId, name: "Ad Copy Tester", shortName: "Copy", icon: Eye, color: "#a78bfa" },
  { id: "budget-rebalancer" as AgentId, name: "Budget Rebalancer", shortName: "Budget", icon: IndianRupee, color: "#fb923c" },
]

const agents = [...metaAgents, ...googleAgents]

const agentMap: Record<string, AgentConfig> = Object.fromEntries(agents.map((a) => [a.id, a]))

// ── Status config ───────────────────────────────────────────

const statusConfig: Record<string, { color: string; bg: string; icon: typeof Clock; label: string }> = {
  pending:  { color: "#fbbf24", bg: "rgba(251, 191, 36, 0.10)", icon: Clock,         label: "Pending"  },
  approved: { color: "#4ade80", bg: "rgba(74, 222, 128, 0.10)", icon: CheckCircle,   label: "Approved" },
  executed: { color: "#a78bfa", bg: "rgba(167, 139, 250, 0.10)", icon: Zap,           label: "Executed" },
  rejected:   { color: "var(--text-tertiary)", bg: "rgba(255, 255, 255, 0.04)", icon: XCircle,       label: "Rejected"   },
  failed:     { color: "#f87171", bg: "rgba(248, 113, 113, 0.10)", icon: AlertTriangle, label: "Failed"     },
  superseded: { color: "var(--text-tertiary)", bg: "rgba(255, 255, 255, 0.02)", icon: Clock,         label: "Superseded" },
  undone:     { color: "#fbbf24", bg: "rgba(251, 191, 36, 0.08)", icon: ArrowRight,    label: "Undone"     },
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
  const { platform } = usePlatform()
  const adAccountId = useAppStore((s) => s.selectedAdAccountId)
  const selectedGoogleAccountId = useAppStore((s) => s.selectedGoogleAccountId)
  const accountId = platform === "google" ? selectedGoogleAccountId : adAccountId
  const isGoogle = platform === "google"

  // Meta hooks
  const { data: metaProposalsData, isLoading: metaProposalsLoading } = useProposals(isGoogle ? null : accountId)
  const { data: metaStats, isLoading: metaStatsLoading } = useProposalStats(isGoogle ? null : accountId)
  const metaScanMutation = useScanProposals()

  // Google hooks
  const { data: googleProposalsData, isLoading: googleProposalsLoading } = useGoogleProposals(isGoogle ? accountId : null)
  const { data: googleStats, isLoading: googleStatsLoading } = useGoogleProposalStats(isGoogle ? accountId : null)
  const googleScanMutation = useScanGoogleProposals()

  // Unified: pick the right data source based on platform
  const proposalsData = isGoogle ? googleProposalsData : metaProposalsData
  const proposalsLoading = isGoogle ? googleProposalsLoading : metaProposalsLoading
  const stats = isGoogle ? googleStats : metaStats
  const statsLoading = isGoogle ? googleStatsLoading : metaStatsLoading
  const scanMutation = isGoogle ? googleScanMutation : metaScanMutation

  const { data: impactData } = useImpactStats(isGoogle ? null : accountId)
  const updateMutation = useUpdateProposal()
  const measureMutation = useMeasureProposals()
  const canEdit = useCanEdit()

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all")
  const [executingId, setExecutingId] = useState<string | null>(null)
  const [lastExecution, setLastExecution] = useState<{ id: string; result: ExecutionResult } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAgents, setShowAgents] = useState(false)
  const [scanBackground, setScanBackground] = useState(false)

  const impact = impactData?.data

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

  const handleScan = (t: "quick" | "daily") => {
    if (!accountId) return
    setScanBackground(false)
    scanMutation.mutate(
      { adAccountId: accountId, scanType: t },
      {
        onSuccess: (data: any) => {
          if (data?.isBackground) {
            setScanBackground(true)
            // Auto-dismiss after 3 minutes
            setTimeout(() => setScanBackground(false), 180_000)
          }
        },
      }
    )
  }

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

  const getFilteredProposals = () => proposals.filter(p => activeFilter === "all" ? true : p.status === activeFilter)

  const handleExportCSV = () => {
    const items = getFilteredProposals()
    if (items.length === 0) return

    const csvRows = [
      ["Agent", "Status", "Risk", "Confidence", "Title", "Campaign", "Situation", "Diagnosis", "Recommendation", "Expected Outcome", "Est. Savings", "Actions"].join(","),
      ...items.map(p => [
        p.agentId, p.status, p.risk, p.confidence,
        `"${(p.title || "").replace(/"/g, '""')}"`,
        `"${(p.campaignName || "").replace(/"/g, '""')}"`,
        `"${(p.metadata?.situation || "").replace(/"/g, '""')}"`,
        `"${(p.metadata?.diagnosis || "").replace(/"/g, '""')}"`,
        `"${(p.metadata?.recommendation || "").replace(/"/g, '""').replace(/\n/g, " | ")}"`,
        `"${(p.metadata?.expectedOutcome || p.impact || "").replace(/"/g, '""')}"`,
        p.estimatedSavings || "",
        (p.metadata?.actions || []).map((a: any) => `${a.type}: ${a.entityName}`).join("; "),
      ].join(","))
    ]
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url
    a.download = `adsflow-proposals-${new Date().toISOString().split("T")[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    const items = getFilteredProposals()
    if (items.length === 0) return

    const date = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    const riskColor = (r: string) => r === "high" ? "#f87171" : r === "medium" ? "#fbbf24" : "#4ade80"

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Adsflow AI Proposals — ${date}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DM Sans', -apple-system, sans-serif; color: #1a1a1a; padding: 40px; max-width: 900px; margin: 0 auto; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .subtitle { font-size: 12px; color: #888; margin-bottom: 24px; }
  .summary { display: flex; gap: 24px; margin-bottom: 32px; padding: 16px; background: #f8f9fa; border-radius: 8px; }
  .summary-item { text-align: center; }
  .summary-item .num { font-size: 20px; font-weight: 700; font-family: 'DM Mono', monospace; }
  .summary-item .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
  .proposal { border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 16px; overflow: hidden; page-break-inside: avoid; }
  .proposal-header { padding: 14px 18px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 10px; }
  .agent-badge { font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
  .risk { font-size: 10px; font-weight: 500; padding: 2px 6px; border-radius: 3px; }
  .confidence { font-size: 10px; color: #888; margin-left: auto; font-family: 'DM Mono', monospace; }
  .proposal-title { font-size: 13px; font-weight: 600; padding: 0 18px; margin-top: 10px; }
  .section { padding: 8px 18px; }
  .section-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #888; margin-bottom: 4px; }
  .section-text { font-size: 11px; line-height: 1.5; color: #444; }
  .metrics { display: flex; gap: 16px; padding: 10px 18px; background: #fafafa; font-family: 'DM Mono', monospace; font-size: 10px; }
  .metric span { color: #888; font-family: 'DM Sans', sans-serif; font-size: 9px; text-transform: uppercase; }
  .actions { padding: 10px 18px 14px; }
  .action { font-size: 10px; padding: 4px 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; display: inline-block; margin-right: 6px; margin-bottom: 4px; color: #16a34a; }
  .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #ccc; }
  @media print { body { padding: 20px; } .proposal { break-inside: avoid; } }
</style>
</head><body>
<h1>AI Proposals Report</h1>
<p class="subtitle">Generated by Adsflow on ${date} &middot; ${items.length} proposals</p>

<div class="summary">
  <div class="summary-item"><div class="num">${items.length}</div><div class="label">Total</div></div>
  <div class="summary-item"><div class="num">${items.filter(p => p.status === "pending").length}</div><div class="label">Pending</div></div>
  <div class="summary-item"><div class="num">${items.filter(p => p.status === "executed").length}</div><div class="label">Executed</div></div>
  <div class="summary-item"><div class="num">${items.filter(p => p.estimatedSavings).reduce((s, p) => s + (p.estimatedSavings || 0), 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}</div><div class="label">Est. Savings</div></div>
</div>

${items.map((p, i) => {
  const agentColors: Record<string, string> = {
    "budget-sentinel": "#34d399", "audience-architect": "#60a5fa", "creative-fatigue": "#f472b6",
    "bid-optimizer": "#fbbf24", "lead-quality": "#a78bfa", "performance-prophet": "#fb923c",
  }
  const agentColor = agentColors[p.agentId] || "#888"
  const m = p.metadata?.entityMetrics
  return `
<div class="proposal">
  <div class="proposal-header">
    <span class="agent-badge" style="background: ${agentColor}15; color: ${agentColor}">${p.agentId.replace("-", " ")}</span>
    <span class="risk" style="background: ${riskColor(p.risk)}15; color: ${riskColor(p.risk)}">${p.risk} risk</span>
    <span style="font-size:10px;color:#888">${p.status}</span>
    <span class="confidence">${p.confidence}%</span>
  </div>
  <div class="proposal-title">${p.title || "Untitled"}</div>
  ${p.metadata?.situation ? `<div class="section"><div class="section-label">What's happening</div><div class="section-text">${p.metadata.situation}</div></div>` : ""}
  ${p.metadata?.diagnosis ? `<div class="section"><div class="section-label">Why</div><div class="section-text">${p.metadata.diagnosis}</div></div>` : ""}
  ${p.metadata?.recommendation ? `<div class="section"><div class="section-label">What to do</div><div class="section-text">${p.metadata.recommendation.replace(/\n/g, "<br>")}</div></div>` : ""}
  ${p.metadata?.expectedOutcome || p.impact ? `<div class="section"><div class="section-label">Expected outcome</div><div class="section-text">${p.metadata?.expectedOutcome || p.impact}</div></div>` : ""}
  ${m ? `<div class="metrics">
    ${m.spend != null ? `<div class="metric"><span>Spend </span>₹${Math.round(m.spend).toLocaleString()}</div>` : ""}
    ${m.leads != null ? `<div class="metric"><span>Leads </span>${m.leads}</div>` : ""}
    ${m.cpl != null ? `<div class="metric"><span>CPL </span>₹${Math.round(m.cpl)}</div>` : ""}
    ${m.ctr != null ? `<div class="metric"><span>CTR </span>${m.ctr}%</div>` : ""}
  </div>` : ""}
  ${(p.metadata?.actions || []).length > 0 ? `<div class="actions">${(p.metadata?.actions || []).map((a: any) => `<span class="action">${actionLabel(a)}</span>`).join("")}</div>` : ""}
</div>`
}).join("")}

<div class="footer">Generated by Adsflow AI Insights &middot; ${date}</div>
</body></html>`

    // Open in new tab for print
    const w = window.open("", "_blank")
    if (w) {
      w.document.write(html)
      w.document.close()
      setTimeout(() => w.print(), 500)
    }
  }

  const handleUndo = (id: string) => {
    setExecutingId(id)
    updateMutation.mutate({ id, action: "undo" }, {
      onSuccess: () => setExecutingId(null),
      onError: () => setExecutingId(null),
    })
  }

  // Google Ads AI Insights now supported — no early return

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
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>AI Insights</h1>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(24,119,242,0.10)", color: "#1877f2" }}>Meta Ads</span>
          </div>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
            {stats?.lastScan ? `Last scan ${timeAgo(stats.lastScan)}` : "Run a scan to analyze your ads"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {proposals.length > 0 && (
            <div className="relative group">
              <button
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all"
                style={{ color: "var(--text-tertiary)", border: "1px solid var(--border-default)" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--text-secondary)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-tertiary)"}
              >
                <Download size={13} />
                Export
                <ChevronDown size={10} />
              </button>
              {/* Invisible bridge to prevent hover gap */}
              <div className="absolute right-0 top-full z-20 hidden pt-1 group-hover:block">
                <div className="w-36 rounded-lg overflow-hidden shadow-lg" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
                  <button
                    onClick={handleExportCSV}
                    className="w-full px-3 py-2 text-left text-[11px] font-medium transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-muted)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full px-3 py-2 text-left text-[11px] font-medium transition-colors"
                    style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border-default)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-muted)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    Export as PDF
                  </button>
                </div>
              </div>
            </div>
          )}
          {canEdit ? (
            <>
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
            </>
          ) : (
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-medium"
              style={{ background: "var(--bg-muted)", color: "var(--text-tertiary)" }}
            >
              View only
            </span>
          )}
        </div>
      </div>

      {/* ── Background scan banner ─────────────────── */}
      {scanBackground && (
        <div
          className="flex items-center gap-3 rounded-lg px-4 py-3"
          style={{ background: "rgba(96, 165, 250, 0.08)", border: "1px solid rgba(96, 165, 250, 0.2)" }}
        >
          <RefreshCw size={14} className="animate-spin shrink-0" style={{ color: "#60a5fa" }} />
          <div className="flex-1">
            <span className="text-[12px] font-medium" style={{ color: "#60a5fa" }}>
              AI scan is running in the background
            </span>
            <span className="text-[11px] ml-2" style={{ color: "rgba(96, 165, 250, 0.7)" }}>
              This can take 1-2 minutes. New proposals will appear automatically when ready.
            </span>
          </div>
          <button
            onClick={() => setScanBackground(false)}
            className="text-[10px] font-medium rounded px-2 py-1 transition-colors"
            style={{ color: "#60a5fa" }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Scan error banner */}
      {scanMutation.isError && !scanBackground && (
        <div
          className="flex items-center gap-3 rounded-lg px-4 py-3"
          style={{ background: "var(--red-bg)", border: "1px solid rgba(248, 113, 113, 0.2)" }}
        >
          <AlertTriangle size={14} style={{ color: "var(--red-text)" }} />
          <span className="text-[12px] font-medium" style={{ color: "var(--red-text)" }}>
            {scanMutation.error?.message || "Scan failed. Try again."}
          </span>
        </div>
      )}

      {/* ── Impact summary ───────────────────────────── */}
      {impact && impact.executed > 0 && (
        <div
          className="flex items-center gap-6 rounded-xl px-5 py-3"
          style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
        >
          <StatPill label="Executed" value={impact.executed} color="#60a5fa" />
          <Sep />
          <StatPill label="Measured" value={impact.measured} color="#a78bfa" />
          <Sep />
          <StatPill label="Improved" value={`${impact.improved} (${impact.successRate}%)`} color="#4ade80" />
          <Sep />
          <StatPill label="Actual Savings" value={impact.totalSavings > 0 ? fmtInr(impact.totalSavings) : "—"} color="#34d399" />
          {impact.degraded > 0 && (
            <>
              <Sep />
              <StatPill label="Degraded" value={impact.degraded} color="#f87171" />
            </>
          )}
        </div>
      )}

      {/* ── Stat strip ──────────────────────────────── */}
      <div
        className="flex items-center gap-6 rounded-xl px-5 py-3.5"
        style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
      >
        <StatPill label="Pending" value={stats?.pending ?? 0} color="#fbbf24" />
        <Sep />
        <StatPill label="Applied" value={stats?.applied ?? 0} color="#4ade80" />
        <Sep />
        <StatPill label="Est. Savings" value={stats?.estimatedSavings ? fmtInr(stats.estimatedSavings) : "—"} color="#34d399" />
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
              onUndo={() => handleUndo(p.id)}
              canEdit={canEdit}
            />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center gap-3 rounded-xl py-14 px-6"
          style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
        >
          {proposals.length ? (
            <>
              <Sparkles size={20} style={{ color: "var(--text-tertiary)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No proposals match this filter</p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Try a different filter</p>
            </>
          ) : (
            <>
              <Sparkles size={24} style={{ color: "var(--acc)" }} />
              <p className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>How AI Insights Work</p>
              <div className="flex flex-col gap-3 mt-2 max-w-[420px]">
                {[
                  { step: "1", label: "Scan", desc: "AI analyzes all your campaigns, ad sets, and ads using Meta metrics + CRM quality data", color: "#60a5fa" },
                  { step: "2", label: "Review", desc: "Review each proposal — see what's automated vs what you do manually", color: "#a78bfa" },
                  { step: "3", label: "Execute", desc: "Approve & execute — the AI makes changes on Meta (budget, pause, activate). You can undo anytime.", color: "#4ade80" },
                  { step: "4", label: "Measure", desc: "After 7 days, see the before/after impact — did CPQL improve? Did quality leads increase?", color: "#fbbf24" },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: s.color }}
                    >
                      {s.step}
                    </div>
                    <div>
                      <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>{s.label}</span>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {!proposals.length && canEdit && (
            <button
              onClick={() => handleScan("quick")}
              disabled={scanMutation.isPending}
              className="mt-3 flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white"
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
  proposal: p, expanded, onToggle, isExecuting, lastExecution, onApprove, onReject, onRetry, onUndo, canEdit = true,
}: {
  proposal: AiProposal; expanded: boolean; onToggle: () => void
  isExecuting: boolean; lastExecution: ExecutionResult | null
  onApprove: () => void; onReject: () => void; onRetry: () => void; onUndo?: () => void
  canEdit?: boolean
}) {
  const [showConfirm, setShowConfirm] = useState(false)
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
            {(p.agentId === "lead-quality" || p.description?.includes("CPQL") || p.description?.includes("CRM") || p.description?.includes("Dead")) && (
              <span
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                style={{ background: "rgba(167, 139, 250, 0.12)", color: "#a78bfa" }}
              >
                CRM
              </span>
            )}
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
            {canEdit ? (
              <>
                {p.status === "pending" && !showConfirm && (
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
                      onClick={() => setShowConfirm(true)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-all"
                      style={{ background: "var(--acc)" }}
                    >
                      <ThumbsUp size={11} />
                      Approve & Execute
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
                {p.status === "executed" && onUndo && (
                  <button
                    onClick={onUndo} disabled={isExecuting}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all"
                    style={{ color: "var(--text-tertiary)", border: "1px solid var(--border-default)", opacity: isExecuting ? 0.6 : 1 }}
                  >
                    {isExecuting ? <RefreshCw size={11} className="animate-spin" /> : <ArrowRight size={11} style={{ transform: "rotate(180deg)" }} />}
                    Undo
                  </button>
                )}
              </>
            ) : (
              p.status === "pending" && (
                <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>View only</span>
              )
            )}
            {p.status === "undone" && (
              <span className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium" style={{ background: "rgba(251,191,36,0.10)", color: "#fbbf24" }}>
                Undone
              </span>
            )}
          </div>
        </div>

        {/* Execution confirmation modal */}
        {showConfirm && p.status === "pending" && (() => {
          const actions = p.metadata?.actions || []
          const recommendations = (p.metadata?.recommendation || "").split("\n").filter((l: string) => l.trim())
          // Separate automated (first N matching actions) from manual (rest)
          const manualSteps = actions.length > 0
            ? recommendations.slice(actions.length)
            : recommendations
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false) }}
            >
              <div
                className="w-full max-w-[480px] rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
              >
                {/* Header */}
                <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "rgba(139,92,246,0.12)" }}>
                      <Zap size={15} style={{ color: "var(--acc)" }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        Confirm Execution
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                        {p.title}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Automated actions */}
                <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#4ade80" }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#4ade80" }}>
                      Automated — executes on Meta now
                    </span>
                  </div>
                  {actions.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {actions.map((a: ProposalAction, i: number) => (
                        <div key={i} className="flex items-center gap-2.5 rounded-lg px-3 py-2" style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.12)" }}>
                          <Play size={11} style={{ color: "#4ade80", flexShrink: 0 }} />
                          <div>
                            <span className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
                              {actionLabel(a)}
                            </span>
                            <span className="block text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                              {a.entityLevel}: {a.entityName}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg px-3 py-2.5" style={{ background: "var(--bg-muted)" }}>
                      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                        No automated actions — this is an advisory-only recommendation.
                      </p>
                    </div>
                  )}
                </div>

                {/* Manual steps */}
                {manualSteps.length > 0 && (
                  <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border-default)" }}>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#fbbf24" }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#fbbf24" }}>
                        Manual — do these yourself
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {manualSteps.map((step: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 py-0.5">
                          <span className="text-[10px] mt-0.5 shrink-0 w-4 text-right" style={{ color: "var(--text-tertiary)" }}>{i + 1}.</span>
                          <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{step.replace(/^\d+\.\s*/, "")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="px-5 py-3.5 flex items-center justify-between">
                  <span className="text-[10px] max-w-[220px]" style={{ color: "var(--text-tertiary)" }}>
                    Undo available anytime. Impact measured after 7 days.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="rounded-lg px-3.5 py-2 text-[11px] font-medium transition-all"
                      style={{ color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-muted)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { setShowConfirm(false); onApprove(); }}
                      disabled={isExecuting}
                      className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[11px] font-semibold text-white transition-all"
                      style={{ background: actions.length > 0 ? "#4ade80" : "var(--acc)", opacity: isExecuting ? 0.6 : 1 }}
                    >
                      {isExecuting ? <RefreshCw size={11} className="animate-spin" /> : <Play size={11} />}
                      {isExecuting ? "Executing…" : actions.length > 0 ? "Execute Now" : "Acknowledge"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Impact measurement (before/after) */}
        {p.status === "executed" && (p as any).impactStatus === "pending_measurement" && (
          <div className="mx-4 mb-3 rounded-lg px-3 py-2 text-[11px]" style={{ background: "rgba(167,139,250,0.06)", color: "#a78bfa" }}>
            Impact will be measured in {Math.max(0, 7 - Math.floor((Date.now() - new Date((p as any).executedAt || p.createdAt).getTime()) / (24*60*60*1000)))} days
          </div>
        )}
        {((p as any).impactStatus === "improved" || (p as any).impactStatus === "degraded" || (p as any).impactStatus === "no_change") && (p as any).beforeMetrics && (p as any).afterMetrics && (
          <ImpactCard beforeMetrics={(p as any).beforeMetrics} afterMetrics={(p as any).afterMetrics} impactStatus={(p as any).impactStatus} estimatedSavings={p.estimatedSavings} actualSavings={(p as any).actualSavings} />
        )}

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

// ── Impact card (before/after comparison) ───────────────────

function ImpactCard({ beforeMetrics, afterMetrics, impactStatus, estimatedSavings, actualSavings }: {
  beforeMetrics: any; afterMetrics: any; impactStatus: string; estimatedSavings?: number | null; actualSavings?: number | null
}) {
  const verdictColor = impactStatus === "improved" ? "#4ade80" : impactStatus === "degraded" ? "#f87171" : "#fbbf24"
  const verdictLabel = impactStatus === "improved" ? "IMPROVED" : impactStatus === "degraded" ? "DEGRADED" : "NO CHANGE"
  const verdictIcon = impactStatus === "improved" ? "↑" : impactStatus === "degraded" ? "↓" : "→"

  function delta(before: number | null, after: number | null): string {
    if (before == null || after == null || before === 0) return ""
    const pct = Math.round(((after - before) / before) * 100)
    return pct > 0 ? `+${pct}%` : `${pct}%`
  }

  function deltaColor(before: number | null, after: number | null, lowerIsBetter = false): string {
    if (before == null || after == null) return "var(--text-tertiary)"
    const improved = lowerIsBetter ? after < before : after > before
    return improved ? "#4ade80" : after === before ? "var(--text-tertiary)" : "#f87171"
  }

  return (
    <div className="mx-4 mb-3 rounded-lg overflow-hidden" style={{ border: `1px solid ${verdictColor}25` }}>
      {/* Verdict banner */}
      <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: `${verdictColor}10` }}>
        <span className="text-[11px] font-bold" style={{ color: verdictColor }}>{verdictIcon} {verdictLabel}</span>
        {actualSavings != null && estimatedSavings != null && (
          <span className="ml-auto text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            Est. {fmtInr(estimatedSavings)} → Actual {fmtInr(actualSavings)} ({Math.round((actualSavings / (estimatedSavings || 1)) * 100)}%)
          </span>
        )}
      </div>
      {/* Before/After grid */}
      <div className="grid grid-cols-2 gap-px" style={{ background: "var(--border-default)" }}>
        <div className="px-3 py-2" style={{ background: "var(--bg-muted)" }}>
          <p className="text-[9px] font-medium uppercase mb-1" style={{ color: "var(--text-tertiary)" }}>Before</p>
          <div className="flex flex-col gap-0.5 font-mono text-[11px]">
            {beforeMetrics.spend != null && <span style={{ color: "var(--text-secondary)" }}>Spend: {fmtInr(beforeMetrics.spend)}</span>}
            {beforeMetrics.crm?.cpql != null && <span style={{ color: "var(--text-secondary)" }}>CPQL: {fmtInr(beforeMetrics.crm.cpql)}</span>}
            {beforeMetrics.crm?.junkPercentage != null && <span style={{ color: "var(--text-secondary)" }}>Junk: {beforeMetrics.crm.junkPercentage}%</span>}
            {beforeMetrics.crm?.qualityLeads != null && <span style={{ color: "var(--text-secondary)" }}>Quality: {beforeMetrics.crm.qualityLeads}</span>}
          </div>
        </div>
        <div className="px-3 py-2" style={{ background: "var(--bg-muted)" }}>
          <p className="text-[9px] font-medium uppercase mb-1" style={{ color: "var(--text-tertiary)" }}>After (7d)</p>
          <div className="flex flex-col gap-0.5 font-mono text-[11px]">
            {afterMetrics.spend != null && (
              <span>
                <span style={{ color: "var(--text-secondary)" }}>Spend: {fmtInr(afterMetrics.spend)}</span>
                <span className="ml-1 text-[9px]" style={{ color: deltaColor(beforeMetrics.spend, afterMetrics.spend, true) }}>{delta(beforeMetrics.spend, afterMetrics.spend)}</span>
              </span>
            )}
            {afterMetrics.crm?.cpql != null && (
              <span>
                <span style={{ color: verdictColor, fontWeight: 600 }}>CPQL: {fmtInr(afterMetrics.crm.cpql)}</span>
                <span className="ml-1 text-[9px]" style={{ color: deltaColor(beforeMetrics.crm?.cpql, afterMetrics.crm?.cpql, true) }}>{delta(beforeMetrics.crm?.cpql, afterMetrics.crm?.cpql)}</span>
              </span>
            )}
            {afterMetrics.crm?.junkPercentage != null && (
              <span>
                <span style={{ color: "var(--text-secondary)" }}>Junk: {afterMetrics.crm.junkPercentage}%</span>
                <span className="ml-1 text-[9px]" style={{ color: deltaColor(beforeMetrics.crm?.junkPercentage, afterMetrics.crm?.junkPercentage, true) }}>{delta(beforeMetrics.crm?.junkPercentage, afterMetrics.crm?.junkPercentage)}</span>
              </span>
            )}
            {afterMetrics.crm?.qualityLeads != null && (
              <span>
                <span style={{ color: "var(--text-secondary)" }}>Quality: {afterMetrics.crm.qualityLeads}</span>
                <span className="ml-1 text-[9px]" style={{ color: deltaColor(beforeMetrics.crm?.qualityLeads, afterMetrics.crm?.qualityLeads) }}>{delta(beforeMetrics.crm?.qualityLeads, afterMetrics.crm?.qualityLeads)}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
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
