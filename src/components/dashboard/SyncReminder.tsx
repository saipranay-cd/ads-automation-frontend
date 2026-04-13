"use client"

import { RefreshCw, AlertTriangle, Check } from "lucide-react"
import { useAdAccounts, useSync, useIsSyncing } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"

const TEN_MINUTES = 10 * 60 * 1000

function isSyncStale(syncedAtStr: string | null | undefined): boolean {
  if (!syncedAtStr) return true
  const syncedAt = new Date(syncedAtStr).getTime()
  return globalThis.Date.now() - syncedAt > TEN_MINUTES
}

export function SyncReminder() {
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { data: accountsData } = useAdAccounts()
  const sync = useSync()
  const isSyncing = useIsSyncing()

  const accounts = accountsData?.data || []
  const selected = accounts.find((a) => a.id === selectedAdAccountId)

  const isStale = isSyncStale(selected?.syncedAt)
  const neverSynced = !selected?.syncedAt

  if (!selected) return null

  // Show syncing state with a subtle indicator
  if (isSyncing) {
    return (
      <div
        className="flex items-center justify-between rounded-lg px-4 py-3"
        style={{
          background: "var(--blue-bg)",
          border: "1px solid color-mix(in srgb, var(--blue-text) 30%, transparent)",
        }}
      >
        <div className="flex items-center gap-2">
          <RefreshCw size={14} className="animate-spin" style={{ color: "var(--blue-text)" }} />
          <span className="animate-pulse text-xs font-medium" style={{ color: "var(--blue-text)" }}>
            Syncing "{selected.name}" in the background...
          </span>
        </div>
      </div>
    )
  }

  if (!isStale) return null

  const bg = neverSynced ? "var(--red-bg)" : "var(--amber-bg)"
  const border = neverSynced
    ? "color-mix(in srgb, var(--red-text) 50%, transparent)"
    : "color-mix(in srgb, var(--amber-text) 40%, transparent)"
  const textColor = neverSynced ? "var(--red-text)" : "var(--amber-text)"
  const btnBg = neverSynced ? "var(--red-text)" : "var(--amber-text)"

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
        <RefreshCw size={12} />
        Sync Now
      </button>
    </div>
  )
}
