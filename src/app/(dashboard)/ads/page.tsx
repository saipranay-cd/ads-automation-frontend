"use client"

import { Suspense, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { FileImage, Download } from "lucide-react"
import { SearchSelect } from "@/components/ui/search-select"
import { AdTable } from "@/components/dashboard/AdTable"
import { AdDetailDrawer } from "@/components/dashboard/AdDetailDrawer"
import { SyncReminder } from "@/components/dashboard/SyncReminder"
import { StatusTabs } from "@/components/dashboard/StatusTabs"
import { SearchInput } from "@/components/dashboard/SearchInput"
import { SyncButton } from "@/components/dashboard/SyncButton"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import { useAds, useSync, useIsSyncing } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { downloadCsv } from "@/lib/export-csv"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorBanner } from "@/components/ui/error-banner"
import type { DateRange } from "@/hooks/use-campaigns"

const statusTabs = ["All", "Active", "Paused", "Archived"] as const
type StatusTab = (typeof statusTabs)[number]

function AdsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const adSetIdFilter = searchParams.get("adSetId")
  const adSetNameFilter = searchParams.get("adSetName")

  const [activeTab, setActiveTab] = useState<StatusTab>("All")
  const [search, setSearch] = useState("")
  const [adSetDropdown, setAdSetDropdown] = useState<string>("All")
  const [days, setDays] = useState(30)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null)
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { data: adsData, isLoading, error, refetch } = useAds(selectedAdAccountId)
  const sync = useSync()
  const isSyncing = useIsSyncing()

  const ads = useMemo(() => adsData?.data || [], [adsData])

  const uniqueAdSets = useMemo(() => {
    const set = new Set(ads.map((a) => a.adSetName).filter(Boolean))
    return Array.from(set).sort()
  }, [ads])

  const filtered = useMemo(() => {
    return ads.filter((a) => {
      const matchTab =
        activeTab === "All" ||
        a.status.toLowerCase() === activeTab.toLowerCase()
      const matchSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.adSetName.toLowerCase().includes(search.toLowerCase())
      const matchAdSetUrl = !adSetIdFilter || a.adSetId === adSetIdFilter
      const matchAdSetDropdown = adSetIdFilter || adSetDropdown === "All" || a.adSetName === adSetDropdown
      return matchTab && matchSearch && matchAdSetUrl && matchAdSetDropdown
    })
  }, [ads, activeTab, search, adSetIdFilter, adSetDropdown])

  return (
    <div className="flex flex-col gap-4">
      <SyncReminder />

      {/* Breadcrumb when filtered by ad set */}
      {adSetNameFilter && (
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          <Link href="/ad-sets" className="hover:underline" style={{ color: "var(--acc)" }}>Ad Sets</Link>
          <span style={{ color: "var(--text-tertiary)" }}>/</span>
          <span>{decodeURIComponent(adSetNameFilter)}</span>
          <button onClick={() => router.push("/ads")} className="ml-1 rounded px-1.5 py-0.5 text-[10px]" style={{ background: "var(--bg-muted)", color: "var(--text-tertiary)" }}>
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
        {/* Ad Set filter dropdown (only when not URL-filtered) */}
        {!adSetIdFilter && uniqueAdSets.length > 1 && (
          <SearchSelect
            value={adSetDropdown}
            onChange={setAdSetDropdown}
            options={uniqueAdSets}
            placeholder="All Ad Sets"
          />
        )}
        <SearchInput value={search} onChange={setSearch} placeholder="Search ads..." />
        <SyncButton onClick={() => sync.mutate(selectedAdAccountId || undefined)} isSyncing={isSyncing} disabled={sync.isPending} />
        <button
          onClick={() => {
            const headers = ["Name", "Status", "Ad Set", "Amount Spent", "Leads", "CPL", "Impressions", "Reach", "Clicks", "CTR", "CPC", "CPM"]
            const rows = filtered.map((a) => [
              a.name,
              a.status,
              a.adSetName,
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
            downloadCsv("ads", headers, rows)
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
          message={error.message || "Failed to load ads"}
          onRetry={() => refetch()}
        />
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : ads.length > 0 ? (
        <>
          <AdTable ads={filtered} isLoading={isLoading} onRowClick={setSelectedAdId} />

          {/* Filtered empty state */}
          {filtered.length === 0 && (
            <EmptyState
              icon={FileImage}
              title="No matching ads"
              description={search ? "Try a different search term or clear your search" : "No ads match the selected filter"}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={FileImage}
          title="No ads synced yet"
          description="Select an ad account and sync to see your ads here."
          actionLabel="Sync Now"
          onAction={() => sync.mutate(selectedAdAccountId || undefined)}
        />
      )}

      <AdDetailDrawer adId={selectedAdId} onClose={() => setSelectedAdId(null)} />
    </div>
  )
}

export default function AdsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} columns={6} />}>
      <AdsPageContent />
    </Suspense>
  )
}
