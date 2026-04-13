"use client"

import { memo } from "react"
import { RefreshCw } from "lucide-react"

interface SyncButtonProps {
  onClick: () => void
  isSyncing: boolean
  disabled?: boolean
}

export const SyncButton = memo(function SyncButton({ onClick, isSyncing, disabled }: SyncButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isSyncing}
      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:bg-[var(--bg-subtle)] active:scale-[0.97] disabled:opacity-50"
      style={{
        border: "1px solid var(--border-default)",
        color: "var(--text-secondary)",
      }}
    >
      <RefreshCw size={12} className={`transition-transform duration-200 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Syncing..." : "Sync Now"}
    </button>
  )
})
