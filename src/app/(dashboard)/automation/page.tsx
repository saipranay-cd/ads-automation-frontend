"use client"

import { useState } from "react"
import { Plus, Zap, Trash2, ToggleLeft, ToggleRight, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAppStore } from "@/lib/store"
import { EmptyState } from "@/components/ui/empty-state"
import { TableSkeleton } from "@/components/ui/table-skeleton"

// ── Types ──────────────────────────────────────────────

interface AlertRule {
  id: string
  name: string
  isActive: boolean
  metric: string
  operator: string
  threshold: number
  entityType: string
  entityId: string | null
  actionType: string
  actionParams: Record<string, unknown> | null
  cooldownMinutes: number
  lastFiredAt: string | null
  lastResult: string | null
  createdAt: string
}

interface RuleExecution {
  id: string
  status: string
  actionTaken: string
  entityId: string | null
  details: string | null
  error: string | null
  createdAt: string
}

// ── Hooks ──────────────────────────────────────────────

function useAlertRules(adAccountId: string | null) {
  return useQuery<{ data: AlertRule[] }>({
    queryKey: ["alert-rules", adAccountId],
    queryFn: async () => {
      const res = await fetch(`/api/meta/alert-rules?adAccountId=${adAccountId}`)
      return res.json()
    },
    enabled: !!adAccountId,
  })
}

function useRuleExecutions(ruleId: string | null) {
  return useQuery<{ data: RuleExecution[] }>({
    queryKey: ["rule-executions", ruleId],
    queryFn: async () => {
      const res = await fetch(`/api/meta/alert-rules/${ruleId}/executions`)
      return res.json()
    },
    enabled: !!ruleId,
  })
}

// ── Constants ──────────────────────────────────────────

const METRICS = [
  { value: "cpl", label: "Cost per Lead (CPL)" },
  { value: "ctr", label: "Click-Through Rate (CTR)" },
  { value: "spend", label: "Daily Spend" },
  { value: "leads", label: "Leads" },
]

const OPERATORS = [
  { value: "gt", label: "is greater than" },
  { value: "lt", label: "is less than" },
  { value: "gte", label: "is at least" },
  { value: "lte", label: "is at most" },
]

const ACTIONS = [
  { value: "notify", label: "Send notification only" },
  { value: "pause", label: "Pause the campaign" },
  { value: "reduce_budget", label: "Reduce budget by %" },
  { value: "increase_budget", label: "Increase budget by %" },
]

// ── Main ───────────────────────────────────────────────

export default function AutomationPage() {
  const adAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { data, isLoading } = useAlertRules(adAccountId)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const rules = data?.data || []

  const toggleRule = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await fetch(`/api/meta/alert-rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alert-rules"] }),
  })

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/meta/alert-rules/${id}`, { method: "DELETE" })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alert-rules"] }),
  })

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Automation Rules
          </h2>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Rules run automatically after every data sync (every 4 hours)
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-white"
          style={{ background: "var(--accent-primary)" }}
        >
          <Plus size={14} />
          New Rule
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <CreateRuleForm
          adAccountId={adAccountId!}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Rules list */}
      {isLoading ? (
        <TableSkeleton rows={3} columns={4} />
      ) : rules.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No automation rules yet"
          description="Set up alerts for spend spikes, CTR drops, and more"
          actionLabel="Create Rule"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-lg p-4"
              style={{
                background: "var(--bg-base)",
                border: "1px solid var(--border-default)",
                opacity: rule.isActive ? 1 : 0.6,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {rule.name}
                    </span>
                    <ActionBadge type={rule.actionType} />
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                    When {METRICS.find((m) => m.value === rule.metric)?.label || rule.metric}{" "}
                    {OPERATORS.find((o) => o.value === rule.operator)?.label || rule.operator}{" "}
                    <span className="font-mono">{rule.threshold}</span>
                    {rule.actionType !== "notify" && (
                      <> → {ACTIONS.find((a) => a.value === rule.actionType)?.label}</>
                    )}
                  </p>
                  {rule.lastFiredAt && (
                    <p className="mt-1 flex items-center gap-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                      <Clock size={10} />
                      Last fired: {new Date(rule.lastFiredAt).toLocaleString()}
                      {rule.lastResult === "success" && <CheckCircle size={10} style={{ color: "#4ade80" }} />}
                      {rule.lastResult === "failed" && <XCircle size={10} style={{ color: "#f87171" }} />}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedRuleId(selectedRuleId === rule.id ? null : rule.id)}
                    className="text-[11px] font-medium"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    History
                  </button>
                  <button
                    onClick={() => toggleRule.mutate({ id: rule.id, isActive: !rule.isActive })}
                    style={{ color: rule.isActive ? "var(--accent-primary)" : "var(--text-disabled)" }}
                  >
                    {rule.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <button
                    onClick={() => deleteRule.mutate(rule.id)}
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Execution history */}
              {selectedRuleId === rule.id && <ExecutionHistory ruleId={rule.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Create Rule Form ───────────────────────────────────

function CreateRuleForm({ adAccountId, onClose }: { adAccountId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [metric, setMetric] = useState("cpl")
  const [operator, setOperator] = useState("gt")
  const [threshold, setThreshold] = useState("")
  const [actionType, setActionType] = useState("notify")
  const [budgetPct, setBudgetPct] = useState("20")

  const create = useMutation({
    mutationFn: async () => {
      const body: any = { adAccountId, name, metric, operator, threshold: parseFloat(threshold), actionType }
      if (actionType === "reduce_budget" || actionType === "increase_budget") {
        body.actionParams = { budget_change_pct: actionType === "reduce_budget" ? -parseInt(budgetPct) : parseInt(budgetPct) }
      }
      const res = await fetch("/api/meta/alert-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to create rule")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-rules"] })
      onClose()
    },
  })

  const selectStyle = {
    background: "var(--bg-subtle)",
    border: "1px solid var(--border-default)",
    color: "var(--text-primary)",
  }

  return (
    <div
      className="rounded-lg p-5"
      style={{ background: "var(--bg-base)", border: "1px solid var(--accent-primary)" }}
    >
      <h3 className="mb-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        New Automation Rule
      </h3>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Rule name (e.g. Pause high CPL campaigns)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm"
          style={selectStyle}
        />

        <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <span>When</span>
          <select value={metric} onChange={(e) => setMetric(e.target.value)} className="rounded-lg px-2 py-1.5 text-sm" style={selectStyle}>
            {METRICS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={operator} onChange={(e) => setOperator(e.target.value)} className="rounded-lg px-2 py-1.5 text-sm" style={selectStyle}>
            {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="Value"
            className="w-24 rounded-lg px-2 py-1.5 text-sm font-mono"
            style={selectStyle}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <span>Then</span>
          <select value={actionType} onChange={(e) => setActionType(e.target.value)} className="rounded-lg px-2 py-1.5 text-sm" style={selectStyle}>
            {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          {(actionType === "reduce_budget" || actionType === "increase_budget") && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={budgetPct}
                onChange={(e) => setBudgetPct(e.target.value)}
                className="w-16 rounded-lg px-2 py-1.5 text-sm font-mono"
                style={selectStyle}
              />
              <span>%</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => create.mutate()}
            disabled={!name || !threshold || create.isPending}
            className="rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
            style={{ background: "var(--accent-primary)" }}
          >
            {create.isPending ? "Creating..." : "Create Rule"}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium"
            style={{ color: "var(--text-tertiary)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Execution History ──────────────────────────────────

function ExecutionHistory({ ruleId }: { ruleId: string }) {
  const { data, isLoading } = useRuleExecutions(ruleId)
  const executions = data?.data || []

  if (isLoading) return <div className="mt-3 text-xs" style={{ color: "var(--text-tertiary)" }}>Loading...</div>
  if (executions.length === 0) return <div className="mt-3 text-xs" style={{ color: "var(--text-tertiary)" }}>No executions yet</div>

  return (
    <div className="mt-3 flex flex-col gap-1.5" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
      {executions.slice(0, 5).map((ex) => (
        <div key={ex.id} className="flex items-start gap-2 text-[11px]">
          {ex.status === "success" ? (
            <CheckCircle size={12} style={{ color: "#4ade80", marginTop: 1 }} />
          ) : (
            <XCircle size={12} style={{ color: "#f87171", marginTop: 1 }} />
          )}
          <div>
            <span style={{ color: "var(--text-secondary)" }}>{ex.details || ex.error || ex.actionTaken}</span>
            <span className="ml-2" style={{ color: "var(--text-disabled)" }}>
              {new Date(ex.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────

function ActionBadge({ type }: { type: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    notify: { bg: "rgba(96,165,250,0.1)", color: "#60a5fa", label: "Notify" },
    pause: { bg: "rgba(248,113,113,0.1)", color: "#f87171", label: "Auto-Pause" },
    reduce_budget: { bg: "rgba(251,191,36,0.1)", color: "#fbbf24", label: "Reduce Budget" },
    increase_budget: { bg: "rgba(74,222,128,0.1)", color: "#4ade80", label: "Increase Budget" },
  }
  const c = config[type] || config.notify
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  )
}
