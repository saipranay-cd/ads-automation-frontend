"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Users, UserPlus, Shield, Pencil, Eye, Trash2, Copy,
  RefreshCw, CheckCircle, AlertTriangle, Clock, X,
  Globe, Facebook, Link2,
} from "lucide-react"
import {
  useCurrentOrg, useOrgMembers, useInviteUser, useUpdateMemberRole, useRemoveMember,
  useSyncStatuses, useTriggerSync, useAuditLog,
  type SyncStatusInfo, type AuditLogEntry,
} from "@/hooks/use-org"
import { useIsAdmin } from "@/hooks/use-role"

// ── Helpers ────────────────────────────────────────────

const roleConfig: Record<string, { label: string; icon: typeof Shield; color: string; description: string }> = {
  ADMIN: { label: "Admin", icon: Shield, color: "#a78bfa", description: "Full access. Manage users, OAuth, settings." },
  EDIT: { label: "Editor", icon: Pencil, color: "#fbbf24", description: "Can modify campaigns, execute proposals, trigger syncs." },
  READ: { label: "Viewer", icon: Eye, color: "#60a5fa", description: "View-only. Cannot make changes." },
}

const syncProviderConfig: Record<string, { label: string; icon: typeof Facebook; color: string }> = {
  meta: { label: "Meta Ads", icon: Facebook, color: "#1877F2" },
  google: { label: "Google Ads", icon: Globe, color: "#34A853" },
  crm: { label: "Zoho CRM", icon: Link2, color: "#DC4A38" },
}

const syncStatusColors: Record<string, string> = {
  idle: "var(--text-tertiary)",
  syncing: "#60a5fa",
  success: "#4ade80",
  error: "#f87171",
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never"
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

// ── Main Page ──────────────────────────────────────────

export default function TeamPage() {
  const { data: orgData } = useCurrentOrg()
  const orgs = orgData?.data || []
  const orgId = orgs[0]?.id || null
  const orgName = orgs[0]?.name || "Your Workspace"
  const [activeTab, setActiveTab] = useState<"members" | "sync" | "audit">("members")

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {orgName}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Manage team members, sync status, and activity log
          </p>
        </div>
      </div>

      {!orgId && (
        <div
          className="rounded-lg px-4 py-3 text-xs"
          style={{ background: "var(--amber-bg)", color: "var(--amber-text)" }}
        >
          No organization found. Restart the backend to run the auto-migration.
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: "var(--bg-muted)", width: "fit-content" }}>
        {([
          { key: "members" as const, label: "Members", icon: Users },
          { key: "sync" as const, label: "Sync Status", icon: RefreshCw },
          { key: "audit" as const, label: "Activity Log", icon: Clock },
        ]).map(tab => {
          const active = activeTab === tab.key
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-medium transition-all"
              style={{
                background: active ? "var(--bg-base)" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: active ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
              }}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === "members" && orgId && <MembersTab orgId={orgId} />}
      {activeTab === "sync" && orgId && <SyncTab orgId={orgId} />}
      {activeTab === "audit" && orgId && <AuditTab orgId={orgId} />}
    </div>
  )
}

// ── Members Tab ────────────────────────────────────────

function MembersTab({ orgId }: { orgId: string }) {
  const { data: membersData, isLoading } = useOrgMembers(orgId)
  const inviteMutation = useInviteUser(orgId)
  useUpdateMemberRole(orgId)
  const removeMutation = useRemoveMember(orgId)
  const isAdmin = useIsAdmin()

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteRole, setInviteRole] = useState("READ")
  const [inviteSuccess, setInviteSuccess] = useState<{ message: string; inviteUrl?: string; emailSent?: boolean } | null>(null)

  const members = Array.isArray(membersData?.data) ? membersData.data : []

  function handleInvite() {
    if (!inviteEmail.trim()) return
    inviteMutation.mutate(
      { email: inviteEmail, role: inviteRole, name: inviteName || undefined },
      {
        onSuccess: (data: { data?: { emailSent?: boolean; inviteUrl?: string }; emailSent?: boolean; inviteUrl?: string }) => {
          const result = data?.data || data
          setInviteSuccess({
            message: result.emailSent ? "Invite email sent!" : "Invite created — share the link below",
            inviteUrl: result.inviteUrl,
            emailSent: !!result.emailSent,
          })
          setInviteEmail("")
          setInviteName("")
          setShowInvite(false)
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Invite button + form */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {members.length} member{members.length !== 1 ? "s" : ""}
        </span>
        {isAdmin && (
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-white transition-all"
            style={{ background: "var(--acc)" }}
          >
            <UserPlus size={13} />
            Invite Member
          </button>
        )}
      </div>

      {/* Invite form */}
      {showInvite && (
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            Invite a Team Member
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 rounded-md px-3 py-2 text-xs outline-none"
                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              />
              <input
                type="text"
                placeholder="Name (optional)"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="w-[180px] rounded-md px-3 py-2 text-xs outline-none"
                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {Object.entries(roleConfig).map(([key, cfg]) => {
                  const Icon = cfg.icon
                  const active = inviteRole === key
                  return (
                    <button
                      key={key}
                      onClick={() => setInviteRole(key)}
                      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-all"
                      style={{
                        background: active ? `${cfg.color}15` : "transparent",
                        color: active ? cfg.color : "var(--text-tertiary)",
                        border: active ? `1px solid ${cfg.color}30` : "1px solid transparent",
                      }}
                    >
                      <Icon size={11} />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || inviteMutation.isPending}
                className="ml-auto rounded-md px-4 py-1.5 text-xs font-medium text-white transition-all disabled:opacity-40"
                style={{ background: "var(--acc)" }}
              >
                {inviteMutation.isPending ? "Sending..." : "Send Invite"}
              </button>
            </div>
            <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              {roleConfig[inviteRole]?.description}
            </p>
          </div>
        </div>
      )}

      {/* Invite success */}
      {inviteSuccess && (
        <div
          className="rounded-lg px-4 py-3"
          style={{ background: "rgba(74, 222, 128, 0.08)", border: "1px solid rgba(74, 222, 128, 0.2)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: "#4ade80" }}>
              <CheckCircle size={13} className="inline mr-1.5" />
              {inviteSuccess.message}
            </span>
            <button onClick={() => setInviteSuccess(null)} style={{ color: "#4ade80" }}>
              <X size={13} />
            </button>
          </div>
          {inviteSuccess.inviteUrl && !inviteSuccess.emailSent && (
            <div className="mt-2 flex items-center gap-2">
              <input
                readOnly
                value={inviteSuccess.inviteUrl}
                className="flex-1 rounded-md px-2.5 py-1.5 font-mono text-[10px] outline-none"
                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteSuccess.inviteUrl!)
                }}
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-all"
                style={{ background: "var(--bg-muted)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
              >
                <Copy size={10} />
                Copy
              </button>
            </div>
          )}
        </div>
      )}

      {/* Members list */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
      >
        {isLoading ? (
          <div className="p-8 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>Loading...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
            No team members yet. Click &quot;Invite Member&quot; to add your first.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {members.map((member) => {
              const cfg = roleConfig[member.role] || roleConfig.READ
              const RoleIcon = cfg.icon
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    {member.user.image ? (
                      <Image src={member.user.image} alt="" width={32} height={32} className="h-8 w-8 rounded-full" unoptimized />
                    ) : (
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-medium"
                        style={{ background: `${cfg.color}15`, color: cfg.color }}
                      >
                        {(member.user.name || member.user.email)[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                        {member.user.name || member.user.email}
                        {member.user.isOwner && (
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--acc-subtle)", color: "var(--acc-text)" }}>
                            Owner
                          </span>
                        )}
                      </div>
                      <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                        {member.user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-medium"
                      style={{ background: `${cfg.color}15`, color: cfg.color }}
                    >
                      <RoleIcon size={10} />
                      {cfg.label}
                    </span>
                    {isAdmin && !member.user.isOwner && (
                      <button
                        onClick={() => removeMutation.mutate(member.userId)}
                        className="rounded-md p-1.5 transition-colors"
                        style={{ color: "var(--text-tertiary)" }}
                        title="Remove member"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sync Status Tab ────────────────────────────────────

function SyncTab({ orgId }: { orgId: string }) {
  const { data: syncData } = useSyncStatuses(orgId)
  const triggerSync = useTriggerSync(orgId)

  const statuses: SyncStatusInfo[] = syncData?.data?.statuses || []

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
      >
        {statuses.length === 0 ? (
          <div className="p-8 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
            No sync status data available
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {statuses.map((sync) => {
              const provider = syncProviderConfig[sync.provider] || { label: sync.provider, icon: Globe, color: "#9ca3af" }
              const ProviderIcon = provider.icon
              const statusColor = syncStatusColors[sync.status] || "var(--text-tertiary)"
              return (
                <div key={sync.provider} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ background: `${provider.color}12` }}
                    >
                      <ProviderIcon size={16} style={{ color: provider.color }} />
                    </div>
                    <div>
                      <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                        {provider.label}
                      </div>
                      <div className="text-[10px] flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
                        <span>Last sync: {timeAgo(sync.lastSyncAt)}</span>
                        {sync.lastError && (
                          <span className="text-[10px]" style={{ color: "#f87171" }}>
                            <AlertTriangle size={9} className="inline mr-0.5" />
                            {sync.lastError.slice(0, 40)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize"
                      style={{ background: `${statusColor}15`, color: statusColor }}
                    >
                      {sync.status === "syncing" && <RefreshCw size={9} className="animate-spin" />}
                      {sync.status === "success" && <CheckCircle size={9} />}
                      {sync.status === "error" && <AlertTriangle size={9} />}
                      {sync.status}
                    </span>
                    <button
                      onClick={() => triggerSync.mutate(sync.provider)}
                      disabled={sync.status === "syncing" || triggerSync.isPending}
                      className="rounded-md px-3 py-1.5 text-[10px] font-medium transition-all disabled:opacity-40"
                      style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
                    >
                      Sync Now
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Audit Log Tab ──────────────────────────────────────

function AuditTab({ orgId }: { orgId: string }) {
  const [page, setPage] = useState(1)
  const { data: auditData, isLoading } = useAuditLog(orgId, page)

  const entries: AuditLogEntry[] = auditData?.data?.logs || []
  const total = auditData?.data?.pagination?.total || 0
  const totalPages = auditData?.data?.pagination?.totalPages || Math.ceil(total / 50)

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
      >
        {isLoading ? (
          <div className="p-8 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
            No activity recorded yet
          </div>
        ) : (
          <>
            <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 px-5 py-3">
                  <div
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                    style={{ background: "var(--bg-muted)", color: "var(--text-tertiary)" }}
                  >
                    {(entry.user.name || entry.user.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs" style={{ color: "var(--text-primary)" }}>
                      <span className="font-medium">{entry.user.name || entry.user.email}</span>
                      {" "}
                      <span style={{ color: "var(--text-secondary)" }}>{entry.action}</span>
                      {entry.entityType && (
                        <span className="ml-1 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                          ({entry.entityType}{entry.entityId ? `: ${entry.entityId.slice(0, 12)}...` : ""})
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {timeAgo(entry.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-[10px] font-medium disabled:opacity-30"
                  style={{ color: "var(--text-secondary)" }}
                >
                  ← Prev
                </button>
                <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-[10px] font-medium disabled:opacity-30"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
