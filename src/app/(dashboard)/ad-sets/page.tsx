"use client"

import { useState, useMemo } from "react"
import { Search, RefreshCw, Layers } from "lucide-react"
import { AdSetTable } from "@/components/dashboard/AdSetTable"
import { SyncReminder } from "@/components/dashboard/SyncReminder"
import { useAdSets, useSync } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorBanner } from "@/components/ui/error-banner"

const statusTabs = ["All", "Active", "Paused", "Archived"] as const
type StatusTab = (typeof statusTabs)[number]

export default function AdSetsPage() {
  const [activeTab, setActiveTab] = useState<StatusTab>("All")
  const [search, setSearch] = useState("")
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { data: adSetsData, isLoading, error, refetch } = useAdSets(selectedAdAccountId)
  const sync = useSync()

  const adSets = adSetsData?.data || []

  const filtered = useMemo(() => {
    return adSets.filter((a) => {
      const matchTab =
        activeTab === "All" ||
        a.status.toLowerCase() === activeTab.toLowerCase()
      const matchSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.campaignName.toLowerCase().includes(search.toLowerCase())
      return matchTab && matchSearch
    })
  }, [adSets, activeTab, search])

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
              placeholder="Search ad sets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-text-tertiary"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <ErrorBanner
          message={error.message || "Failed to load ad sets"}
          onRetry={() => refetch()}
        />
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : adSets.length > 0 ? (
        <>
          <AdSetTable adSets={filtered} isLoading={isLoading} />

          {/* Filtered empty state */}
          {filtered.length === 0 && (
            <EmptyState
              icon={Layers}
              title="No matching ad sets"
              description={search ? "Try adjusting your search" : "No ad sets match this filter"}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={Layers}
          title="No ad sets"
          description="Ad sets will appear here after you sync your ad account"
          actionLabel="Sync Now"
          onAction={() => sync.mutate(selectedAdAccountId || undefined)}
        />
      )}
    </div>
  )
}
