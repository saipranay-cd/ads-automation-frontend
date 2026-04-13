"use client"

import * as React from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"

interface StaleBadgeProps {
  lastSyncedAt: Date | string | null
  onSync?: () => void
  className?: string
}

function getHoursAgo(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60))
}

function formatAge(hoursAgo: number): string {
  if (hoursAgo < 24) return `${hoursAgo}h ago`
  const days = Math.floor(hoursAgo / 24)
  return `${days}d ago`
}

function StaleBadge({ lastSyncedAt, onSync, className }: StaleBadgeProps) {
  const parsedDate = React.useMemo(() => {
    if (!lastSyncedAt) return null
    return lastSyncedAt instanceof Date
      ? lastSyncedAt
      : new Date(lastSyncedAt)
  }, [lastSyncedAt])

  if (!parsedDate) {
    return (
      <span
        data-slot="stale-badge"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-amber-bg px-2 py-0.5 text-xs font-medium text-amber-text animate-fade-in",
          className
        )}
      >
        <Clock className="size-3" />
        Never synced
        {onSync && (
          <button
            onClick={onSync}
            className="ml-0.5 underline underline-offset-2 hover:no-underline"
          >
            Sync now
          </button>
        )}
      </span>
    )
  }

  const hoursAgo = getHoursAgo(parsedDate)

  if (hoursAgo < 24) return null

  return (
    <span
      data-slot="stale-badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-amber-bg px-2 py-0.5 text-xs font-medium text-amber-text animate-fade-in",
        className
      )}
    >
      <Clock className="size-3" />
      Data from {formatAge(hoursAgo)}
      {onSync && (
        <button
          onClick={onSync}
          className="ml-0.5 underline underline-offset-2 hover:no-underline"
        >
          Sync now
        </button>
      )}
    </span>
  )
}

export { StaleBadge }
export type { StaleBadgeProps }
