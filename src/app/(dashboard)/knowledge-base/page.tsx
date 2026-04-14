"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  BookOpen, Save, Plus, Trash2, Target, TrendingUp, TrendingDown,
  Loader2, X, Check, Megaphone, Search, AlertCircle, ExternalLink,
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useCanEdit } from "@/hooks/use-role"
import { showSuccess } from "@/components/layout/ErrorToast"
import { useCampaigns } from "@/hooks/use-campaigns"
import { StatusBadge } from "@/components/campaigns/StatusBadge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  useCampaignKnowledgeBases, useCampaignKB, useUpsertCampaignKB,
  useAddObjective, useDeleteObjective, useCampaignMetrics,
} from "@/hooks/use-knowledge-base"
import type { KBObjective, KBObjectiveSnapshot, KPIType, ProductKnowledgeBase } from "@/types/adsflow"

// ── Constants ───────────────────────────────────────────

const KPI_OPTIONS: { value: KPIType | "custom"; label: string; unit: string; direction: string }[] = [
  { value: "cpql", label: "CPQL", unit: "currency", direction: "below" },
  { value: "cpl", label: "CPL", unit: "currency", direction: "below" },
  { value: "roas", label: "ROAS", unit: "ratio", direction: "above" },
  { value: "ctr", label: "CTR", unit: "percentage", direction: "above" },
  { value: "cpc", label: "CPC", unit: "currency", direction: "below" },
  { value: "leads", label: "Leads", unit: "count", direction: "above" },
  { value: "conversions", label: "Conversions", unit: "count", direction: "above" },
  { value: "spend", label: "Spend", unit: "currency", direction: "below" },
  { value: "custom", label: "Custom", unit: "count", direction: "below" },
]

function metaStatusBadge(s: string) {
  if (s === "ACTIVE") return { status: "active" as const, label: "Active" }
  if (s === "PAUSED") return { status: "paused" as const, label: "Paused" }
  return { status: "info" as const, label: s }
}

function fmtTarget(val: number, unit?: string | null) {
  if (unit === "currency") return `₹${val.toLocaleString("en-IN")}`
  if (unit === "percentage") return `${val}%`
  return val.toLocaleString("en-IN")
}

// ── Sparkline ───────────────────────────────────────────

function Sparkline({ snapshots, targetValue, direction }: { snapshots: KBObjectiveSnapshot[]; targetValue?: number | null; direction: string }) {
  if (!snapshots || snapshots.length < 2) return null
  const sorted = [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const values = sorted.map((s) => s.actual)
  const min = Math.min(...values, targetValue ?? Infinity), max = Math.max(...values, targetValue ?? -Infinity)
  const range = max - min || 1, w = 72, h = 22
  const points = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * (h - 2) - 1}`).join(" ")
  const targetY = targetValue != null ? h - ((targetValue - min) / range) * (h - 2) - 1 : null
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden="true">
      {targetY != null && <line x1={0} y1={targetY} x2={w} y2={targetY} stroke="var(--text-tertiary)" strokeWidth={0.5} strokeDasharray="2,2" opacity={0.35} />}
      <polyline fill="none" stroke="var(--acc-text)" strokeWidth={1.5} points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Objective row ───────────────────────────────────────

function ObjectiveRow({ objective, adAccountId, campaignId, canEdit, liveMetrics }: {
  objective: KBObjective; adAccountId: string; campaignId: string; canEdit: boolean; liveMetrics?: Record<string, number | null>
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteObj = useDeleteObjective()

  const sorted = [...(objective.snapshots || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const latestSnap = sorted[0]
  // Use snapshot value if available, otherwise fall back to live metric
  const currentValue = latestSnap?.actual ?? liveMetrics?.[objective.kpiType] ?? null
  const isOnTrack = currentValue != null && objective.targetValue != null
    ? objective.direction === "below" ? currentValue <= objective.targetValue : currentValue >= objective.targetValue : null

  return (
    <div className="rounded-lg px-3 py-2.5" style={{ background: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex items-center gap-3">
        <div className="w-1 self-stretch rounded-full shrink-0" style={{
          background: isOnTrack === true ? "var(--green-text)" : isOnTrack === false ? "var(--red-text)" : "var(--border-default)",
          opacity: isOnTrack === null ? 0.4 : 0.8,
        }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{objective.label}</span>
            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
              style={{ background: "var(--acc-subtle)", color: "var(--acc-text)" }}>{objective.kpiType}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {objective.targetValue != null && (
              <span className="font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
                {objective.direction === "below" ? "≤" : "≥"} {fmtTarget(objective.targetValue, objective.targetUnit)}
              </span>
            )}
            {currentValue != null && objective.targetValue != null && (
              <>
                <span style={{ color: "var(--text-disabled)" }}>·</span>
                <span className="font-mono text-[11px]" style={{ color: isOnTrack ? "var(--green-text)" : isOnTrack === false ? "var(--red-text)" : "var(--text-tertiary)" }}>
                  {fmtTarget(currentValue, objective.targetUnit)}
                </span>
                {!latestSnap && <span className="text-[9px] uppercase" style={{ color: "var(--text-disabled)" }}>live</span>}
                {latestSnap?.notes === "auto" && <span className="text-[9px] uppercase" style={{ color: "var(--text-disabled)" }}>auto</span>}
              </>
            )}
          </div>
          {objective.freeTextGoal && <p className="mt-0.5 text-[11px] truncate" title={objective.freeTextGoal} style={{ color: "var(--text-tertiary)" }}>{objective.freeTextGoal}</p>}
        </div>
        <Sparkline snapshots={objective.snapshots} targetValue={objective.targetValue} direction={objective.direction} />
        {canEdit && (
          confirmDelete ? (
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={() => { deleteObj.mutate({ id: objective.id, adAccountId, campaignId }); setConfirmDelete(false) }}
                className="rounded p-1" style={{ color: "var(--red-text)" }}>
                {deleteObj.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="rounded p-1" style={{ color: "var(--text-tertiary)" }}><X size={12} /></button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="rounded p-1 shrink-0 hover:opacity-80" style={{ color: "var(--text-disabled)" }}><Trash2 size={12} /></button>
          )
        )}
      </div>
    </div>
  )
}

// ── Add objective ───────────────────────────────────────

function AddObjectiveForm({ kbId, adAccountId, campaignId, liveMetrics, onDone }: {
  kbId: string; adAccountId: string; campaignId: string; liveMetrics?: Record<string, number | null>; onDone: () => void
}) {
  const [kpiType, setKpiType] = useState<string>("cpql")
  const [label, setLabel] = useState("")
  const [targetValue, setTargetValue] = useState("")
  const [freeTextGoal, setFreeTextGoal] = useState("")
  const addObj = useAddObjective()
  const selectedKpi = KPI_OPTIONS.find((k) => k.value === kpiType)
  const currentValue = liveMetrics?.[kpiType] ?? null

  useEffect(() => { if (kpiType !== "custom" && selectedKpi) setLabel(selectedKpi.label) }, [kpiType, selectedKpi])

  const handleSubmit = () => {
    if (!label.trim()) return
    addObj.mutate({ kbId, adAccountId, campaignId, kpiType, label: label.trim(),
      targetValue: targetValue ? parseFloat(targetValue) : undefined,
      targetUnit: selectedKpi?.unit || "count", direction: selectedKpi?.direction || "below",
      freeTextGoal: freeTextGoal || undefined,
    }, { onSuccess: () => { showSuccess("Objective added"); onDone() } })
  }

  return (
    <div className="rounded-lg p-3 space-y-3" style={{ background: "var(--bg-base)", border: "1px solid var(--acc-border, var(--border-default))" }}>
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: "var(--text-disabled)" }}>KPI</label>
          <select value={kpiType} onChange={(e) => setKpiType(e.target.value)} className="w-full rounded-md px-2.5 py-1.5 text-[13px] outline-none"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
            {KPI_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: "var(--text-disabled)" }}>Target</label>
          <input type="number" step="any" min="0" value={targetValue} onChange={(e) => setTargetValue(e.target.value)}
            placeholder={selectedKpi?.unit === "currency" ? "₹" : "#"} className="w-full rounded-md px-2.5 py-1.5 font-mono text-[13px] outline-none"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
        </div>
      </div>
      {/* Current value indicator */}
      {currentValue != null && kpiType !== "custom" && (
        <div className="flex items-center gap-2 rounded-md px-2.5 py-2" style={{ background: "var(--bg-raised)" }}>
          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Current (7d):</span>
          <span className="font-mono text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
            {fmtTarget(currentValue, selectedKpi?.unit)}
          </span>
          {targetValue && (
            <span className="text-[10px] ml-auto" style={{
              color: selectedKpi?.direction === "below"
                ? currentValue <= parseFloat(targetValue) ? "var(--green-text)" : "var(--red-text)"
                : currentValue >= parseFloat(targetValue) ? "var(--green-text)" : "var(--red-text)"
            }}>
              {selectedKpi?.direction === "below"
                ? currentValue <= parseFloat(targetValue) ? "Already on track" : `${fmtTarget(currentValue - parseFloat(targetValue), selectedKpi?.unit)} over target`
                : currentValue >= parseFloat(targetValue) ? "Already on track" : `${fmtTarget(parseFloat(targetValue) - currentValue, selectedKpi?.unit)} below target`
              }
            </span>
          )}
        </div>
      )}
      {kpiType === "custom" && (
        <input type="text" maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="KPI name"
          className="w-full rounded-md px-2.5 py-1.5 text-[13px] outline-none"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
      )}
      <input type="text" maxLength={120} value={freeTextGoal} onChange={(e) => setFreeTextGoal(e.target.value)}
        placeholder="Goal description (optional)" className="w-full rounded-md px-2.5 py-1.5 text-[13px] outline-none"
        style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
      <div className="flex items-center gap-2">
        <button onClick={handleSubmit} disabled={addObj.isPending || !label.trim()}
          className="rounded-md px-3.5 py-1.5 text-[12px] font-medium disabled:opacity-40"
          style={{ background: "var(--acc-solid)", color: "white" }}>
          {addObj.isPending ? <Loader2 size={12} className="animate-spin inline mr-1" /> : null}Add Objective
        </button>
        <button onClick={onDone} className="rounded-md px-3 py-1.5 text-[12px] font-medium" style={{ color: "var(--text-tertiary)" }}>Cancel</button>
      </div>
    </div>
  )
}

// ── Campaign KB Dialog ──────────────────────────────────

function CampaignKBDialog({ open, onClose, adAccountId, campaignId, campaignName, canEdit }: {
  open: boolean; onClose: () => void; adAccountId: string; campaignId: string; campaignName: string; canEdit: boolean
}) {
  const { data: kb, isLoading, error } = useCampaignKB(adAccountId, campaignId)
  const { data: liveMetrics } = useCampaignMetrics(adAccountId, campaignId)
  const upsert = useUpsertCampaignKB()
  const [notes, setNotes] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkDesc, setLinkDesc] = useState("")
  const [dirty, setDirty] = useState(false)
  const [showAddObjective, setShowAddObjective] = useState(false)

  useEffect(() => {
    if (kb) { setNotes(kb.customNotes || ""); setLinkUrl(kb.links?.[0]?.url || ""); setLinkDesc(kb.links?.[0]?.description || ""); setDirty(false); setShowAddObjective(false) }
  }, [kb])

  const handleSave = () => {
    const links = linkUrl.trim() && linkDesc.trim() ? [{ url: linkUrl.trim(), description: linkDesc.trim() }] : []
    upsert.mutate({ adAccountId, campaignId, campaignName, customNotes: notes, links }, { onSuccess: () => { setDirty(false); showSuccess("Saved") } })
  }

  const objectiveCount = kb?.objectives?.length || 0

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-lg" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
        <DialogHeader>
          <DialogTitle className="truncate pr-8" title={campaignName} style={{ color: "var(--text-primary)" }}>{campaignName}</DialogTitle>
          <DialogDescription style={{ color: "var(--text-tertiary)" }}>
            {objectiveCount > 0 ? `${objectiveCount} objective${objectiveCount !== 1 ? "s" : ""} · Tracking automatically` : "Set context and objectives"}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin" style={{ color: "var(--text-tertiary)" }} /></div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-md px-3 py-2.5" style={{ background: "var(--red-bg)", color: "var(--red-text)" }}>
            <AlertCircle size={14} /><span className="text-[12px]">Failed to load. Try closing and reopening.</span>
          </div>
        ) : (
          <>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {/* Notes + Link grouped tight */}
              <textarea rows={2} maxLength={2000} placeholder="Campaign notes — product, audience, context..."
                value={notes} onChange={(e) => { setNotes(e.target.value); setDirty(true) }} readOnly={!canEdit}
                className="w-full resize-y rounded-md px-3 py-2 text-[13px] outline-none"
                style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />

              <div className="flex gap-2 items-center">
                <input type="url" placeholder="Reference link (optional)" value={linkUrl}
                  onChange={(e) => { setLinkUrl(e.target.value); setDirty(true) }} readOnly={!canEdit}
                  className="flex-1 rounded-md px-3 py-1.5 text-[13px] outline-none min-w-0"
                  style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
                {linkUrl && <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="rounded p-1.5 shrink-0 hover:opacity-70" style={{ color: "var(--text-tertiary)" }}><ExternalLink size={13} /></a>}
              </div>
              {linkUrl && (
                <input type="text" maxLength={100} placeholder="Link description" value={linkDesc}
                  onChange={(e) => { setLinkDesc(e.target.value); setDirty(true) }} readOnly={!canEdit}
                  className="w-full rounded-md px-3 py-1.5 text-[13px] outline-none"
                  style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
              )}

              {/* Objectives */}
              <div className="space-y-2 pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--text-disabled)" }}>Objectives</span>
                  {canEdit && !showAddObjective && (
                    <button onClick={() => {
                      if (!kb?.id) upsert.mutate({ adAccountId, campaignId, campaignName }, { onSuccess: () => setShowAddObjective(true) })
                      else setShowAddObjective(true)
                    }} className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium"
                      style={{ color: "var(--acc-text)", background: "var(--acc-subtle)" }}><Plus size={11} /> Add</button>
                  )}
                </div>
                {(kb?.objectives || []).map((obj) => <ObjectiveRow key={obj.id} objective={obj} adAccountId={adAccountId} campaignId={campaignId} canEdit={canEdit} liveMetrics={liveMetrics || undefined} />)}
                {objectiveCount === 0 && !showAddObjective && (
                  <p className="py-6 text-center text-[12px]" style={{ color: "var(--text-disabled)" }}>
                    No objectives yet — add one to start tracking
                  </p>
                )}
                {showAddObjective && kb?.id && <AddObjectiveForm kbId={kb.id} adAccountId={adAccountId} campaignId={campaignId} liveMetrics={liveMetrics || undefined} onDone={() => setShowAddObjective(false)} />}
              </div>
            </div>

            {/* Save — pinned to bottom of dialog, outside scroll area */}
            {canEdit && dirty && (
              <div className="-mx-4 -mb-4 rounded-b-xl px-4 py-3" style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-raised)" }}>
                <button onClick={handleSave} disabled={upsert.isPending}
                  className="flex items-center justify-center gap-1.5 w-full rounded-lg py-2.5 text-[13px] font-semibold disabled:opacity-40 transition-opacity"
                  style={{ background: "#6c47ff", color: "white" }}>
                  {upsert.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save Changes
                </button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Campaign picker dialog ──────────────────────────────

function CampaignPickerDialog({ open, onClose, adAccountId, existingIds }: {
  open: boolean; onClose: () => void; adAccountId: string; existingIds: Set<string>
}) {
  const { data: campaignsData } = useCampaigns(adAccountId)
  const upsert = useUpsertCampaignKB()
  const [search, setSearch] = useState("")
  const [creating, setCreating] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) setTimeout(() => searchRef.current?.focus(), 100) }, [open])

  const campaigns = useMemo(() => (campaignsData?.data || []).filter((c) => !existingIds.has(c.id)), [campaignsData, existingIds])
  const filtered = search ? campaigns.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())) : campaigns

  const handleSelect = (id: string, name: string) => {
    setCreating(id)
    upsert.mutate({ adAccountId, campaignId: id, campaignName: name }, {
      onSuccess: () => { setCreating(null); onClose(); showSuccess(`Added ${name}`) },
      onError: () => { setCreating(null) },
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "var(--text-primary)" }}>Add Campaign</DialogTitle>
          <DialogDescription style={{ color: "var(--text-tertiary)" }}>Select a campaign to create a knowledge base for</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-disabled)" }} />
          <input ref={searchRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search campaigns..."
            className="w-full rounded-md pl-8 pr-3 py-2 text-[13px] outline-none"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
        </div>
        <div className="max-h-[50vh] overflow-y-auto -mx-1 px-1 space-y-1">
          {filtered.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                {campaigns.length === 0 ? "All campaigns already have a knowledge base" : "No campaigns match your search"}
              </p>
            </div>
          )}
          {filtered.map((c) => (
            <button key={c.id} onClick={() => handleSelect(c.id, c.name)} disabled={creating === c.id}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-raised)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}>
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-medium truncate block" style={{ color: "var(--text-primary)" }}>{c.name}</span>
              </div>
              {creating === c.id ? (
                <Loader2 size={14} className="animate-spin shrink-0" style={{ color: "var(--acc-text)" }} />
              ) : (
                <StatusBadge {...metaStatusBadge(c.status)} />
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Campaign card ───────────────────────────────────────

function CampaignCard({ kb, campaignStatus, adAccountId, onClick }: {
  kb: ProductKnowledgeBase; campaignStatus?: string; adAccountId: string; onClick: () => void
}) {
  const { data: liveMetrics } = useCampaignMetrics(adAccountId, kb.campaignId)
  const objectives = kb.objectives || []

  // Compute tracking status using snapshot OR live metric fallback
  const objStatuses = objectives.map((o) => {
    const snaps = (o.snapshots || []) as KBObjectiveSnapshot[]
    const latestSnap = snaps.length > 0 ? [...snaps].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null
    const currentValue = latestSnap?.actual ?? liveMetrics?.[o.kpiType] ?? null
    if (currentValue == null || o.targetValue == null) return { ...o, isOnTrack: null as boolean | null, currentValue: null as number | null }
    const isOnTrack = o.direction === "below" ? currentValue <= o.targetValue : currentValue >= o.targetValue
    return { ...o, isOnTrack, currentValue }
  })

  return (
    <button onClick={onClick}
      className="flex flex-col gap-3 rounded-lg p-3.5 text-left transition-all w-full"
      style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--acc-text)" }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-default)" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <span className="text-[13px] font-medium truncate min-w-0" title={kb.campaignName || kb.campaignId} style={{ color: "var(--text-primary)" }}>
          {kb.campaignName || kb.campaignId}
        </span>
        {campaignStatus && <StatusBadge {...metaStatusBadge(campaignStatus)} />}
      </div>

      {/* Notes preview */}
      {kb.customNotes && (
        <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: "var(--text-tertiary)" }}>
          {kb.customNotes}
        </p>
      )}

      {/* Objectives list */}
      {objStatuses.length > 0 ? (
        <div className="space-y-1">
          {objStatuses.slice(0, 3).map((o) => (
            <div key={o.id} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{
                background: o.isOnTrack === true ? "var(--green-text)" : o.isOnTrack === false ? "var(--red-text)" : "var(--text-disabled)",
              }} />
              <span className="text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>{o.label}</span>
              {o.targetValue != null && (
                <span className="font-mono text-[10px] ml-auto shrink-0" style={{ color: o.isOnTrack ? "var(--green-text)" : o.isOnTrack === false ? "var(--red-text)" : "var(--text-disabled)" }}>
                  {o.currentValue != null ? fmtTarget(o.currentValue, o.targetUnit) : "—"} / {fmtTarget(o.targetValue, o.targetUnit)}
                </span>
              )}
            </div>
          ))}
          {objStatuses.length > 3 && (
            <span className="text-[10px]" style={{ color: "var(--text-disabled)" }}>+{objStatuses.length - 3} more</span>
          )}
        </div>
      ) : (
        <span className="text-[11px]" style={{ color: "var(--text-disabled)" }}>No objectives</span>
      )}

      {/* Link */}
      {kb.links?.length > 0 && kb.links[0]?.url && (
        <span className="flex items-center gap-1 text-[10px] truncate" style={{ color: "var(--text-disabled)" }}>
          <ExternalLink size={9} />{kb.links[0].description || kb.links[0].url}
        </span>
      )}
    </button>
  )
}

// ── Main ────────────────────────────────────────────────

export default function KnowledgeBasePage() {
  const canEdit = useCanEdit()
  const adAccountId = useAppStore((s) => s.selectedAdAccountId)

  const { data: campaignsData, isLoading: loadingCampaigns } = useCampaigns(adAccountId)
  const { data: campaignKbsData, isLoading: loadingKbs, error } = useCampaignKnowledgeBases(adAccountId)

  const campaigns = useMemo(() => campaignsData?.data || [], [campaignsData])
  const campaignKbs = campaignKbsData?.data || []
  const statusMap = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of campaigns) m.set(c.id, c.status)
    return m
  }, [campaigns])

  const [selectedCampaign, setSelectedCampaign] = useState<{ id: string; name: string } | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const existingIds = useMemo(() => new Set(campaignKbs.map((kb) => kb.campaignId)), [campaignKbs])

  const isLoading = loadingCampaigns || loadingKbs

  if (!adAccountId) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="rounded-full p-3 mb-3" style={{ background: "var(--bg-raised)" }}>
          <BookOpen size={20} style={{ color: "var(--text-disabled)" }} />
        </div>
        <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>No account selected</p>
        <p className="text-[11px] mt-1" style={{ color: "var(--text-disabled)" }}>Select a Meta ad account from the dropdown above</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[16px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Knowledge Base</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {campaignKbs.length > 0
              ? `${campaignKbs.length} campaign${campaignKbs.length !== 1 ? "s" : ""} configured · Metrics tracked automatically`
              : "Per-campaign context and objectives for smarter AI insights"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={18} className="animate-spin" style={{ color: "var(--text-tertiary)" }} /></div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg px-4 py-3" style={{ background: "var(--red-bg)", color: "var(--red-text)" }}>
          <AlertCircle size={14} /><span className="text-[12px]">Failed to load. Try refreshing.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {/* Add campaign card — always first */}
          {canEdit && (
            <button onClick={() => setShowPicker(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-lg p-5 transition-all"
              style={{ background: "var(--bg-raised)", border: "1px dashed var(--border-default)", minHeight: 100 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--acc-text)"; e.currentTarget.style.borderStyle = "solid" }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.borderStyle = "dashed" }}>
              <div className="rounded-full p-2" style={{ background: "var(--acc-subtle)" }}>
                <Plus size={16} style={{ color: "var(--acc-text)" }} />
              </div>
              <span className="text-[12px] font-medium" style={{ color: "var(--acc-text)" }}>Add Campaign</span>
            </button>
          )}

          {/* Configured campaign cards */}
          {campaignKbs.map((kb) => (
            <CampaignCard key={kb.id} kb={kb} adAccountId={adAccountId} campaignStatus={statusMap.get(kb.campaignId)}
              onClick={() => setSelectedCampaign({ id: kb.campaignId, name: kb.campaignName || kb.campaignId })} />
          ))}

          {/* Empty state when no campaigns configured and user can't edit */}
          {campaignKbs.length === 0 && !canEdit && (
            <div className="col-span-full py-16 text-center">
              <div className="rounded-full p-3 mx-auto mb-3 w-fit" style={{ background: "var(--bg-raised)" }}>
                <Megaphone size={18} style={{ color: "var(--text-disabled)" }} />
              </div>
              <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>No campaigns configured yet</p>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-disabled)" }}>Ask an admin to set up campaign knowledge bases</p>
            </div>
          )}
        </div>
      )}

      {showPicker && adAccountId && (
        <CampaignPickerDialog open onClose={() => setShowPicker(false)} adAccountId={adAccountId} existingIds={existingIds} />
      )}

      {selectedCampaign && (
        <CampaignKBDialog open onClose={() => setSelectedCampaign(null)}
          adAccountId={adAccountId} campaignId={selectedCampaign.id}
          campaignName={selectedCampaign.name} canEdit={canEdit} />
      )}
    </div>
  )
}
