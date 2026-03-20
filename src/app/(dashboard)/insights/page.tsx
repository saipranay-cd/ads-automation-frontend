"use client"

import { useState, useMemo } from "react"
import {
  IndianRupee, Users, Eye, TrendingUp, Target, BarChart3,
  Zap, Play, AlertTriangle, CheckCircle, Clock, XCircle,
  ArrowRight, RefreshCw,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useProposals, useProposalStats, useScanProposals, useUpdateProposal } from "@/hooks/use-campaigns"
import type { AiProposal, ExecutionResult, ProposalAction, ActionResult } from "@/hooks/use-campaigns"

// ── Types ──────────────────────────────────────────────────

type AgentId = "budget-sentinel" | "audience-architect" | "creative-fatigue" | "bid-optimizer" | "lead-quality" | "performance-prophet"
type FilterTab = "all" | "pending" | "approved" | "executed" | "rejected" | "failed"

interface AgentConfig {
  id: AgentId
  name: string
  icon: typeof IndianRupee
  color: string
  bgColor: string
  barGradient: [string, string]
  description: string
}

// ── Agent definitions ──────────────────────────────────────

const agents: AgentConfig[] = [
  {
    id: "budget-sentinel",
    name: "Budget Sentinel",
    icon: IndianRupee,
    color: "#fbbf24",
    bgColor: "rgba(251, 191, 36, 0.12)",
    barGradient: ["#4ade80", "#fbbf24"],
    description: "Monitors spend efficiency and reallocates budget across campaigns for optimal ROI.",
  },
  {
    id: "audience-architect",
    name: "Audience Architect",
    icon: Users,
    color: "#5eead4",
    bgColor: "rgba(94, 234, 212, 0.12)",
    barGradient: ["#4ade80", "#5eead4"],
    description: "Analyzes audience segments and recommends lookalike/targeting optimizations.",
  },
  {
    id: "creative-fatigue",
    name: "Creative Fatigue Detector",
    icon: Eye,
    color: "#a3e635",
    bgColor: "rgba(163, 230, 53, 0.12)",
    barGradient: ["#4ade80", "#fbbf24"],
    description: "Tracks ad fatigue scores and recommends creative refreshes before performance decays.",
  },
  {
    id: "bid-optimizer",
    name: "Bid Optimizer",
    icon: TrendingUp,
    color: "#c084fc",
    bgColor: "rgba(192, 132, 252, 0.12)",
    barGradient: ["#4ade80", "#c084fc"],
    description: "Optimizes bid strategies and cap settings to minimize cost volatility.",
  },
  {
    id: "lead-quality",
    name: "Lead Quality Scorer",
    icon: Target,
    color: "#fb7185",
    bgColor: "rgba(251, 113, 133, 0.12)",
    barGradient: ["#4ade80", "#fbbf24"],
    description: "Evaluates lead quality across demographics and prunes low-converting segments.",
  },
  {
    id: "performance-prophet",
    name: "Performance Prophet",
    icon: BarChart3,
    color: "#60a5fa",
    bgColor: "rgba(96, 165, 250, 0.12)",
    barGradient: ["#4ade80", "#fbbf24"],
    description: "Predicts future performance trends and recommends preemptive adjustments.",
  },
]

const agentMap: Record<string, AgentConfig> = Object.fromEntries(agents.map((a) => [a.id, a]))

// ── Status/risk styling ────────────────────────────────────

const statusConfig: Record<string, { color: string; bg: string; icon: typeof Clock; label: string }> = {
  pending:  { color: "#fbbf24", bg: "rgba(251, 191, 36, 0.12)", icon: Clock,         label: "Pending"  },
  approved: { color: "#4ade80", bg: "rgba(74, 222, 128, 0.12)", icon: CheckCircle,   label: "Approved" },
  executed: { color: "#c084fc", bg: "rgba(192, 132, 252, 0.12)", icon: Zap,           label: "Executed" },
  rejected: { color: "#f87171", bg: "rgba(248, 113, 113, 0.12)", icon: XCircle,       label: "Rejected" },
  failed:   { color: "#f87171", bg: "rgba(248, 113, 113, 0.12)", icon: AlertTriangle, label: "Failed"   },
}

const riskConfig: Record<string, { color: string; bg: string; border: string }> = {
  low:    { color: "#4ade80", bg: "rgba(74, 222, 128, 0.12)", border: "rgba(74, 222, 128, 0.3)" },
  medium: { color: "#fbbf24", bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.3)" },
  high:   { color: "#f87171", bg: "rgba(248, 113, 113, 0.12)", border: "rgba(248, 113, 113, 0.3)" },
}

// ── Pipeline steps ─────────────────────────────────────────

const pipelineSteps = [
  { label: "Data Collection", color: "#5eead4" },
  { label: "Analysis", color: "#5eead4" },
  { label: "Recommendation", color: "#4ade80" },
  { label: "Approval", color: "#fbbf24" },
  { label: "Execution", color: "#c084fc" },
  { label: "Learning", color: "#60a5fa" },
]

// ── Time helpers ───────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ── Page ───────────────────────────────────────────────────

// ── Action label helpers ───────────────────────────────────

function actionLabel(action: ProposalAction): string {
  switch (action.type) {
    case "update_budget":
      return `Set ${action.entityName} budget to ₹${action.params.daily_budget}/day`
    case "pause_entity":
      return `Pause ${action.entityName}`
    case "activate_entity":
      return `Activate ${action.entityName}`
    case "update_bid_strategy":
      return `Change ${action.entityName} bid to ${(action.params.bid_strategy as string || "").replace(/_/g, " ").toLowerCase()}`
    default:
      return action.type
  }
}

export default function InsightsPage() {
  const adAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { data: proposalsData, isLoading: proposalsLoading } = useProposals(adAccountId)
  const { data: stats, isLoading: statsLoading } = useProposalStats(adAccountId)
  const scanMutation = useScanProposals()
  const updateMutation = useUpdateProposal()

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all")
  const [executingId, setExecutingId] = useState<string | null>(null)
  const [lastExecution, setLastExecution] = useState<{ id: string; result: ExecutionResult } | null>(null)

  const proposals: AiProposal[] = proposalsData?.data || []

  // Agent stats computed from proposals
  const agentStats = useMemo(() => {
    const map: Record<string, { proposals: number; pending: number; confidence: number; lastRun: string }> = {}
    for (const a of agents) {
      const agentProposals = proposals.filter((p) => p.agentId === a.id)
      map[a.id] = {
        proposals: agentProposals.length,
        pending: agentProposals.filter((p) => p.status === "pending").length,
        confidence: agentProposals.length > 0
          ? Math.round(agentProposals.reduce((s, p) => s + p.confidence, 0) / agentProposals.length)
          : 0,
        lastRun: agentProposals.length > 0 ? timeAgo(agentProposals[0].createdAt) : "—",
      }
    }
    return map
  }, [proposals])

  // Filtered proposals
  const filtered = useMemo(() => {
    if (activeFilter === "all") return proposals
    return proposals.filter((p) => p.status === activeFilter)
  }, [proposals, activeFilter])

  const pendingCount = proposals.filter((p) => p.status === "pending").length

  // Actions
  const handleScan = (scanType: "quick" | "daily") => {
    if (!adAccountId) return
    scanMutation.mutate({ adAccountId, scanType })
  }

  const handleApprove = (id: string) => {
    setExecutingId(id)
    setLastExecution(null)
    updateMutation.mutate(
      { id, action: "approve" },
      {
        onSuccess: (data) => {
          if (data.execution) {
            setLastExecution({ id, result: data.execution })
          }
          setExecutingId(null)
        },
        onError: () => setExecutingId(null),
      }
    )
  }
  const handleRetry = (id: string) => {
    setExecutingId(id)
    setLastExecution(null)
    updateMutation.mutate(
      { id, action: "execute" },
      {
        onSuccess: (data) => {
          if (data.execution) {
            setLastExecution({ id, result: data.execution })
          }
          setExecutingId(null)
        },
        onError: () => setExecutingId(null),
      }
    )
  }
  const handleReject = (id: string) => updateMutation.mutate({ id, action: "reject" })

  const isLoading = proposalsLoading || statsLoading

  const cardStyle = {
    background: "var(--bg-base)",
    border: "1px solid var(--border-default)",
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg" style={{ background: "var(--bg-muted)" }} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              AI Optimization Engine
            </h1>
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#4ade80" }}>
              <span className="h-2 w-2 rounded-full" style={{ background: "#4ade80" }} />
              Active
            </span>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
            AI agents continuously analyze your campaigns and propose optimizations
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {stats?.lastScan && (
            <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              Last sync: {timeAgo(stats.lastScan)}
            </span>
          )}
          <button
            onClick={() => handleScan("quick")}
            disabled={scanMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-all"
            style={{
              background: "var(--bg-base)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
              opacity: scanMutation.isPending ? 0.6 : 1,
            }}
          >
            {scanMutation.isPending ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Zap size={14} />
            )}
            {scanMutation.isPending ? "Scanning…" : "Quick Scan"}
          </button>
          <button
            onClick={() => handleScan("daily")}
            disabled={scanMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white transition-all"
            style={{
              background: "var(--acc)",
              boxShadow: "var(--shadow-glow)",
              opacity: scanMutation.isPending ? 0.6 : 1,
            }}
          >
            <Play size={13} fill="white" />
            Run Daily Review
          </button>
        </div>
      </div>

      {/* ── Summary cards ─────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-4 rounded-lg px-5 py-4" style={cardStyle}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "rgba(251, 191, 36, 0.12)" }}>
            <AlertTriangle size={18} style={{ color: "#fbbf24" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Pending Approval</p>
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{stats?.pending ?? 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg px-5 py-4" style={cardStyle}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "rgba(74, 222, 128, 0.12)" }}>
            <CheckCircle size={18} style={{ color: "#4ade80" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Optimizations Applied</p>
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{stats?.applied ?? 0}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg px-5 py-4" style={cardStyle}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "rgba(94, 234, 212, 0.12)" }}>
            <IndianRupee size={18} style={{ color: "#5eead4" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Estimated Savings</p>
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {stats?.estimatedSavings
                ? `₹${Math.round(stats.estimatedSavings).toLocaleString("en-IN")}`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* ── AI Agents ─────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          AI Agents
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {agents.map((agent) => {
            const s = agentStats[agent.id] || { proposals: 0, pending: 0, confidence: 0, lastRun: "—" }
            const Icon = agent.icon
            return (
              <div key={agent.id} className="rounded-lg p-4" style={cardStyle}>
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: agent.bgColor }}
                  >
                    <Icon size={18} style={{ color: agent.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {agent.name}
                      </span>
                      {s.pending > 0 && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ background: "rgba(74, 222, 128, 0.12)", color: "#4ade80" }}
                        >
                          {s.pending} pending
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {agent.description}
                    </p>
                    <p className="mt-2 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                      {s.proposals} proposals · Last: {s.lastRun}
                    </p>
                    {/* Confidence bar */}
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                        Confidence
                      </span>
                      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${s.confidence}%`,
                            background: `linear-gradient(90deg, ${agent.barGradient[0]}, ${agent.barGradient[1]})`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-medium" style={{ color: agent.color }}>
                        {s.confidence > 0 ? `${s.confidence}%` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Optimization Proposals ────────────────────── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Optimization Proposals
          </h2>
          <div className="flex items-center gap-1.5">
            {(["all", "pending", "approved", "executed", "rejected", "failed"] as FilterTab[]).map((tab) => {
              const isActive = activeFilter === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium capitalize transition-all"
                  style={{
                    background: isActive ? "var(--acc)" : "transparent",
                    color: isActive ? "white" : "var(--text-tertiary)",
                    border: isActive ? "none" : "1px solid var(--border-default)",
                  }}
                >
                  {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === "pending" && pendingCount > 0 && (
                    <span
                      className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
                      style={{
                        background: isActive ? "rgba(255,255,255,0.25)" : "var(--acc)",
                        color: "white",
                      }}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filtered.map((proposal) => {
              const agent = agentMap[proposal.agentId] || agents[0]
              const stCfg = statusConfig[proposal.status] || statusConfig.pending
              const rCfg = riskConfig[proposal.risk] || riskConfig.low
              const StatusIcon = stCfg.icon
              const AgentIcon = agent.icon
              return (
                <div key={proposal.id} className="rounded-lg px-5 py-4" style={cardStyle}>
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: content */}
                    <div className="flex min-w-0 flex-1 gap-3.5">
                      <div
                        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: agent.bgColor }}
                      >
                        <AgentIcon size={18} style={{ color: agent.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        {/* Agent name + status + risk + campaign */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: agent.color }}>
                            {agent.name}
                          </span>
                          <span
                            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ background: stCfg.bg, color: stCfg.color }}
                          >
                            <StatusIcon size={10} />
                            {stCfg.label}
                          </span>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ background: rCfg.bg, color: rCfg.color, border: `1px solid ${rCfg.border}` }}
                          >
                            {proposal.risk === "low" ? "Low Risk" : proposal.risk === "medium" ? "Medium Risk" : "High Risk"}
                          </span>
                          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                            · {proposal.campaignName}
                          </span>
                        </div>
                        {/* Title */}
                        <p className="mt-1.5 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {proposal.title}
                        </p>
                        {/* Description */}
                        <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                          {proposal.description}
                        </p>
                        {/* Impact + confidence + time */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px]">
                          <span style={{ color: "#5eead4" }}>
                            Impact: {proposal.impact}
                          </span>
                          <span style={{ color: "var(--text-tertiary)" }}>
                            Confidence: {proposal.confidence}%
                          </span>
                          <span style={{ color: "var(--text-tertiary)" }}>
                            {timeAgo(proposal.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex shrink-0 flex-col items-end gap-2 pt-1">
                      {/* Pending: approve & execute / reject */}
                      {proposal.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(proposal.id)}
                            disabled={executingId === proposal.id}
                            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all"
                            style={{
                              border: "1px solid rgba(74, 222, 128, 0.3)",
                              color: "#4ade80",
                              opacity: executingId === proposal.id ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => { if (executingId !== proposal.id) e.currentTarget.style.background = "rgba(74, 222, 128, 0.08)" }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                          >
                            {executingId === proposal.id ? (
                              <RefreshCw size={13} className="animate-spin" />
                            ) : (
                              <Zap size={13} />
                            )}
                            {executingId === proposal.id ? "Executing…" : "Approve & Execute"}
                          </button>
                          <button
                            onClick={() => handleReject(proposal.id)}
                            disabled={executingId === proposal.id}
                            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all"
                            style={{
                              border: "1px solid rgba(248, 113, 113, 0.3)",
                              color: "#f87171",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248, 113, 113, 0.08)" }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                          >
                            <XCircle size={13} />
                            Reject
                          </button>
                        </div>
                      )}

                      {/* Failed: retry button */}
                      {proposal.status === "failed" && (
                        <button
                          onClick={() => handleRetry(proposal.id)}
                          disabled={executingId === proposal.id}
                          className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all"
                          style={{
                            border: "1px solid rgba(251, 191, 36, 0.3)",
                            color: "#fbbf24",
                            opacity: executingId === proposal.id ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => { if (executingId !== proposal.id) e.currentTarget.style.background = "rgba(251, 191, 36, 0.08)" }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                        >
                          {executingId === proposal.id ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : (
                            <RefreshCw size={13} />
                          )}
                          {executingId === proposal.id ? "Retrying…" : "Retry"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action preview (pending proposals with actions) */}
                  {proposal.status === "pending" && proposal.metadata?.actions && proposal.metadata.actions.length > 0 && (
                    <div
                      className="mt-3 rounded-md px-3 py-2"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-default)" }}
                    >
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                        Actions on approve
                      </p>
                      <div className="flex flex-col gap-1">
                        {proposal.metadata.actions.map((action, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                            <ArrowRight size={10} style={{ color: "#5eead4" }} />
                            {actionLabel(action)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Execution feedback (just executed) */}
                  {lastExecution?.id === proposal.id && (
                    <div
                      className="mt-3 rounded-md px-3 py-2"
                      style={{
                        background: lastExecution.result.status === "success"
                          ? "rgba(74, 222, 128, 0.06)"
                          : lastExecution.result.status === "partial_failure"
                            ? "rgba(251, 191, 36, 0.06)"
                            : "rgba(248, 113, 113, 0.06)",
                        border: `1px solid ${
                          lastExecution.result.status === "success" ? "rgba(74, 222, 128, 0.2)"
                          : lastExecution.result.status === "partial_failure" ? "rgba(251, 191, 36, 0.2)"
                          : "rgba(248, 113, 113, 0.2)"
                        }`,
                      }}
                    >
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{
                        color: lastExecution.result.status === "success" ? "#4ade80"
                          : lastExecution.result.status === "partial_failure" ? "#fbbf24"
                          : "#f87171",
                      }}>
                        {lastExecution.result.status === "success" ? "All actions executed"
                          : lastExecution.result.status === "partial_failure" ? "Partial execution"
                          : "Execution failed"}
                      </p>
                      <div className="flex flex-col gap-1">
                        {lastExecution.result.actionResults.map((r, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px]">
                            {r.status === "success" ? (
                              <CheckCircle size={10} style={{ color: "#4ade80" }} />
                            ) : (
                              <XCircle size={10} style={{ color: "#f87171" }} />
                            )}
                            <span style={{ color: "var(--text-secondary)" }}>{actionLabel(r.action)}</span>
                            {r.error && (
                              <span className="text-[10px]" style={{ color: "#f87171" }}>— {r.error}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Execution history (executed/failed proposals from metadata) */}
                  {lastExecution?.id !== proposal.id && (proposal.status === "executed" || proposal.status === "failed") && proposal.metadata?.executionResult && (
                    <div
                      className="mt-3 rounded-md px-3 py-2"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-default)" }}
                    >
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                        Execution results
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {proposal.metadata.executionResult.actionResults.map((r, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              background: r.status === "success" ? "rgba(74, 222, 128, 0.12)" : "rgba(248, 113, 113, 0.12)",
                              color: r.status === "success" ? "#4ade80" : "#f87171",
                            }}
                          >
                            {r.status === "success" ? <CheckCircle size={9} /> : <XCircle size={9} />}
                            {actionLabel(r.action)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-lg py-12"
            style={cardStyle}
          >
            <Zap size={20} style={{ color: "var(--text-tertiary)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {proposals.length === 0
                ? "No proposals yet"
                : "No proposals match this filter"}
            </span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {proposals.length === 0
                ? "Click \"Quick Scan\" or \"Run Daily Review\" to analyze your campaigns"
                : "Try a different filter to see proposals"}
            </span>
          </div>
        )}
      </div>

      {/* ── Optimization Pipeline ─────────────────────── */}
      <div>
        <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Optimization Pipeline
        </h2>
        <div className="flex items-center gap-0 rounded-lg px-6 py-5" style={cardStyle}>
          {pipelineSteps.map((step, i) => (
            <div key={step.label} className="flex flex-1 items-center">
              <div
                className="flex-1 rounded-lg py-2.5 text-center text-xs font-medium"
                style={{
                  background: `${step.color}15`,
                  border: `1px solid ${step.color}40`,
                  color: step.color,
                }}
              >
                {step.label}
              </div>
              {i < pipelineSteps.length - 1 && (
                <ArrowRight
                  size={14}
                  className="mx-1.5 shrink-0"
                  style={{ color: "var(--text-tertiary)" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
