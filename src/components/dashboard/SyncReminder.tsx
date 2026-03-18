"use client"

import { RefreshCw, AlertTriangle } from "lucide-react"
import { useAdAccounts, useSync } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"

const TEN_MINUTES = 10 * 60 * 1000

export function SyncReminder() {
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { data: accountsData } = useAdAccounts()
  const sync = useSync()

  const accounts = accountsData?.data || []
  const selected = accounts.find((a) => a.id === selectedAdAccountId)

  if (!selected) return null

  const syncedAt = selected.syncedAt ? new Date(selected.syncedAt).getTime() : null
  const isStale = syncedAt ? Date.now() - syncedAt > TEN_MINUTES : true
  const neverSynced = !syncedAt

  if (!isStale) return null

  const bg = neverSynced ? "rgba(239, 68, 68, 0.15)" : "rgba(251, 191, 36, 0.12)"
  const border = neverSynced ? "rgba(239, 68, 68, 0.5)" : "rgba(251, 191, 36, 0.4)"
  const textColor = neverSynced ? "#fca5a5" : "#fde68a"
  const btnBg = neverSynced ? "#ef4444" : "#f59e0b"

  return (
    <div
      className="flex items-center justify-between rounded-lg px-4 py-3"
      style={{
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} style={{ color: textColor }} />
        <span className="text-xs font-medium" style={{ color: textColor }}>
          {neverSynced
            ? `"${selected.name}" has never been synced — sync now to pull your campaigns`
            : `Data for "${selected.name}" is over 10 minutes old — sync to get latest metrics`}
        </span>
      </div>
      <button
        onClick={() => sync.mutate(selectedAdAccountId || undefined)}
        disabled={sync.isPending}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold text-white transition-all disabled:opacity-50"
        style={{ background: btnBg }}
      >
        <RefreshCw size={12} className={sync.isPending ? "animate-spin" : ""} />
        {sync.isPending ? "Syncing..." : "Sync Now"}
      </button>
    </div>
  )
}
