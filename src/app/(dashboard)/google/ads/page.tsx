"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { FileImage } from "lucide-react"
import { StatusTabs } from "@/components/dashboard/StatusTabs"
import { SearchInput } from "@/components/dashboard/SearchInput"
import { SyncButton } from "@/components/dashboard/SyncButton"
import { SearchSelect } from "@/components/ui/search-select"
import { useGoogleAds, useGoogleSync } from "@/hooks/use-google"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import type { DateRange } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { StatusBadge } from "@/components/campaigns/StatusBadge"
import { GoogleAdDetailDrawer } from "@/components/dashboard/GoogleAdDetailDrawer"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorBanner } from "@/components/ui/error-banner"
import { GoogleAuthBanner } from "@/components/layout/GoogleAuthBanner"
import { Pagination } from "@/components/ui/pagination"
import { fmtUS as fmt, fmtCurrencyPrecise as fmtCurrency, fmtPercent } from "@/lib/format"
import { googleStatusMap as statusMap } from "@/lib/chart-theme"
import type { GoogleAdRow } from "@/types/google-ads"

const statusTabs = ["All", "Enabled", "Paused", "Removed"] as const
type StatusTab = (typeof statusTabs)[number]

import { stickyCol, stickyHeaderBg, thClass, thStyle } from "@/lib/table-styles"

const scrollHeaders = ["Type", "Ad Group", "Status", "Impressions", "Clicks", "CTR", "CPC"]

export default function GoogleAdsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} columns={8} />}>
      <GoogleAdsContent />
    </Suspense>
  )
}

function GoogleAdsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const adGroupIdFilter = searchParams.get("adGroupId")
  const adGroupNameFilter = searchParams.get("adGroupName")

  const [activeTab, setActiveTab] = useState<StatusTab>("All")
  const [search, setSearch] = useState("")
  const [adGroupFilter, setAdGroupFilter] = useState("All")
  const [page, setPage] = useState(1)
  const pageSize = 25
  const [days, setDays] = useState(30)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [selectedAd, setSelectedAd] = useState<GoogleAdRow | null>(null)
  const selectedGoogleAccountId = useAppStore((s) => s.selectedGoogleAccountId)
  const { data: adsData, isLoading, error, refetch } = useGoogleAds(selectedGoogleAccountId, days, dateRange)
  const sync = useGoogleSync()

  const ads = useMemo(() => adsData?.data || [], [adsData])

  const adGroupNames = useMemo(() => {
    const names = new Set(ads.map((a: GoogleAdRow) => a.adGroupName).filter(Boolean))
    return Array.from(names).sort()
  }, [ads])

  const filtered = useMemo(() => {
    return ads.filter((a: GoogleAdRow) => {
      const matchTab =
        activeTab === "All" ||
        a.status === activeTab.toUpperCase()
      const headline = a.headlines?.[0] || ""
      const matchSearch =
        headline.toLowerCase().includes(search.toLowerCase()) ||
        a.adGroupName.toLowerCase().includes(search.toLowerCase())
      const matchAdGroup = adGroupIdFilter
        ? a.adGroupId === adGroupIdFilter
        : adGroupFilter === "All" || a.adGroupName === adGroupFilter
      return matchTab && matchSearch && matchAdGroup
    })
  }, [ads, activeTab, search, adGroupIdFilter, adGroupFilter])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  // Reset page when filters change
  const filteredLen = filtered.length
  useEffect(() => { setPage(1) }, [filteredLen])

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb when filtered by ad group */}
      {adGroupNameFilter && (
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          <Link href="/google/ad-groups" className="hover:underline" style={{ color: "var(--acc)" }}>Ad Groups</Link>
          <span style={{ color: "var(--text-tertiary)" }}>/</span>
          <span>{decodeURIComponent(adGroupNameFilter)}</span>
          <button onClick={() => router.push("/google/ads")} className="ml-1 rounded px-1.5 py-0.5 text-[10px]" style={{ background: "var(--bg-muted)", color: "var(--text-tertiary)" }}>
            Clear filter
          </button>
        </div>
      )}

      {/* Status tabs + DateRangePicker */}
      <div className="flex items-center justify-between">
        <StatusTabs tabs={statusTabs} active={activeTab} onChange={setActiveTab} />
        <DateRangePicker days={days} dateRange={dateRange} onPreset={(d) => { setDays(d); setDateRange(undefined) }} onCustomRange={(r) => setDateRange(r)} />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {!adGroupIdFilter && adGroupNames.length > 1 && (
          <SearchSelect
            value={adGroupFilter}
            onChange={setAdGroupFilter}
            options={adGroupNames}
            placeholder="All Ad Groups"
          />
        )}
        <SearchInput value={search} onChange={setSearch} placeholder="Search ads..." />
        <SyncButton onClick={() => sync.mutate(selectedGoogleAccountId || undefined)} isSyncing={sync.isPending} />
      </div>

      {/* Auth expired banner */}
      <GoogleAuthBanner error={error || sync.error} />

      {/* Error state (non-auth errors only) */}
      {error && !(error.name === "GoogleAuthExpiredError") && (
        <ErrorBanner
          message={error.message || "Failed to load Google ads"}
          onRetry={() => refetch()}
        />
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={8} />
      ) : ads.length > 0 ? (
        <>
          <div
            className="relative max-h-[70vh] overflow-auto rounded-lg"
            style={{
              background: "var(--bg-base)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <table className="w-max min-w-full border-collapse">
              <thead className="sticky top-0 z-30">
                <tr>
                  <th
                    className={`${stickyCol} z-30 text-left text-[10px] font-medium uppercase tracking-[0.06em]`}
                    style={{
                      ...stickyHeaderBg,
                      ...thStyle,
                      borderRight: "1px solid var(--border-subtle)",
                    }}
                  >
                    Headlines
                  </th>
                  {scrollHeaders.map((h) => (
                    <th key={h} className={thClass} style={{ ...stickyHeaderBg, ...thStyle }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((a, i) => {
                  const badge = statusMap(a.status)
                  const isLast = i === paginated.length - 1
                  const headline = a.headlines?.[0] || "Untitled"
                  return (
                    <tr
                      key={a.id}
                      className="group cursor-pointer transition-colors duration-100"
                      style={{
                        borderBottom: isLast ? "none" : "1px solid var(--border-subtle)",
                      }}
                      onMouseEnter={(e) =>
                        e.currentTarget.style.setProperty("--row-bg", "var(--bg-subtle)")
                      }
                      onMouseLeave={(e) =>
                        e.currentTarget.style.setProperty("--row-bg", "var(--bg-base)")
                      }
                      onClick={() => setSelectedAd(a)}
                    >
                      {/* Frozen headline column */}
                      <td
                        className={stickyCol}
                        style={{
                          background: "var(--row-bg, var(--bg-base))",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span
                          className="truncate text-[13px] font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {headline}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {a.adType}
                        </span>
                      </td>

                      {/* Ad Group */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {a.adGroupName}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5">
                        <StatusBadge {...badge} />
                      </td>

                      {/* Impressions */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {a.impressions > 0 ? fmt(a.impressions) : "\u2014"}
                        </span>
                      </td>

                      {/* Clicks */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {a.clicks > 0 ? fmt(a.clicks) : "\u2014"}
                        </span>
                      </td>

                      {/* CTR */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {a.ctr > 0 ? fmtPercent(a.ctr) : "\u2014"}
                        </span>
                      </td>

                      {/* CPC */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {a.cpc > 0 ? fmtCurrency(a.cpc) : "\u2014"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={pageSize} />

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
          title="No ads"
          description="Select a Google Ads account above, then sync to load your ads"
          actionLabel="Sync Now"
          onAction={() => sync.mutate(selectedGoogleAccountId || undefined)}
        />
      )}

      <GoogleAdDetailDrawer
        adId={selectedAd?.id ?? null}
        initial={selectedAd}
        days={days}
        dateRange={dateRange}
        onClose={() => setSelectedAd(null)}
      />
    </div>
  )
}
