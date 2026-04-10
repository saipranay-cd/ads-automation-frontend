"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, RefreshCw } from "lucide-react"
import { SearchSelect } from "@/components/ui/search-select"
import { useGoogleKeywords, useGoogleSync } from "@/hooks/use-google"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import type { DateRange } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { StatusBadge } from "@/components/campaigns/StatusBadge"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorBanner } from "@/components/ui/error-banner"
import { GoogleAuthBanner } from "@/components/layout/GoogleAuthBanner"
import { Pagination } from "@/components/ui/pagination"
import type { GoogleKeywordRow } from "@/types/google-ads"

const statusTabs = ["All", "Enabled", "Paused", "Removed"] as const
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
    case "REMOVED":
      return { status: "error" as const, label: "Removed" }
    default:
      return { status: "info" as const, label: s }
  }
}

function matchTypeBadge(matchType: string) {
  switch (matchType) {
    case "EXACT":
      return { bg: "var(--blue-bg)", text: "var(--blue-text)" }
    case "PHRASE":
      return { bg: "var(--acc-subtle)", text: "var(--acc-text)" }
    case "BROAD":
      return { bg: "var(--bg-muted)", text: "var(--text-secondary)" }
    default:
      return { bg: "var(--bg-muted)", text: "var(--text-tertiary)" }
  }
}

function qualityScoreColor(score: number | null): string {
  if (score == null) return "var(--text-tertiary)"
  if (score >= 7) return "var(--green-text)"
  if (score >= 4) return "var(--amber-text)"
  return "var(--red-text)"
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

const scrollHeaders = ["Match Type", "Quality Score", "CPC Bid", "Status", "Impressions", "Clicks", "CTR", "Conversions"]

export default function GoogleKeywordsPage() {
  const [activeTab, setActiveTab] = useState<StatusTab>("All")
  const [search, setSearch] = useState("")
  const [matchTypeFilter, setMatchTypeFilter] = useState("All")
  const [adGroupFilter, setAdGroupFilter] = useState("All")
  const [campaignFilter, setCampaignFilter] = useState("All")
  const [page, setPage] = useState(1)
  const pageSize = 25
  const [days, setDays] = useState(30)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const selectedGoogleAccountId = useAppStore((s) => s.selectedGoogleAccountId)
  const { data: keywordsData, isLoading, error, refetch } = useGoogleKeywords(selectedGoogleAccountId, days, dateRange)
  const sync = useGoogleSync()

  const keywords = useMemo(() => keywordsData?.data || [], [keywordsData])

  const campaignNames = useMemo(() => {
    const names = new Set(keywords.map((k: GoogleKeywordRow) => k.campaignName).filter(Boolean))
    return Array.from(names).sort()
  }, [keywords])

  const matchTypes = useMemo(() => {
    const types = new Set(keywords.map((k: GoogleKeywordRow) => k.matchType).filter(Boolean))
    return Array.from(types).sort()
  }, [keywords])

  const adGroupNames = useMemo(() => {
    const names = new Set(keywords.map((k: GoogleKeywordRow) => k.adGroupName).filter(Boolean))
    return Array.from(names).sort()
  }, [keywords])

  const filtered = useMemo(() => {
    return keywords.filter((k: GoogleKeywordRow) => {
      const matchTab =
        activeTab === "All" ||
        k.status === activeTab.toUpperCase()
      const matchSearch =
        k.text.toLowerCase().includes(search.toLowerCase()) ||
        k.adGroupName.toLowerCase().includes(search.toLowerCase())
      const matchMatchType = matchTypeFilter === "All" || k.matchType === matchTypeFilter
      const matchAdGroup = adGroupFilter === "All" || k.adGroupName === adGroupFilter
      const matchCampaign = campaignFilter === "All" || k.campaignName === campaignFilter
      return matchTab && matchSearch && matchMatchType && matchAdGroup && matchCampaign
    })
  }, [keywords, activeTab, search, matchTypeFilter, adGroupFilter, campaignFilter])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [filtered.length])

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
        <DateRangePicker days={days} dateRange={dateRange} onPreset={(d) => { setDays(d); setDateRange(undefined) }} onCustomRange={(r) => setDateRange(r)} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
          {matchTypes.length > 1 && (
            <SearchSelect
              value={matchTypeFilter}
              onChange={setMatchTypeFilter}
              options={matchTypes}
              placeholder="All Match Types"
              width="160px"
            />
          )}
          {campaignNames.length > 1 && (
            <SearchSelect
              value={campaignFilter}
              onChange={setCampaignFilter}
              options={campaignNames}
              placeholder="All Campaigns"
            />
          )}
          {adGroupNames.length > 1 && (
            <SearchSelect
              value={adGroupFilter}
              onChange={setAdGroupFilter}
              options={adGroupNames}
              placeholder="All Ad Groups"
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
              placeholder="Search keywords..."
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
      <GoogleAuthBanner error={error || sync.error} />

      {/* Error state (non-auth errors only) */}
      {error && !(error.name === "GoogleAuthExpiredError") && (
        <ErrorBanner
          message={error.message || "Failed to load Google keywords"}
          onRetry={() => refetch()}
        />
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={9} />
      ) : keywords.length > 0 ? (
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
                    Keyword
                  </th>
                  {scrollHeaders.map((h) => (
                    <th key={h} className={thClass} style={{ ...stickyHeaderBg, ...thStyle }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((k, i) => {
                  const badge = statusMap(k.status)
                  const mtBadge = matchTypeBadge(k.matchType)
                  const isLast = i === paginated.length - 1
                  return (
                    <tr
                      key={k.id}
                      className="group transition-colors duration-100"
                      style={{
                        borderBottom: isLast ? "none" : "1px solid var(--border-subtle)",
                      }}
                      onMouseEnter={(e) =>
                        e.currentTarget.style.setProperty("--row-bg", "var(--bg-subtle)")
                      }
                      onMouseLeave={(e) =>
                        e.currentTarget.style.setProperty("--row-bg", "var(--bg-base)")
                      }
                    >
                      {/* Frozen keyword column */}
                      <td
                        className={stickyCol}
                        style={{
                          background: "var(--row-bg, var(--bg-base))",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div className="flex flex-col">
                          <span
                            className="truncate text-[13px] font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {k.text}
                          </span>
                          <span
                            className="text-[11px]"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {k.campaignName ? `${k.campaignName} › ${k.adGroupName}` : k.adGroupName}
                          </span>
                        </div>
                      </td>

                      {/* Match Type */}
                      <td className="px-3 py-2.5">
                        <span
                          className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ background: mtBadge.bg, color: mtBadge.text }}
                        >
                          {k.matchType}
                        </span>
                      </td>

                      {/* Quality Score */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span
                          className="font-mono text-xs font-semibold"
                          style={{ color: qualityScoreColor(k.qualityScore) }}
                        >
                          {k.qualityScore != null ? `${k.qualityScore}/10` : "\u2014"}
                        </span>
                      </td>

                      {/* CPC Bid */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {k.cpcBid > 0 ? fmtCurrency(k.cpcBid) : "\u2014"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5">
                        <StatusBadge {...badge} />
                      </td>

                      {/* Impressions */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {k.impressions > 0 ? fmt(k.impressions) : "\u2014"}
                        </span>
                      </td>

                      {/* Clicks */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {k.clicks > 0 ? fmt(k.clicks) : "\u2014"}
                        </span>
                      </td>

                      {/* CTR */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {k.ctr > 0 ? fmtPercent(k.ctr) : "\u2014"}
                        </span>
                      </td>

                      {/* Conversions */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {k.conversions > 0 ? fmt(k.conversions) : "\u2014"}
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
              icon={Search}
              title="No matching keywords"
              description={search ? "Try a different search term or clear your search" : "No keywords match the selected filter"}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={Search}
          title="No keywords found"
          description="Select a Google Ads account above, then sync to load your keywords"
          actionLabel="Sync Now"
          onAction={() => sync.mutate(selectedGoogleAccountId || undefined)}
        />
      )}
    </div>
  )
}
