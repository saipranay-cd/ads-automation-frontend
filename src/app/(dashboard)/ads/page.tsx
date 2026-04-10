"use client"

import { Suspense, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, RefreshCw, FileImage } from "lucide-react"
import { SearchSelect } from "@/components/ui/search-select"
import { AdTable } from "@/components/dashboard/AdTable"
import { SyncReminder } from "@/components/dashboard/SyncReminder"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import { useAds, useSync, useIsSyncing } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
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
        {/* Search */}
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
          <AdTable ads={filtered} isLoading={isLoading} />

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
