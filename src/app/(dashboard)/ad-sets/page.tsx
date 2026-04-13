"use client"

import { Suspense, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Layers, Download } from "lucide-react"
import { SearchSelect } from "@/components/ui/search-select"
import { AdSetTable } from "@/components/dashboard/AdSetTable"
import { SyncReminder } from "@/components/dashboard/SyncReminder"
import { StatusTabs } from "@/components/dashboard/StatusTabs"
import { SearchInput } from "@/components/dashboard/SearchInput"
import { SyncButton } from "@/components/dashboard/SyncButton"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import { useAdSets, useSync, useIsSyncing } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { downloadCsv } from "@/lib/export-csv"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorBanner } from "@/components/ui/error-banner"
import type { DateRange } from "@/hooks/use-campaigns"

const statusTabs = ["All", "Active", "Paused", "Archived"] as const
type StatusTab = (typeof statusTabs)[number]

function AdSetsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const campaignIdFilter = searchParams.get("campaignId")
  const campaignNameFilter = searchParams.get("campaignName")

  const [activeTab, setActiveTab] = useState<StatusTab>("All")
  const [search, setSearch] = useState("")
  const [campaignDropdown, setCampaignDropdown] = useState<string>("All")
  const [days, setDays] = useState(30)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { data: adSetsData, isLoading, error, refetch } = useAdSets(selectedAdAccountId)
  const sync = useSync()
  const isSyncing = useIsSyncing()

  const adSets = useMemo(() => adSetsData?.data || [], [adSetsData])

  const uniqueCampaigns = useMemo(() => {
    const set = new Set(adSets.map((a) => a.campaignName).filter(Boolean))
    return Array.from(set).sort()
  }, [adSets])

  const filtered = useMemo(() => {
    return adSets.filter((a) => {
      const matchTab =
        activeTab === "All" ||
        a.status.toLowerCase() === activeTab.toLowerCase()
      const matchSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.campaignName.toLowerCase().includes(search.toLowerCase())
      const matchCampaignUrl = !campaignIdFilter || a.campaignId === campaignIdFilter
      const matchCampaignDropdown = campaignIdFilter || campaignDropdown === "All" || a.campaignName === campaignDropdown
      return matchTab && matchSearch && matchCampaignUrl && matchCampaignDropdown
    })
  }, [adSets, activeTab, search, campaignIdFilter, campaignDropdown])

  return (
    <div className="flex flex-col gap-4">
      <SyncReminder />

      {/* Breadcrumb when filtered by campaign */}
      {campaignNameFilter && (
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          <Link href="/campaigns" className="hover:underline" style={{ color: "var(--acc)" }}>Campaigns</Link>
          <span style={{ color: "var(--text-tertiary)" }}>/</span>
          <span>{decodeURIComponent(campaignNameFilter)}</span>
          <button onClick={() => router.push("/ad-sets")} className="ml-1 rounded px-1.5 py-0.5 text-[10px]" style={{ background: "var(--bg-muted)", color: "var(--text-tertiary)" }}>
            Clear filter
          </button>
        </div>
      )}

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
        {/* Campaign filter dropdown (only when not URL-filtered) */}
        {!campaignIdFilter && uniqueCampaigns.length > 1 && (
          <SearchSelect
            value={campaignDropdown}
            onChange={setCampaignDropdown}
            options={uniqueCampaigns}
            placeholder="All Campaigns"
          />
        )}
        <SearchInput value={search} onChange={setSearch} placeholder="Search ad sets..." />
        <SyncButton onClick={() => sync.mutate(selectedAdAccountId || undefined)} isSyncing={isSyncing} disabled={sync.isPending} />
        <button
          onClick={() => {
            const headers = ["Name", "Status", "Campaign", "Daily Budget", "Amount Spent", "Leads", "CPL", "Impressions", "Reach", "Clicks", "CTR", "CPC", "CPM"]
            const rows = filtered.map((a) => [
              a.name,
              a.status,
              a.campaignName,
              String(a.dailyBudget ?? ""),
              String(a.amountSpent ?? ""),
              String(a.leads ?? ""),
              String(a.costPerLead ?? ""),
              String(a.impressions ?? ""),
              String(a.reach ?? ""),
              String(a.clicks ?? ""),
              String(a.ctr ?? ""),
              String(a.cpc ?? ""),
              String(a.cpm ?? ""),
            ])
            downloadCsv("ad-sets", headers, rows)
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
          message={error.message || "Failed to load ad sets"}
          onRetry={() => refetch()}
        />
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : adSets.length > 0 ? (
        <>
          <AdSetTable
            adSets={filtered}
            isLoading={isLoading}
            onRowClick={(a) => router.push(`/ads?adSetId=${a.id}&adSetName=${encodeURIComponent(a.name)}`)}
          />

          {/* Filtered empty state */}
          {filtered.length === 0 && (
            <EmptyState
              icon={Layers}
              title="No matching ad sets"
              description={search ? "Try a different search term or clear your search" : "No ad sets match the selected filter"}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={Layers}
          title="No ad sets synced yet"
          description="Select an ad account and sync to see your ad sets here."
          actionLabel="Sync Now"
          onAction={() => sync.mutate(selectedAdAccountId || undefined)}
        />
      )}
    </div>
  )
}

export default function AdSetsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} columns={6} />}>
      <AdSetsPageContent />
    </Suspense>
  )
}
