"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Megaphone, Download } from "lucide-react"
import { SearchSelect } from "@/components/ui/search-select"
import { CampaignTable } from "@/components/dashboard/CampaignTable"
import { BulkActionBar } from "@/components/dashboard/BulkActionBar"
import { SyncReminder } from "@/components/dashboard/SyncReminder"
import { StatusTabs } from "@/components/dashboard/StatusTabs"
import { SearchInput } from "@/components/dashboard/SearchInput"
import { SyncButton } from "@/components/dashboard/SyncButton"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import { useCampaigns, useSync, useIsSyncing } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { downloadCsv } from "@/lib/export-csv"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorBanner } from "@/components/ui/error-banner"
import type { DateRange } from "@/hooks/use-campaigns"

const statusTabs = ["All", "Active", "Paused", "Archived"] as const
type StatusTab = (typeof statusTabs)[number]

export default function CampaignsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<StatusTab>("All")
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [objectiveFilter, setObjectiveFilter] = useState<string>("All")
  const [days, setDays] = useState(30)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { data: campaignsData, isLoading, error, refetch } = useCampaigns(selectedAdAccountId)
  const sync = useSync()
  const isSyncing = useIsSyncing()

  const campaigns = useMemo(() => campaignsData?.data || [], [campaignsData])

  const uniqueObjectives = useMemo(() => {
    const set = new Set(campaigns.map((c) => c.objective).filter(Boolean))
    return Array.from(set).sort()
  }, [campaigns])

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const matchTab =
        activeTab === "All" ||
        c.status.toLowerCase() === activeTab.toLowerCase()
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
      const matchObjective = objectiveFilter === "All" || c.objective === objectiveFilter
      return matchTab && matchSearch && matchObjective
    })
  }, [campaigns, activeTab, search, objectiveFilter])

  return (
    <div className="flex flex-col gap-4">
      {/* Sync reminder */}
      <SyncReminder />

      {/* Status tabs + DateRangePicker */}
      <div className="flex items-center justify-between">
        <StatusTabs tabs={statusTabs} active={activeTab} onChange={setActiveTab} />
        <DateRangePicker
          days={days}
          dateRange={dateRange}
          onPreset={(d) => { setDays(d); setDateRange(undefined) }}
          onCustomRange={(r) => setDateRange(r)}
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Objective filter */}
        {uniqueObjectives.length > 1 && (
          <SearchSelect
            value={objectiveFilter}
            onChange={setObjectiveFilter}
            options={uniqueObjectives}
            placeholder="All Objectives"
          />
        )}
        <SearchInput value={search} onChange={setSearch} placeholder="Search campaigns..." />
        <SyncButton onClick={() => sync.mutate(selectedAdAccountId || undefined)} isSyncing={isSyncing} disabled={sync.isPending} />
        <button
          onClick={() => {
            const headers = ["Name", "Status", "Objective", "Daily Budget", "Amount Spent", "Leads", "CPL", "Impressions", "Reach", "Link Clicks", "CPM"]
            const rows = filtered.map((c) => [
              c.name,
              c.status,
              c.objective,
              String(c.dailyBudget ?? ""),
              String(c.amountSpent ?? ""),
              String(c.leads ?? ""),
              String(c.costPerLead ?? ""),
              String(c.impressions ?? ""),
              String(c.reach ?? ""),
              String(c.linkClicks ?? ""),
              String(c.cpm ?? ""),
            ])
            downloadCsv("campaigns", headers, rows)
          }}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:bg-[var(--bg-subtle)] active:scale-[0.97] disabled:opacity-50"
          style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
          title="Export CSV"
        >
          <Download size={12} />
          Export
        </button>
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
            onRowClick={(c) => router.push(`/ad-sets?campaignId=${c.id}&campaignName=${encodeURIComponent(c.name)}`)}
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
