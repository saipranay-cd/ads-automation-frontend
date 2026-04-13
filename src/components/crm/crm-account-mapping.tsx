"use client"

import { useState } from "react"
import { Link2, Unlink, Plus, Loader2 } from "lucide-react"
import { useCrmConnection, useAssignAdAccounts, useUnassignAdAccount } from "@/hooks/use-crm"
import type { CrmConnection } from "@/hooks/use-crm"
import { useAdAccounts } from "@/hooks/use-campaigns"
import { useGoogleAccounts } from "@/hooks/use-google"
import { getCrmProvider } from "@/lib/crm-providers"

interface CrmAccountMappingProps {
  adAccountId: string
  isAdmin: boolean
}

interface AdAccount {
  id: string
  name: string
  platform: "meta" | "google"
}

export function CrmAccountMapping({ adAccountId, isAdmin }: CrmAccountMappingProps) {
  const { data: connData, refetch } = useCrmConnection(adAccountId)
  const { data: metaAccountsData } = useAdAccounts()
  const { data: googleAccountsData } = useGoogleAccounts()
  const assignMutation = useAssignAdAccounts()
  const unassignMutation = useUnassignAdAccount()
  const [assigning, setAssigning] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const connections = (connData?.data || []) as CrmConnection[]
  const activeConnections = connections.filter(c => c.isActive)

  // Build a unified ad account list
  const metaAccounts: AdAccount[] = (metaAccountsData?.data || []).map((a: any) => ({
    id: a.id || a.account_id,
    name: a.name || a.account_id,
    platform: "meta" as const,
  }))
  const googleAccounts: AdAccount[] = (googleAccountsData?.data || []).map((a: any) => ({
    id: a.id,
    name: a.name || a.id,
    platform: "google" as const,
  }))
  const allAccounts = [...metaAccounts, ...googleAccounts]

  if (allAccounts.length <= 1 || activeConnections.length === 0) return null

  // Group connections by nangoConnectionId (same CRM)
  const crmGroups = new Map<string, { provider: string; accountLabel: string | null; connections: CrmConnection[] }>()
  for (const conn of activeConnections) {
    const key = conn.nangoConnectionId || conn.id
    if (!crmGroups.has(key)) {
      crmGroups.set(key, { provider: conn.provider, accountLabel: conn.accountLabel, connections: [] })
    }
    crmGroups.get(key)!.connections.push(conn)
  }

  // Find which ad accounts are already assigned
  const assignedAccountIds = new Set(activeConnections.map(c => c.adAccountId))

  // Unassigned ad accounts
  const unassigned = allAccounts.filter(a => !assignedAccountIds.has(a.id))

  const handleAssign = async (sourceConnection: CrmConnection) => {
    if (selectedIds.size === 0) return
    await assignMutation.mutateAsync({
      sourceConnectionId: sourceConnection.id,
      adAccountIds: Array.from(selectedIds),
    })
    setSelectedIds(new Set())
    setAssigning(false)
    refetch()
  }

  const [confirmUnassign, setConfirmUnassign] = useState<string | null>(null)

  const handleUnassign = async (connectionId: string) => {
    await unassignMutation.mutateAsync(connectionId)
    setConfirmUnassign(null)
    refetch()
  }

  return (
    <div className="space-y-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.06em]" style={{ color: "var(--text-tertiary)" }}>
          CRM — Ad Account Mapping
        </span>
      </div>

      {/* CRM groups */}
      {Array.from(crmGroups.entries()).map(([nangoId, group]) => {
        const providerConfig = getCrmProvider(group.provider as any)
        const providerName = providerConfig?.name || group.provider

        return (
          <div
            key={nangoId}
            className="rounded-md p-3 space-y-2"
            style={{ background: "var(--bg-muted)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold"
                  style={{
                    background: `${providerConfig?.accentColor || '#6c47ff'}18`,
                    color: providerConfig?.accentColor || '#6c47ff',
                  }}
                >
                  {providerName[0]}
                </div>
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  {providerName}
                </span>
                {group.accountLabel && (
                  <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    — {group.accountLabel}
                  </span>
                )}
              </div>

              {isAdmin && unassigned.length > 0 && (
                <button
                  onClick={() => setAssigning(assigning ? false : true)}
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium"
                  style={{ color: "var(--acc)" }}
                >
                  <Plus size={10} />
                  Add account
                </button>
              )}
            </div>

            {/* Assigned ad accounts */}
            <div className="space-y-1">
              {group.connections.map(conn => {
                const account = allAccounts.find(a => a.id === conn.adAccountId)
                const isPrimary = group.connections[0]?.id === conn.id

                return (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between rounded px-2.5 py-1.5"
                    style={{ background: "var(--bg-base)" }}
                  >
                    <div className="flex items-center gap-2">
                      <Link2 size={11} style={{ color: "var(--text-tertiary)" }} />
                      <span className="text-[11px]" style={{ color: "var(--text-primary)" }}>
                        {account?.name || conn.adAccountId}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-medium uppercase"
                        style={{ background: "var(--bg-muted)", color: "var(--text-tertiary)" }}
                      >
                        {account?.platform || "—"}
                      </span>
                      <span className="font-mono text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                        {conn._count?.leads || 0} leads
                      </span>
                    </div>

                    {isAdmin && !isPrimary && (
                      confirmUnassign === conn.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleUnassign(conn.id)}
                            disabled={unassignMutation.isPending}
                            className="rounded px-1.5 py-0.5 text-[9px] font-medium"
                            style={{ background: "rgba(248, 113, 113, 0.15)", color: "#f87171" }}
                          >
                            {unassignMutation.isPending ? <Loader2 size={9} className="animate-spin" /> : "Remove"}
                          </button>
                          <button
                            onClick={() => setConfirmUnassign(null)}
                            className="text-[9px]"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmUnassign(conn.id)}
                          className="text-[10px] flex items-center gap-0.5"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          <Unlink size={10} />
                        </button>
                      )
                    )}
                  </div>
                )
              })}
            </div>

            {/* Assign picker */}
            {assigning && unassigned.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="space-y-1">
                  {unassigned.map(account => (
                    <label
                      key={account.id}
                      className="flex items-center gap-2 rounded px-2.5 py-1.5 cursor-pointer"
                      style={{ background: "var(--bg-base)" }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(account.id)}
                        onChange={e => {
                          const next = new Set(selectedIds)
                          e.target.checked ? next.add(account.id) : next.delete(account.id)
                          setSelectedIds(next)
                        }}
                        className="rounded"
                      />
                      <span className="text-[11px]" style={{ color: "var(--text-primary)" }}>
                        {account.name}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-medium uppercase"
                        style={{ background: "var(--bg-muted)", color: "var(--text-tertiary)" }}
                      >
                        {account.platform}
                      </span>
                    </label>
                  ))}
                </div>

                <button
                  onClick={() => handleAssign(group.connections[0])}
                  disabled={selectedIds.size === 0 || assignMutation.isPending}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
                  style={{
                    background: selectedIds.size > 0 ? "var(--acc)" : "var(--bg-muted)",
                    color: selectedIds.size > 0 ? "#fff" : "var(--text-tertiary)",
                  }}
                >
                  {assignMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                  Assign {selectedIds.size} account{selectedIds.size !== 1 ? "s" : ""}
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Unassigned accounts summary */}
      {unassigned.length > 0 && !assigning && (
        <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
          {unassigned.length} ad account{unassigned.length !== 1 ? "s" : ""} not linked to any CRM
        </p>
      )}
    </div>
  )
}
