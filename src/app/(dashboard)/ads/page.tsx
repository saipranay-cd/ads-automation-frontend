"use client"

import { useState, useMemo } from "react"
import { Search, RefreshCw } from "lucide-react"
import { AdTable } from "@/components/dashboard/AdTable"
import { SyncReminder } from "@/components/dashboard/SyncReminder"
import { useAds, useSync } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"

const statusTabs = ["All", "Active", "Paused", "Archived"] as const
type StatusTab = (typeof statusTabs)[number]

export default function AdsPage() {
  const [activeTab, setActiveTab] = useState<StatusTab>("All")
  const [search, setSearch] = useState("")
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { data: adsData, isLoading } = useAds(selectedAdAccountId)
  const sync = useSync()

  const ads = adsData?.data || []

  const filtered = useMemo(() => {
    return ads.filter((a) => {
      const matchTab =
        activeTab === "All" ||
        a.status.toLowerCase() === activeTab.toLowerCase()
      const matchSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.adSetName.toLowerCase().includes(search.toLowerCase())
      return matchTab && matchSearch
    })
  }, [ads, activeTab, search])

  return (
    <div className="flex flex-col gap-4">
      <SyncReminder />

      {/* Filter bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background:
                  activeTab === tab
                    ? "var(--acc-subtle)"
                    : "transparent",
                color:
                  activeTab === tab
                    ? "var(--acc-text)"
                    : "var(--text-secondary)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => sync.mutate(selectedAdAccountId || undefined)}
            disabled={sync.isPending}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50"
            style={{
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            <RefreshCw size={12} className={sync.isPending ? "animate-spin" : ""} />
            {sync.isPending ? "Syncing..." : "Sync"}
          </button>
          <div
            className="flex w-[220px] items-center gap-2 rounded-md px-3 py-1.5"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-default)",
            }}
          >
            <Search size={13} style={{ color: "var(--text-tertiary)" }} />
            <input
              type="text"
              placeholder="Search ads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-text-tertiary"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {ads.length > 0 && (
        <AdTable ads={filtered} isLoading={isLoading} />
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg py-12"
          style={{
            background: "var(--bg-base)",
            border: "1px solid var(--border-default)",
          }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            No ads found
          </span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {search ? "Try adjusting your search" : "Sync your Meta ad account to get started"}
          </span>
        </div>
      )}
    </div>
  )
}
