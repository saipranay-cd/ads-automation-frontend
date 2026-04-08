"use client"

import { useState, useEffect, useRef, Suspense, useCallback } from "react"
import { apiFetch } from "@/lib/api-fetch"
import { useAuth } from "@/hooks/use-auth"
import { useLogout } from "@/hooks/use-logout"
import { useSearchParams } from "next/navigation"
import { LogOut, Save, RotateCcw, Brain, ChevronDown, ChevronUp, Check, Cpu, Link2, RefreshCw, Unlink, Loader2, Search, X } from "lucide-react"
import { useAdAccounts, useSkillPrompt, useUpdateSkillPrompt } from "@/hooks/use-campaigns"
import type { AiModelOption } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { usePlatform } from "@/hooks/use-platform"
import type { Platform } from "@/hooks/use-platform"
import { useGoogleAuthStatus } from "@/hooks/use-google"
import { useCrmConnection, useSyncCrm, useCrmQualityMap, useUpdateQualityMap, useDiscoverStages, useSourceMap, useUpdateSourceMap, useDiscoverSources, useFieldMap, useZohoFields, useUpdateFieldMap, useHistoryConfig, useUpdateHistoryConfig } from "@/hooks/use-crm"
import type { CrmConnection, QualityMapping, SourceMapping, ZohoField } from "@/hooks/use-crm"
import { useIsAdmin } from "@/hooks/use-role"

export default function SettingsPageWrapper() {
  return (
    <Suspense>
      <SettingsPage />
    </Suspense>
  )
}

function SettingsPage() {
  const { user: authUser } = useAuth()
  const logout = useLogout()
  const { data: accountsData } = useAdAccounts()
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const selectedGoogleAccountId = useAppStore((s) => s.selectedGoogleAccountId)
  const activeAdAccountId = selectedAdAccountId || selectedGoogleAccountId || null
  const accounts = accountsData?.data || []
  const selectedAccount = accounts.find((a) => a.id === selectedAdAccountId)

  const sectionStyle = {
    background: "var(--bg-base)" as const,
    border: "1px solid var(--border-default)" as const,
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Account */}
      <div className="rounded-lg p-5" style={sectionStyle}>
        <h2
          className="mb-4 text-[10px] font-medium uppercase tracking-[0.06em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          Account
        </h2>
        <div className="space-y-3">
          <Row label="Email" value={authUser?.email || "—"} />
          <Row label="Name" value={authUser?.name || "—"} />
        </div>
      </div>

      {/* Connectors */}
      <MetaConnection />
      <GoogleAdsConnection />

      {/* Ad Account */}
      {selectedAccount && (
        <div className="rounded-lg p-5" style={sectionStyle}>
          <h2
            className="mb-4 text-[10px] font-medium uppercase tracking-[0.06em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Active Ad Account
          </h2>
          <div className="space-y-3">
            <Row label="Account Name" value={selectedAccount.name} />
            <Row label="Account ID" value={selectedAccount.account_id} mono />
            <Row label="Currency" value={selectedAccount.currency} />
            <Row
              label="Status"
              value={selectedAccount.account_status === 1 ? "Active" : "Inactive"}
              badge={selectedAccount.account_status === 1 ? "good" : "warning"}
            />
            <Row
              label="Last Synced"
              value={
                selectedAccount.syncedAt
                  ? new Date(selectedAccount.syncedAt).toLocaleString()
                  : "Never"
              }
            />
          </div>
        </div>
      )}

      {/* AI Model + Skill Prompt */}
      {selectedAdAccountId && <ModelSwitcher adAccountId={selectedAdAccountId} />}
      {selectedAdAccountId && <SkillPromptEditor adAccountId={selectedAdAccountId} />}

      {/* CRM Integration */}
      <CrmIntegration adAccountId={activeAdAccountId} />

      {/* All Ad Accounts */}
      {accounts.length > 1 && (
        <div className="rounded-lg p-5" style={sectionStyle}>
          <h2
            className="mb-4 text-[10px] font-medium uppercase tracking-[0.06em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            All Ad Accounts ({accounts.length})
          </h2>
          <div className="space-y-2">
            {accounts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-md px-3 py-2"
                style={{
                  background: a.id === selectedAdAccountId ? "var(--acc-subtle)" : "transparent",
                  border: a.id === selectedAdAccountId ? "1px solid var(--acc-border)" : "1px solid transparent",
                }}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {a.name}
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    {a.account_id} · {a.currency}
                  </span>
                </div>
                {a.id === selectedAdAccountId && (
                  <span className="text-[10px] font-medium" style={{ color: "var(--acc-text)" }}>
                    Selected
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="rounded-lg p-5" style={{ ...sectionStyle, borderColor: "rgba(248, 113, 113, 0.2)" }}>
        <h2
          className="mb-4 text-[10px] font-medium uppercase tracking-[0.06em]"
          style={{ color: "#f87171" }}
        >
          Danger Zone
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Sign Out
            </span>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Sign out of your account
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
            style={{
              border: "1px solid rgba(248, 113, 113, 0.3)",
              color: "#f87171",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248, 113, 113, 0.08)" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
          >
            <LogOut size={12} />
            Sign Out
          </button>
        </div>
      </div>

    </div>
  )
}

// ── Model Switcher ──────────────────────────────────────────

function ModelSwitcher({ adAccountId }: { adAccountId: string }) {
  const { platform } = usePlatform()
  const { data, isLoading } = useSkillPrompt(adAccountId, platform)
  const updateMutation = useUpdateSkillPrompt()
  const [saved, setSaved] = useState(false)
  const isAdmin = useIsAdmin()

  const currentModel = data?.aiModel || "gpt-4.1-mini"
  const models: AiModelOption[] = data?.availableModels || []

  const handleSelect = (modelId: string) => {
    if (modelId === currentModel) return
    updateMutation.mutate(
      { adAccountId, aiModel: modelId, platform },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        },
      }
    )
  }

  const sectionStyle = {
    background: "var(--bg-base)" as const,
    border: "1px solid var(--border-default)" as const,
  }

  return (
    <div className="rounded-lg p-5" style={sectionStyle}>
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "rgba(96, 165, 250, 0.12)" }}
        >
          <Cpu size={16} style={{ color: "#60a5fa" }} />
        </div>
        <div>
          <h2
            className="text-[10px] font-medium uppercase tracking-[0.06em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            AI Model
          </h2>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Choose the model used for AI scans and proposals
          </p>
        </div>
        {saved && (
          <span className="ml-auto flex items-center gap-1 text-xs font-medium" style={{ color: "#4ade80" }}>
            <Check size={12} />
            Saved
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="mt-4 h-20 animate-pulse rounded-md" style={{ background: "var(--bg-muted)" }} />
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {models.map((m) => {
            const active = m.id === currentModel
            return (
              <button
                key={m.id}
                onClick={() => handleSelect(m.id)}
                disabled={updateMutation.isPending || !isAdmin}
                className="rounded-lg px-3.5 py-3 text-left transition-all"
                style={{
                  background: active ? "var(--acc-subtle, rgba(139, 92, 246, 0.08))" : "var(--bg-muted)",
                  border: active ? "1.5px solid var(--acc)" : "1.5px solid transparent",
                  opacity: updateMutation.isPending || !isAdmin ? 0.6 : 1,
                  cursor: !isAdmin ? "not-allowed" : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: active ? "var(--acc)" : "var(--text-primary)" }}
                  >
                    {m.name}
                  </span>
                  {active && (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: "var(--acc)" }}
                    />
                  )}
                </div>
                <p className="mt-0.5 text-[11px] leading-snug" style={{ color: "var(--text-tertiary)" }}>
                  {m.description}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Agent lists per platform ────────────────────────────────

const META_AGENTS = [
  "budget-sentinel",
  "audience-architect",
  "creative-fatigue",
  "bid-optimizer",
  "lead-quality",
  "performance-prophet",
]

const GOOGLE_AGENTS = [
  "keyword-optimizer",
  "quality-score-improver",
  "bid-strategist",
  "negative-keyword-finder",
  "ad-copy-tester",
]

// ── Skill Prompt Editor ─────────────────────────────────────

function SkillPromptEditor({ adAccountId }: { adAccountId: string }) {
  const { platform: activePlatform } = usePlatform()
  const [promptPlatform, setPromptPlatform] = useState<Platform>(activePlatform)
  const { data, isLoading } = useSkillPrompt(adAccountId, promptPlatform)
  const updateMutation = useUpdateSkillPrompt()
  const [localPrompt, setLocalPrompt] = useState("")
  const [syncedPrompt, setSyncedPrompt] = useState<string | undefined>(undefined)
  const [expanded, setExpanded] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedPlatform, setSavedPlatform] = useState<Platform>(promptPlatform)
  const isAdmin = useIsAdmin()

  // Sync from server when data changes (React-recommended: adjust state during render)
  if (data?.prompt && data.prompt !== syncedPrompt) {
    setSyncedPrompt(data.prompt)
    setLocalPrompt(data.prompt)
  }

  // Reset saved indicator when switching platforms
  if (promptPlatform !== savedPlatform) {
    setSavedPlatform(promptPlatform)
    setSaved(false)
  }

  const hasChanges = localPrompt !== (data?.prompt || "")
  const agents = promptPlatform === "google" ? GOOGLE_AGENTS : META_AGENTS

  const handleSave = () => {
    updateMutation.mutate(
      { adAccountId, prompt: localPrompt, platform: promptPlatform },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        },
      }
    )
  }

  const handleReset = () => {
    if (data?.prompt) {
      setLocalPrompt(data.prompt)
    }
  }

  const sectionStyle = {
    background: "var(--bg-base)" as const,
    border: "1px solid var(--border-default)" as const,
  }

  return (
    <div className="rounded-lg p-5" style={sectionStyle}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "rgba(192, 132, 252, 0.12)" }}
          >
            <Brain size={16} style={{ color: "#c084fc" }} />
          </div>
          <div>
            <h2
              className="text-[10px] font-medium uppercase tracking-[0.06em]"
              style={{ color: "var(--text-tertiary)" }}
            >
              AI Skill Prompt
            </h2>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Controls how AI agents analyze your ads and generate proposals
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all"
          style={{
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? "Collapse" : isAdmin ? "View & Edit" : "View"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4">
          {/* Platform tabs */}
          <div className="mb-3 flex gap-1 rounded-md p-0.5" style={{ background: "var(--bg-muted)" }}>
            {(["meta", "google"] as const).map((p) => {
              const active = promptPlatform === p
              return (
                <button
                  key={p}
                  onClick={() => setPromptPlatform(p)}
                  className="flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
                  style={{
                    background: active ? "var(--bg-base)" : "transparent",
                    color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                    boxShadow: active ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {p === "meta" ? "Meta Ads Prompt" : "Google Ads Prompt"}
                </button>
              )
            })}
          </div>

          {isLoading ? (
            <div className="h-40 animate-pulse rounded-md" style={{ background: "var(--bg-muted)" }} />
          ) : (
            <>
              <textarea
                value={localPrompt}
                onChange={(e) => isAdmin && setLocalPrompt(e.target.value)}
                readOnly={!isAdmin}
                className="w-full rounded-md p-3 font-mono text-xs leading-relaxed outline-none"
                style={{
                  background: "var(--bg-muted)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  minHeight: "300px",
                  resize: "vertical",
                  opacity: !isAdmin ? 0.7 : 1,
                  cursor: !isAdmin ? "not-allowed" : undefined,
                }}
                spellCheck={false}
              />
              {!isAdmin && (
                <p className="mt-1 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  Only admins can edit the AI skill prompt
                </p>
              )}

              {/* Agent badges */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--text-tertiary)", lineHeight: "22px" }}>
                  Agents:
                </span>
                {agents.map((agent) => (
                  <span
                    key={agent}
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: promptPlatform === "google" ? "rgba(96, 165, 250, 0.1)" : "rgba(192, 132, 252, 0.1)",
                      color: promptPlatform === "google" ? "#60a5fa" : "#c084fc",
                    }}
                  >
                    {agent}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  {localPrompt.length.toLocaleString()} characters
                  {hasChanges && " · Unsaved changes"}
                </span>
                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
                      style={{
                        border: "1px solid var(--border-default)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <RotateCcw size={11} />
                      Discard
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || updateMutation.isPending || !isAdmin}
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-all"
                    style={{
                      background: saved ? "#4ade80" : "var(--acc)",
                      opacity: !hasChanges || updateMutation.isPending || !isAdmin ? 0.5 : 1,
                    }}
                  >
                    {saved ? <Check size={12} /> : <Save size={12} />}
                    {saved ? "Saved" : updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── CRM Integration ─────────────────────────────────────────

function CrmIntegration({ adAccountId }: { adAccountId: string | null }) {
  const { data: connData, isLoading, refetch } = useCrmConnection(adAccountId || "")
  const syncMutation = useSyncCrm()
  const [expanded, setExpanded] = useState(false)
  const [sourceExpanded, setSourceExpanded] = useState(false)
  const [fieldExpanded, setFieldExpanded] = useState(false)
  const isAdmin = useIsAdmin()

  const connection = connData?.data?.find((c: CrmConnection) => c.isActive)

  const handleConnect = async () => {
    if (!isAdmin || !adAccountId) return
    try {
      const res = await apiFetch(`/api/crm/zoho/auth?adAccountId=${adAccountId}`)
      const data = await res.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch {
      // Handle error
    }
  }

  const handleDisconnect = async () => {
    if (!connection || !isAdmin) return
    try {
      await apiFetch(`/api/crm/connections?id=${connection.id}`, { method: "DELETE" })
      refetch()
    } catch {
      // Handle error
    }
  }

  const handleSync = () => {
    if (!connection || !isAdmin) return
    syncMutation.mutate(connection.id, { onSuccess: () => refetch() })
  }

  const sectionStyle = {
    background: "var(--bg-base)" as const,
    border: "1px solid var(--border-default)" as const,
  }

  return (
    <div className="rounded-lg p-5" style={sectionStyle}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "rgba(251, 146, 60, 0.12)" }}
          >
            <Link2 size={16} style={{ color: "#fb923c" }} />
          </div>
          <div>
            <h2
              className="text-[10px] font-medium uppercase tracking-[0.06em]"
              style={{ color: "var(--text-tertiary)" }}
            >
              CRM Integration
            </h2>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Connect your CRM for lead quality insights
            </p>
          </div>
        </div>
        {connection && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ background: "rgba(74, 222, 128, 0.1)", color: "#4ade80" }}
          >
            Zoho Connected
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="mt-4 h-16 animate-pulse rounded-md" style={{ background: "var(--bg-muted)" }} />
      ) : connection ? (
        <div className="mt-4 space-y-3">
          {/* Connection info */}
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Provider</span>
            <span className="text-sm capitalize" style={{ color: "var(--text-primary)" }}>
              {connection.provider}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Leads Synced</span>
            <span className="font-mono text-sm" style={{ color: "var(--text-primary)" }}>
              {connection._count?.leads || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Last Sync</span>
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>
              {connection.lastSyncAt ? new Date(connection.lastSyncAt).toLocaleString() : "Never"}
            </span>
          </div>
          {connection.syncError && (
            <div className="rounded-md px-3 py-2 text-xs" style={{ background: "rgba(248, 113, 113, 0.08)", color: "#f87171" }}>
              Sync error: {connection.syncError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
              style={{ background: "var(--acc)", color: "#fff", opacity: syncMutation.isPending ? 0.6 : 1 }}
            >
              {syncMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              {syncMutation.isPending ? "Syncing..." : "Sync Now"}
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
              style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Quality Mapping
            </button>
            <button
              onClick={handleDisconnect}
              className="ml-auto flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
              style={{ border: "1px solid rgba(248, 113, 113, 0.3)", color: "#f87171" }}
            >
              <Unlink size={12} />
              Disconnect
            </button>
          </div>

          {/* Quality Mapping Editor */}
          {expanded && <QualityMappingEditor connectionId={connection.id} />}

          {/* Source Mapping */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setSourceExpanded(!sourceExpanded)}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
              style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
            >
              {sourceExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Source Mapping
            </button>
            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              Map CRM lead sources to ad platforms for accurate CPQL
            </span>
          </div>
          {sourceExpanded && <SourceMappingEditor connectionId={connection.id} />}

          {/* Field Mapping */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setFieldExpanded(!fieldExpanded)}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
              style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
            >
              {fieldExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Field Mapping
            </button>
            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              Map Zoho fields to Meta Campaign ID, Ad Set ID, Ad ID
            </span>
          </div>
          {fieldExpanded && <FieldMappingEditor connectionId={connection.id} />}

          {/* Lead Status History Config */}
          <HistoryConfigEditor connectionId={connection.id} />
        </div>
      ) : (
        <div className="mt-4">
          <p className="mb-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
            Connect Zoho CRM to track lead quality and compute Cost Per Quality Lead (CPQL).
          </p>
          {adAccountId ? (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 rounded-md px-4 py-2 text-xs font-medium text-white transition-all"
              style={{ background: "#fb923c" }}
            >
              <Link2 size={13} />
              Connect Zoho CRM
            </button>
          ) : (
            <p className="text-xs" style={{ color: "var(--text-disabled)" }}>
              Connect a Meta or Google ad account first to enable CRM integration.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Lead Status History Config ───────────────────────────────

function HistoryConfigEditor({ connectionId }: { connectionId: string }) {
  const { data } = useHistoryConfig(connectionId)
  const updateMutation = useUpdateHistoryConfig()
  const isAdmin = useIsAdmin()
  const [relatedList, setRelatedList] = useState("")
  const [stageField, setStageField] = useState("")
  const [saved, setSaved] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Sync from server
  if (data?.data && !initialized) {
    setRelatedList(data.data.historyRelatedList || "")
    setStageField(data.data.historyStageField || "")
    setInitialized(true)
  }

  const hasChanges =
    relatedList !== (data?.data?.historyRelatedList || "") ||
    stageField !== (data?.data?.historyStageField || "")

  const handleSave = () => {
    if (!isAdmin) return
    updateMutation.mutate(
      {
        connectionId,
        historyRelatedList: relatedList.trim() || null,
        historyStageField: stageField.trim() || null,
      },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        },
      }
    )
  }

  return (
    <div className="mt-3 rounded-md p-3" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Lead Status History
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
          Track the best stage a lead ever reached, even if it later moved to Dead
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-[10px] mb-1" style={{ color: "var(--text-tertiary)" }}>
            Related List API Name
          </label>
          <input
            type="text"
            value={relatedList}
            onChange={(e) => isAdmin && setRelatedList(e.target.value)}
            readOnly={!isAdmin}
            placeholder="e.g. Lead_Status_History"
            className="w-full rounded-md px-2.5 py-1.5 text-[11px]"
            style={{
              background: "var(--bg-base)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
              opacity: !isAdmin ? 0.7 : 1,
            }}
          />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] mb-1" style={{ color: "var(--text-tertiary)" }}>
            Stage Field Name
          </label>
          <input
            type="text"
            value={stageField}
            onChange={(e) => isAdmin && setStageField(e.target.value)}
            readOnly={!isAdmin}
            placeholder="e.g. Lead_Status"
            className="w-full rounded-md px-2.5 py-1.5 text-[11px]"
            style={{
              background: "var(--bg-base)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
              opacity: !isAdmin ? 0.7 : 1,
            }}
          />
        </div>
        {isAdmin && (
          <div className="self-end">
            <button
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-medium text-white transition-all"
              style={{
                background: saved ? "#4ade80" : "var(--acc)",
                opacity: !hasChanges || updateMutation.isPending ? 0.5 : 1,
              }}
            >
              {saved ? <Check size={11} /> : <Save size={11} />}
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        )}
      </div>
      {!relatedList && (
        <p className="mt-1.5 text-[10px]" style={{ color: "var(--text-disabled)" }}>
          Not configured. Without this, best quality stage is based on current CRM stage only.
        </p>
      )}
    </div>
  )
}

// ── Searchable Select ───────────────────────────────────────

function SearchSelect({
  value,
  onChange,
  options,
  placeholder = "Search fields...",
}: {
  value: string
  onChange: (val: string) => void
  options: { value: string; label: string; sub?: string }[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find(o => o.value === value)
  const filtered = query
    ? options.filter(o =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        o.value.toLowerCase().includes(query.toLowerCase()) ||
        (o.sub || "").toLowerCase().includes(query.toLowerCase())
      )
    : options

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleToggle = useCallback(() => {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen) {
      setQuery("")
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  return (
    <div ref={ref} className="relative flex-1">
      {/* Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] text-left"
        style={{
          background: "var(--bg-base)",
          border: open ? "1px solid var(--acc)" : "1px solid var(--border-default)",
          color: selected ? "var(--text-primary)" : "var(--text-tertiary)",
        }}
      >
        <span className="truncate">
          {selected ? `${selected.label} (${selected.value})` : "— Not mapped —"}
        </span>
        {value ? (
          <X
            size={12}
            className="shrink-0 ml-1"
            style={{ color: "var(--text-tertiary)" }}
            onClick={(e) => { e.stopPropagation(); onChange(""); setOpen(false) }}
          />
        ) : (
          <ChevronDown size={12} className="shrink-0 ml-1" style={{ color: "var(--text-tertiary)" }} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-lg shadow-lg overflow-hidden"
          style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-2.5 py-2" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <Search size={12} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-[11px] outline-none"
              style={{ color: "var(--text-primary)" }}
            />
            {query && (
              <X
                size={11}
                className="cursor-pointer shrink-0"
                style={{ color: "var(--text-tertiary)" }}
                onClick={() => setQuery("")}
              />
            )}
          </div>

          {/* Options list */}
          <div className="max-h-[200px] overflow-y-auto">
            {/* Clear option */}
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false) }}
              className="w-full px-3 py-1.5 text-left text-[11px] transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-subtle)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              — Not mapped —
            </button>

            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                No fields match &ldquo;{query}&rdquo;
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    className="w-full px-3 py-1.5 text-left transition-colors flex items-center justify-between"
                    style={{
                      background: isSelected ? "var(--acc-subtle, rgba(139,92,246,0.08))" : "transparent",
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--bg-subtle)" }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent" }}
                  >
                    <div>
                      <span className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>
                        {opt.label}
                      </span>
                      <span className="text-[10px] ml-1.5" style={{ color: "var(--text-tertiary)" }}>
                        {opt.value}
                      </span>
                    </div>
                    {isSelected && <Check size={11} style={{ color: "var(--acc)" }} />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Field Mapping Editor (Zoho → Ad Platform IDs) ─────────────────

const META_FIELDS = [
  { key: "campaign_id", label: "Campaign ID", description: "Zoho field containing the Meta Campaign ID" },
  { key: "adset_id", label: "Ad Set ID", description: "Zoho field containing the Meta Ad Set ID" },
  { key: "ad_id", label: "Ad ID", description: "Zoho field containing the Meta Ad ID" },
] as const

const GOOGLE_FIELDS = [
  { key: "google_campaign_id", label: "Campaign ID", description: "Zoho field containing the Google Campaign ID (default: UTM_Campaign)" },
  { key: "google_adgroup_id", label: "Ad Group ID", description: "Zoho field containing the Google Ad Group ID (default: UTM_Content)" },
] as const

const ALL_MAPPING_FIELDS = [...META_FIELDS, ...GOOGLE_FIELDS]

function FieldMappingEditor({ connectionId }: { connectionId: string }) {
  const { data: fieldMapData, isLoading: mapLoading } = useFieldMap(connectionId)
  const { data: zohoFieldsData, isLoading: fieldsLoading } = useZohoFields(connectionId)
  const updateMutation = useUpdateFieldMap()
  const isAdmin = useIsAdmin()
  const [localMappings, setLocalMappings] = useState<Record<string, string>>({
    campaign_id: "",
    adset_id: "",
    ad_id: "",
    google_campaign_id: "",
    google_adgroup_id: "",
  })
  const [saved, setSaved] = useState(false)

  const zohoFields = zohoFieldsData?.data || []
  const fieldOptions = zohoFields.map((zf: ZohoField) => ({
    value: zf.apiName,
    label: zf.displayLabel,
    sub: zf.dataType,
  }))

  const [syncedFieldMap, setSyncedFieldMap] = useState(fieldMapData?.data)
  if (fieldMapData?.data && fieldMapData.data !== syncedFieldMap) {
    setSyncedFieldMap(fieldMapData.data)
    const map: Record<string, string> = { campaign_id: "", adset_id: "", ad_id: "", google_campaign_id: "", google_adgroup_id: "" }
    for (const m of fieldMapData.data) {
      map[m.metaField] = m.zohoField
    }
    setLocalMappings(map)
  }

  const handleSave = () => {
    const mappings = ALL_MAPPING_FIELDS.map(f => ({
      metaField: f.key,
      zohoField: localMappings[f.key] || "",
    }))
    updateMutation.mutate(
      { connectionId, mappings },
      { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000) } }
    )
  }

  const isLoading = mapLoading || fieldsLoading

  if (isLoading) {
    return <div className="h-20 animate-pulse rounded-md" style={{ background: "var(--bg-muted)" }} />
  }

  return (
    <div className="space-y-3 pt-2">
      {/* Meta field mappings */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
          Meta — map Zoho fields that contain Meta ad IDs
        </span>
      </div>

      <div className="space-y-2">
        {META_FIELDS.map((mf) => (
          <div
            key={mf.key}
            className="flex items-center gap-3 rounded-md px-3 py-2.5"
            style={{ background: "var(--bg-muted)" }}
          >
            <div className="min-w-[100px]">
              <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                {mf.label}
              </span>
              <p className="text-[9px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                {mf.description}
              </p>
            </div>
            <SearchSelect
              value={localMappings[mf.key] || ""}
              onChange={(val) => setLocalMappings(prev => ({ ...prev, [mf.key]: val }))}
              options={fieldOptions}
              placeholder="Search Zoho fields..."
            />
          </div>
        ))}
      </div>

      {/* Google field mappings */}
      <div className="flex items-center justify-between pt-3">
        <span className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
          Google Ads — optional overrides (defaults to UTM_Campaign / UTM_Content)
        </span>
      </div>

      <div className="space-y-2">
        {GOOGLE_FIELDS.map((gf) => (
          <div
            key={gf.key}
            className="flex items-center gap-3 rounded-md px-3 py-2.5"
            style={{ background: "var(--bg-muted)" }}
          >
            <div className="min-w-[100px]">
              <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                {gf.label}
              </span>
              <p className="text-[9px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                {gf.description}
              </p>
            </div>
            <SearchSelect
              value={localMappings[gf.key] || ""}
              onChange={(val) => setLocalMappings(prev => ({ ...prev, [gf.key]: val }))}
              options={fieldOptions}
              placeholder="Search Zoho fields..."
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
          After saving, resync to apply field mappings to leads
        </span>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-all"
          style={{ background: saved ? "#4ade80" : "var(--acc)", opacity: updateMutation.isPending ? 0.5 : 1 }}
        >
          {saved ? <Check size={12} /> : <Save size={12} />}
          {saved ? "Saved" : updateMutation.isPending ? "Saving..." : "Save Fields"}
        </button>
      </div>
    </div>
  )
}

// ── Source Mapping Editor ────────────────────────────────────

const PLATFORM_OPTIONS = [
  { value: "meta", label: "Meta (Facebook/Instagram)", color: "#1877F2" },
  { value: "google", label: "Google Ads", color: "#34A853" },
  { value: "organic", label: "Organic / Direct", color: "#9CA3AF" },
  { value: "other", label: "Other", color: "#6B7280" },
] as const

function SourceMappingEditor({ connectionId }: { connectionId: string }) {
  const { data: mapData, isLoading } = useSourceMap(connectionId)
  const updateMutation = useUpdateSourceMap()
  const discoverMutation = useDiscoverSources()
  const isAdmin = useIsAdmin()
  const [localMappings, setLocalMappings] = useState<{ crmSource: string; adPlatform: string }[]>([])
  const [saved, setSaved] = useState(false)

  const [syncedSourceMap, setSyncedSourceMap] = useState(mapData?.data)
  if (mapData?.data && mapData.data !== syncedSourceMap) {
    setSyncedSourceMap(mapData.data)
    setLocalMappings(mapData.data.map((m: SourceMapping) => ({ crmSource: m.crmSource, adPlatform: m.adPlatform })))
  }

  const handleDiscover = () => discoverMutation.mutate(connectionId)

  const handleSave = () => {
    updateMutation.mutate(
      { connectionId, mappings: localMappings },
      { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000) } }
    )
  }

  const updateMapping = (index: number, platform: string) => {
    setLocalMappings(prev => prev.map((m, i) => i === index ? { ...m, adPlatform: platform } : m))
  }

  if (isLoading) {
    return <div className="h-20 animate-pulse rounded-md" style={{ background: "var(--bg-muted)" }} />
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
          Map CRM lead sources to ad platforms
        </span>
        <button
          onClick={handleDiscover}
          disabled={discoverMutation.isPending}
          className="text-[11px] font-medium"
          style={{ color: "var(--acc)" }}
        >
          {discoverMutation.isPending ? "Discovering..." : "Discover Sources"}
        </button>
      </div>

      {localMappings.length === 0 ? (
        <p className="py-4 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
          No sources found. Click &quot;Discover Sources&quot; to fetch from Zoho.
        </p>
      ) : (
        <div className="space-y-2">
          {localMappings.map((mapping, i) => {
            const platform = PLATFORM_OPTIONS.find(p => p.value === mapping.adPlatform) || PLATFORM_OPTIONS[3]
            return (
              <div
                key={mapping.crmSource}
                className="flex items-center gap-3 rounded-md px-3 py-2"
                style={{ background: "var(--bg-muted)" }}
              >
                <span className="min-w-[160px] text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  {mapping.crmSource}
                </span>
                <select
                  value={mapping.adPlatform}
                  onChange={(e) => updateMapping(i, e.target.value)}
                  className="rounded-md px-2 py-1 text-[11px] font-medium flex-1"
                  style={{
                    background: "var(--bg-base)",
                    border: `1px solid ${platform.color}50`,
                    color: platform.color,
                  }}
                >
                  {PLATFORM_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      )}

      {localMappings.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-all"
            style={{ background: saved ? "#4ade80" : "var(--acc)", opacity: updateMutation.isPending ? 0.5 : 1 }}
          >
            {saved ? <Check size={12} /> : <Save size={12} />}
            {saved ? "Saved" : updateMutation.isPending ? "Saving..." : "Save Sources"}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Quality Mapping Editor ──────────────────────────────────

const TIER_OPTIONS = ["junk", "low", "medium", "high", "converted"] as const

const tierColors: Record<string, string> = {
  converted: "#4ade80",
  high: "#60a5fa",
  medium: "#fbbf24",
  low: "#fb923c",
  junk: "#f87171",
}

function QualityMappingEditor({ connectionId }: { connectionId: string }) {
  const { data: mapData, isLoading } = useCrmQualityMap(connectionId)
  const updateMutation = useUpdateQualityMap()
  const discoverMutation = useDiscoverStages()
  const isAdmin = useIsAdmin()
  const [localMappings, setLocalMappings] = useState<
    { crmStage: string; qualityScore: number; qualityTier: string; sortOrder: number }[]
  >([])
  const [saved, setSaved] = useState(false)

  const [syncedQualityMap, setSyncedQualityMap] = useState(mapData?.data)
  if (mapData?.data && mapData.data !== syncedQualityMap) {
    setSyncedQualityMap(mapData.data)
    setLocalMappings(
      mapData.data.map((m: QualityMapping) => ({
        crmStage: m.crmStage,
        qualityScore: m.qualityScore,
        qualityTier: m.qualityTier,
        sortOrder: m.sortOrder,
      }))
    )
  }

  const handleDiscover = () => {
    discoverMutation.mutate(connectionId)
  }

  const handleSave = () => {
    updateMutation.mutate(
      { connectionId, mappings: localMappings },
      { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000) } }
    )
  }

  const updateMapping = (index: number, field: string, value: string | number) => {
    setLocalMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    )
  }

  if (isLoading) {
    return <div className="h-20 animate-pulse rounded-md" style={{ background: "var(--bg-muted)" }} />
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
          Map CRM stages to quality tiers
        </span>
        <button
          onClick={handleDiscover}
          disabled={discoverMutation.isPending}
          className="text-[11px] font-medium"
          style={{ color: "var(--acc)" }}
        >
          {discoverMutation.isPending ? "Discovering..." : "Discover Stages"}
        </button>
      </div>

      {localMappings.length === 0 ? (
        <p className="py-4 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
          No stages found. Click &quot;Discover Stages&quot; to fetch from Zoho.
        </p>
      ) : (
        <div className="space-y-2">
          {localMappings.map((mapping, i) => (
            <div
              key={mapping.crmStage}
              className="flex items-center gap-3 rounded-md px-3 py-2"
              style={{ background: "var(--bg-muted)" }}
            >
              <span className="min-w-[120px] text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                {mapping.crmStage}
              </span>
              <select
                value={mapping.qualityTier}
                onChange={(e) => {
                  updateMapping(i, "qualityTier", e.target.value)
                  // Auto-set score based on tier
                  const defaultScores: Record<string, number> = { junk: 0, low: 25, medium: 50, high: 75, converted: 100 }
                  updateMapping(i, "qualityScore", defaultScores[e.target.value] || 50)
                }}
                className="rounded-md px-2 py-1 text-[11px] font-medium"
                style={{
                  background: "var(--bg-base)",
                  border: `1px solid ${tierColors[mapping.qualityTier] || "var(--border-default)"}`,
                  color: tierColors[mapping.qualityTier] || "var(--text-primary)",
                }}
              >
                {TIER_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              <input
                type="range"
                min={0}
                max={100}
                value={mapping.qualityScore}
                onChange={(e) => updateMapping(i, "qualityScore", Number(e.target.value))}
                className="flex-1"
                style={{ accentColor: tierColors[mapping.qualityTier] || "var(--acc)" }}
              />
              <span className="w-8 text-right font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                {mapping.qualityScore}
              </span>
            </div>
          ))}
        </div>
      )}

      {localMappings.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-all"
            style={{ background: saved ? "#4ade80" : "var(--acc)", opacity: updateMutation.isPending ? 0.5 : 1 }}
          >
            {saved ? <Check size={12} /> : <Save size={12} />}
            {saved ? "Saved" : updateMutation.isPending ? "Saving..." : "Save Mappings"}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Meta Connection ─────────────────────────────────────────

function MetaConnection() {
  const { data: accountsData, isLoading, refetch } = useAdAccounts()
  const accounts = accountsData?.data || []
  const connected = accounts.length > 0
  const isAdmin = useIsAdmin()
  const searchParams = useSearchParams()
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    const metaParam = searchParams.get("meta")
    if (metaParam === "connected") {
      setToast({ type: "success", message: "Meta Ads connected successfully" })
      refetch()
    } else if (metaParam === "not_configured") {
      setToast({ type: "error", message: "Meta not configured. Set META_APP_ID and META_APP_SECRET in your .env file." })
    } else if (metaParam === "error") {
      setToast({ type: "error", message: "Failed to connect Meta Ads. Please try again." })
    }
    if (metaParam) {
      const url = new URL(window.location.href)
      url.searchParams.delete("meta")
      window.history.replaceState({}, "", url.toString())
      const timer = setTimeout(() => setToast(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, refetch])

  const sectionStyle = {
    background: "var(--bg-base)" as const,
    border: "1px solid var(--border-default)" as const,
  }

  return (
    <div className="rounded-lg p-5" style={sectionStyle}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "rgba(24, 119, 242, 0.12)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <div>
            <h2
              className="text-[10px] font-medium uppercase tracking-[0.06em]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Meta Ads
            </h2>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {connected
                ? `${accounts.length} ad account${accounts.length !== 1 ? "s" : ""} connected`
                : "Connect your Meta Business account to manage ads"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
          ) : connected ? (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: "rgba(74, 222, 128, 0.1)", color: "#4ade80" }}
            >
              Connected
            </span>
          ) : isAdmin ? (
            <a
              href="/api/meta/auth"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-all hover:opacity-90"
              style={{ background: "#1877F2" }}
            >
              Connect Meta
            </a>
          ) : (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: "rgba(248, 113, 113, 0.1)", color: "#f87171" }}
            >
              Not connected
            </span>
          )}
        </div>
      </div>
      {toast && (
        <div
          className="mt-3 rounded-md px-3 py-2 text-xs font-medium"
          style={{
            background: toast.type === "success" ? "rgba(74, 222, 128, 0.1)" : "rgba(248, 113, 113, 0.1)",
            color: toast.type === "success" ? "#4ade80" : "#f87171",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}

// ── Google Ads Connection ────────────────────────────────────

function GoogleAdsConnection() {
  const { data: authStatus, isLoading, refetch } = useGoogleAuthStatus()
  const searchParams = useSearchParams()
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const isAdmin = useIsAdmin()

  const connected = authStatus?.connected ?? false

  // Show toast based on URL params
  useEffect(() => {
    const googleParam = searchParams.get("google")
    if (googleParam === "connected") {
      setToast({ type: "success", message: "Google Ads connected successfully" })
      refetch()
    } else if (googleParam === "conflict") {
      const orgName = searchParams.get("orgName") || "another workspace"
      setToast({ type: "error", message: `This Google Ads account is already managed by "${orgName}". Ask the admin to invite you instead.` })
    } else if (googleParam === "not_configured") {
      setToast({ type: "error", message: "Google Ads not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file." })
    } else if (googleParam === "error") {
      setToast({ type: "error", message: "Failed to connect Google Ads. Please try again." })
    }

    if (googleParam) {
      // Clean up URL params
      const url = new URL(window.location.href)
      url.searchParams.delete("google")
      url.searchParams.delete("orgName")
      window.history.replaceState({}, "", url.toString())

      // Auto-dismiss toast
      const timer = setTimeout(() => setToast(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, refetch])

  const handleDisconnect = async () => {
    if (!isAdmin) return
    setDisconnecting(true)
    try {
      const res = await apiFetch("/api/google/auth/disconnect", { method: "POST" })
      if (res.ok) {
        setToast({ type: "success", message: "Google Ads disconnected" })
        refetch()
      } else {
        setToast({ type: "error", message: "Failed to disconnect Google Ads" })
      }
    } catch {
      setToast({ type: "error", message: "Failed to disconnect Google Ads" })
    } finally {
      setDisconnecting(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  const sectionStyle = {
    background: "var(--bg-base)" as const,
    border: "1px solid var(--border-default)" as const,
  }

  return (
    <div className="rounded-lg p-5" style={sectionStyle}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "rgba(66, 133, 244, 0.12)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
            </svg>
          </div>
          <div>
            <h2
              className="text-[10px] font-medium uppercase tracking-[0.06em]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Google Ads
            </h2>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Connect your Google Ads account for cross-platform management
            </p>
          </div>
        </div>
        {connected && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ background: "rgba(74, 222, 128, 0.1)", color: "#4ade80" }}
          >
            Connected
          </span>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="mt-3 flex items-center justify-between rounded-md px-3 py-2 text-xs"
          style={{
            background: toast.type === "success" ? "rgba(74, 222, 128, 0.08)" : "rgba(248, 113, 113, 0.08)",
            color: toast.type === "success" ? "#4ade80" : "#f87171",
          }}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X size={12} />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="mt-4 h-12 animate-pulse rounded-md" style={{ background: "var(--bg-muted)" }} />
      ) : connected ? (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ background: "rgb(34,197,94)" }} />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Google Ads account linked
              {authStatus?.email && (
                <span className="ml-1.5 font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  ({authStatus.email})
                </span>
              )}
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
            style={{
              border: "1px solid rgba(248, 113, 113, 0.3)",
              color: "#f87171",
              opacity: disconnecting ? 0.5 : 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248, 113, 113, 0.08)" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
          >
            {disconnecting ? <Loader2 size={12} className="animate-spin" /> : <Unlink size={12} />}
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <a
            href="/api/google/auth"
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-medium text-white transition-all"
            style={{
              background: "#4285F4",
              boxShadow: "0 1px 3px rgba(66, 133, 244, 0.3)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#3367D6" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#4285F4" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#fff" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#fff" opacity="0.8" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z" fill="#fff" opacity="0.6" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#fff" opacity="0.9" />
            </svg>
            Connect Google Ads
          </a>
          <p className="mt-2 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            You&apos;ll be redirected to Google to authorize access to your Ads account.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Row helper ──────────────────────────────────────────────

function Row({
  label,
  value,
  mono,
  badge,
}: {
  label: string
  value: string
  mono?: boolean
  badge?: "good" | "warning"
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      {badge ? (
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{
            background: badge === "good" ? "rgba(74, 222, 128, 0.1)" : "rgba(251, 191, 36, 0.1)",
            color: badge === "good" ? "#4ade80" : "#fbbf24",
          }}
        >
          {value}
        </span>
      ) : (
        <span
          className={`text-sm ${mono ? "font-mono" : ""}`}
          style={{ color: "var(--text-primary)" }}
        >
          {value}
        </span>
      )}
    </div>
  )
}
