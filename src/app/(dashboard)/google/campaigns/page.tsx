"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Megaphone } from "lucide-react"
import { SearchSelect } from "@/components/ui/search-select"
import { useGoogleCampaigns, useGoogleSync } from "@/hooks/use-google"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import type { DateRange } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { StatusBadge } from "@/components/campaigns/StatusBadge"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorBanner } from "@/components/ui/error-banner"
import { GoogleAuthBanner } from "@/components/layout/GoogleAuthBanner"
import { Pagination } from "@/components/ui/pagination"
import { fmtUS as fmt, fmtCurrencyPrecise as fmtCurrency, fmtPercent } from "@/lib/format"
import { googleStatusMap as statusMap } from "@/lib/chart-theme"
import { StatusTabs } from "@/components/dashboard/StatusTabs"
import { SearchInput } from "@/components/dashboard/SearchInput"
import { SyncButton } from "@/components/dashboard/SyncButton"
import type { GoogleCampaignRow } from "@/types/google-ads"

const statusTabs = ["All", "Enabled", "Paused", "Ended", "Removed"] as const
type StatusTab = (typeof statusTabs)[number]

import { stickyCol, stickyHeaderBg, thClass, thStyle } from "@/lib/table-styles"

const scrollHeaders = ["Status", "Type", "Daily Budget", "Impressions", "Clicks", "CTR", "CPC", "Conversions", "Cost/Conv"]

export default function GoogleCampaignsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<StatusTab>("All")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [page, setPage] = useState(1)
  const pageSize = 25
  const [days, setDays] = useState(30)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const selectedGoogleAccountId = useAppStore((s) => s.selectedGoogleAccountId)
  const { data: campaignsData, isLoading, error, refetch } = useGoogleCampaigns(selectedGoogleAccountId, days, dateRange)
  const sync = useGoogleSync()

  const campaigns = useMemo(() => campaignsData?.data || [], [campaignsData])

  const campaignTypes = useMemo(() => {
    const types = new Set(campaigns.map((c: GoogleCampaignRow) => c.campaignType).filter(Boolean))
    return Array.from(types).sort()
  }, [campaigns])

  const filtered = useMemo(() => {
    return campaigns.filter((c: GoogleCampaignRow) => {
      const matchTab =
        activeTab === "All" ||
        c.status === activeTab.toUpperCase()
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === "All" || c.campaignType === typeFilter
      return matchTab && matchSearch && matchType
    })
  }, [campaigns, activeTab, search, typeFilter])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  // Reset page when filters change
  const filteredLen = filtered.length
  useEffect(() => { setPage(1) }, [filteredLen])

  return (
    <div className="flex flex-col gap-4">
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
        {campaignTypes.length > 1 && (
          <SearchSelect
            value={typeFilter}
            onChange={setTypeFilter}
            options={campaignTypes}
            placeholder="All Types"
          />
        )}
        <SearchInput value={search} onChange={setSearch} placeholder="Search campaigns..." />
        <SyncButton onClick={() => sync.mutate(selectedGoogleAccountId || undefined)} isSyncing={sync.isPending} />
      </div>

      {/* Auth expired banner */}
      <GoogleAuthBanner error={error || sync.error} />

      {/* Error state (non-auth errors only) */}
      {error && !(error.name === "GoogleAuthExpiredError") && (
        <ErrorBanner
          message={error.message || "Failed to load Google campaigns"}
          onRetry={() => refetch()}
        />
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={10} />
      ) : campaigns.length > 0 ? (
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
                    Campaign
                  </th>
                  {scrollHeaders.map((h) => (
                    <th key={h} className={thClass} style={{ ...stickyHeaderBg, ...thStyle }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((c, i) => {
                  const badge = statusMap(c.status)
                  const isLast = i === paginated.length - 1
                  return (
                    <tr
                      key={c.id}
                      className="group cursor-pointer transition-colors duration-100"
                      style={{
                        borderBottom: isLast ? "none" : "1px solid var(--border-subtle)",
                      }}
                      onClick={() => router.push(`/google/ad-groups?campaignId=${c.id}&campaignName=${encodeURIComponent(c.name)}`)}
                      onMouseEnter={(e) =>
                        e.currentTarget.style.setProperty("--row-bg", "var(--bg-subtle)")
                      }
                      onMouseLeave={(e) =>
                        e.currentTarget.style.setProperty("--row-bg", "var(--bg-base)")
                      }
                    >
                      {/* Frozen campaign column */}
                      <td
                        className={stickyCol}
                        style={{
                          background: "var(--row-bg, var(--bg-base))",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span
                          className="block truncate text-[13px] font-medium"
                          style={{ color: "var(--text-primary)" }}
                          title={c.name}
                        >
                          {c.name}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5">
                        <StatusBadge {...badge} />
                      </td>

                      {/* Type */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {c.campaignType}
                        </span>
                      </td>

                      {/* Daily Budget */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {c.dailyBudget > 0 ? fmtCurrency(c.dailyBudget) : "\u2014"}
                        </span>
                      </td>

                      {/* Impressions */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {c.impressions > 0 ? fmt(c.impressions) : "\u2014"}
                        </span>
                      </td>

                      {/* Clicks */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {c.clicks > 0 ? fmt(c.clicks) : "\u2014"}
                        </span>
                      </td>

                      {/* CTR */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {c.ctr > 0 ? fmtPercent(c.ctr) : "\u2014"}
                        </span>
                      </td>

                      {/* CPC */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {c.cpc > 0 ? fmtCurrency(c.cpc) : "\u2014"}
                        </span>
                      </td>

                      {/* Conversions */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {c.conversions > 0 ? fmt(c.conversions) : "\u2014"}
                        </span>
                      </td>

                      {/* Cost/Conv */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {c.costPerConversion != null && c.costPerConversion > 0
                            ? fmtCurrency(c.costPerConversion)
                            : "\u2014"}
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
          description="Select a Google Ads account above, then sync to load your campaigns"
          actionLabel="Sync Now"
          onAction={() => sync.mutate(selectedGoogleAccountId || undefined)}
        />
      )}
    </div>
  )
}
