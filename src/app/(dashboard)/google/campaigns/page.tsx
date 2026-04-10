"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, RefreshCw, Megaphone } from "lucide-react"
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
import type { GoogleCampaignRow } from "@/types/google-ads"

const statusTabs = ["All", "Enabled", "Paused", "Ended", "Removed"] as const
type StatusTab = (typeof statusTabs)[number]

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US").format(n)
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n)
}

function fmtPercent(n: number): string {
  return `${n.toFixed(2)}%`
}

function statusMap(s: string) {
  switch (s) {
    case "ENABLED":
      return { status: "active" as const, label: "Enabled" }
    case "PAUSED":
      return { status: "paused" as const, label: "Paused" }
    case "ENDED":
      return { status: "info" as const, label: "Ended" }
    case "REMOVED":
      return { status: "error" as const, label: "Removed" }
    default:
      return { status: "info" as const, label: s }
  }
}

const stickyCol =
  "sticky left-0 z-20 px-3 py-2.5 min-w-[220px] max-w-[280px]"
const stickyHeaderBg = { background: "var(--bg-muted)" }
const thClass =
  "whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.06em]"
const thStyle = {
  color: "var(--text-tertiary)",
  borderBottom: "1px solid var(--border-subtle)",
}

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
        {campaignTypes.length > 1 && (
          <SearchSelect
            value={typeFilter}
            onChange={setTypeFilter}
            options={campaignTypes}
            placeholder="All Types"
          />
        )}
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
        <button
          onClick={() => sync.mutate(selectedGoogleAccountId || undefined)}
          disabled={sync.isPending}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50"
          style={{
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
        >
          <RefreshCw size={12} className={sync.isPending ? "animate-spin" : ""} />
          {sync.isPending ? "Syncing..." : "Sync Now"}
        </button>
      </div>

      {/* Auth expired banner */}
      <GoogleAuthBanner error={error} />

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
