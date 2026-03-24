"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { LogOut, Save, RotateCcw, Brain, ChevronDown, ChevronUp, Check, Cpu } from "lucide-react"
import { useAdAccounts, useSkillPrompt, useUpdateSkillPrompt } from "@/hooks/use-campaigns"
import type { AiModelOption } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"

export default function SettingsPage() {
  const { data: session } = useSession()
  const { data: accountsData } = useAdAccounts()
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
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
          <Row label="Email" value={session?.user?.email || "—"} />
          <Row label="Name" value={session?.user?.name || "—"} />
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Meta Connection
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                background: session?.metaAccessToken ? "rgba(74, 222, 128, 0.1)" : "rgba(248, 113, 113, 0.1)",
                color: session?.metaAccessToken ? "#4ade80" : "#f87171",
              }}
            >
              {session?.metaAccessToken ? "Connected" : "Not connected"}
            </span>
          </div>
        </div>
      </div>

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
      {session && (
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
                Disconnect Meta Account
              </span>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                Sign out and remove your Meta access token from this session
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                border: "1px solid rgba(248, 113, 113, 0.3)",
                color: "#f87171",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248, 113, 113, 0.08)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
            >
              <LogOut size={12} />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Model Switcher ──────────────────────────────────────────

function ModelSwitcher({ adAccountId }: { adAccountId: string }) {
  const { data, isLoading } = useSkillPrompt(adAccountId)
  const updateMutation = useUpdateSkillPrompt()
  const [saved, setSaved] = useState(false)

  const currentModel = data?.aiModel || "gpt-4.1-mini"
  const models: AiModelOption[] = data?.availableModels || []

  const handleSelect = (modelId: string) => {
    if (modelId === currentModel) return
    updateMutation.mutate(
      { adAccountId, aiModel: modelId },
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
                disabled={updateMutation.isPending}
                className="rounded-lg px-3.5 py-3 text-left transition-all"
                style={{
                  background: active ? "var(--acc-subtle, rgba(139, 92, 246, 0.08))" : "var(--bg-muted)",
                  border: active ? "1.5px solid var(--acc)" : "1.5px solid transparent",
                  opacity: updateMutation.isPending ? 0.6 : 1,
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

// ── Skill Prompt Editor ─────────────────────────────────────

function SkillPromptEditor({ adAccountId }: { adAccountId: string }) {
  const { data, isLoading } = useSkillPrompt(adAccountId)
  const updateMutation = useUpdateSkillPrompt()
  const [localPrompt, setLocalPrompt] = useState("")
  const [expanded, setExpanded] = useState(false)
  const [saved, setSaved] = useState(false)

  // Sync from server
  useEffect(() => {
    if (data?.prompt) {
      setLocalPrompt(data.prompt)
    }
  }, [data?.prompt])

  const hasChanges = localPrompt !== (data?.prompt || "")

  const handleSave = () => {
    updateMutation.mutate(
      { adAccountId, prompt: localPrompt },
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
          {expanded ? "Collapse" : "View & Edit"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4">
          {isLoading ? (
            <div className="h-40 animate-pulse rounded-md" style={{ background: "var(--bg-muted)" }} />
          ) : (
            <>
              <textarea
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                className="w-full rounded-md p-3 font-mono text-xs leading-relaxed outline-none"
                style={{
                  background: "var(--bg-muted)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  minHeight: "300px",
                  resize: "vertical",
                }}
                spellCheck={false}
              />
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
                    disabled={!hasChanges || updateMutation.isPending}
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-all"
                    style={{
                      background: saved ? "#4ade80" : "var(--acc)",
                      opacity: !hasChanges || updateMutation.isPending ? 0.5 : 1,
                    }}
                  >
                    {saved ? <Check size={12} /> : <Save size={12} />}
                    {saved ? "Saved" : updateMutation.isPending ? "Saving…" : "Save Changes"}
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
