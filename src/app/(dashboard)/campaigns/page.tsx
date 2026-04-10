"use client"

import { useState, useMemo } from "react"
import { Search, RefreshCw, Megaphone } from "lucide-react"
import { CampaignTable } from "@/components/dashboard/CampaignTable"
import { BulkActionBar } from "@/components/dashboard/BulkActionBar"
import { SyncReminder } from "@/components/dashboard/SyncReminder"
import { useCampaigns, useSync, useIsSyncing } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorBanner } from "@/components/ui/error-banner"

const statusTabs = ["All", "Active", "Paused", "Archived"] as const
type StatusTab = (typeof statusTabs)[number]

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState<StatusTab>("All")
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { data: campaignsData, isLoading, error, refetch } = useCampaigns(selectedAdAccountId)
  const sync = useSync()
  const isSyncing = useIsSyncing()

  const campaigns = useMemo(() => campaignsData?.data || [], [campaignsData])

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const matchTab =
        activeTab === "All" ||
        c.status.toLowerCase() === activeTab.toLowerCase()
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
      return matchTab && matchSearch
    })
  }, [campaigns, activeTab, search])

  return (
    <div className="flex flex-col gap-4">
      {/* Sync reminder */}
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
            disabled={sync.isPending || isSyncing}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50"
            style={{
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Syncing..." : "Sync Now"}
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
              placeholder="Search campaigns..."
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
          message={error.message || "Failed to load campaigns"}
          onRetry={() => refetch()}
        />
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : campaigns.length > 0 ? (
        <>
          <CampaignTable
            campaigns={filtered}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />

          {/* Bulk action bar */}
          <BulkActionBar
            selectedIds={Array.from(selectedIds)}
            entityLevel="campaign"
            onClear={() => setSelectedIds(new Set())}
          />

          {/* Filtered empty state (has campaigns but filter yields nothing) */}
          {filtered.length === 0 && (
            <EmptyState
              icon={Megaphone}
              title="No matching campaigns"
              description={search ? "Try a different search term or clear your search" : "No campaigns match the selected filter"}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={Megaphone}
          title="No campaigns"
          description="Create your first campaign to get started"
          actionLabel="Create Campaign"
        />
      )}
    </div>
  )
}
