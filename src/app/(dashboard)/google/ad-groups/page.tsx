"use client"

import { useState, useMemo } from "react"
import { Search, RefreshCw, FolderOpen } from "lucide-react"
import { useGoogleAdGroups, useGoogleSync } from "@/hooks/use-google"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import type { DateRange } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { StatusBadge } from "@/components/campaigns/StatusBadge"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorBanner } from "@/components/ui/error-banner"
import type { GoogleAdGroupRow } from "@/types/google-ads"

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

const stickyCol =
  "sticky left-0 z-20 px-3 py-2.5 min-w-[220px] max-w-[280px]"
const stickyHeaderBg = { background: "var(--bg-muted)" }
const thClass =
  "whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.06em]"
const thStyle = {
  color: "var(--text-tertiary)",
  borderBottom: "1px solid var(--border-subtle)",
}

const scrollHeaders = ["Campaign", "Status", "CPC Bid", "Impressions", "Clicks", "CTR", "Conversions"]

export default function GoogleAdGroupsPage() {
  const [activeTab, setActiveTab] = useState<StatusTab>("All")
  const [search, setSearch] = useState("")
  const [days, setDays] = useState(30)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const selectedGoogleAccountId = useAppStore((s) => s.selectedGoogleAccountId)
  const { data: adGroupsData, isLoading, error, refetch } = useGoogleAdGroups(selectedGoogleAccountId, days, dateRange)
  const sync = useGoogleSync()

  const adGroups = useMemo(() => adGroupsData?.data || [], [adGroupsData])

  const filtered = useMemo(() => {
    return adGroups.filter((a: GoogleAdGroupRow) => {
      const matchTab =
        activeTab === "All" ||
        a.status === activeTab.toUpperCase()
      const matchSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.campaignName.toLowerCase().includes(search.toLowerCase())
      return matchTab && matchSearch
    })
  }, [adGroups, activeTab, search])

  return (
    <div className="flex flex-col gap-4">
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
            onClick={() => sync.mutate(selectedGoogleAccountId || undefined)}
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
          <DateRangePicker days={days} dateRange={dateRange} onPreset={(d) => { setDays(d); setDateRange(undefined) }} onCustomRange={(r) => setDateRange(r)} />
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
              placeholder="Search ad groups..."
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
          message={error.message || "Failed to load Google ad groups"}
          onRetry={() => refetch()}
        />
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={8} />
      ) : adGroups.length > 0 ? (
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
                    Ad Group
                  </th>
                  {scrollHeaders.map((h) => (
                    <th key={h} className={thClass} style={{ ...stickyHeaderBg, ...thStyle }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => {
                  const badge = statusMap(a.status)
                  const isLast = i === filtered.length - 1
                  return (
                    <tr
                      key={a.id}
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
                      {/* Frozen name column */}
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
                          {a.name}
                        </span>
                      </td>

                      {/* Campaign */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {a.campaignName}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5">
                        <StatusBadge {...badge} />
                      </td>

                      {/* CPC Bid */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {a.cpcBid > 0 ? fmtCurrency(a.cpcBid) : "\u2014"}
                        </span>
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

                      {/* Conversions */}
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                          {a.conversions > 0 ? fmt(a.conversions) : "\u2014"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Filtered empty state */}
          {filtered.length === 0 && (
            <EmptyState
              icon={FolderOpen}
              title="No matching ad groups"
              description={search ? "Try a different search term or clear your search" : "No ad groups match the selected filter"}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={FolderOpen}
          title="No ad groups"
          description="Select a Google Ads account above, then sync to load your ad groups"
          actionLabel="Sync Now"
          onAction={() => sync.mutate(selectedGoogleAccountId || undefined)}
        />
      )}
    </div>
  )
}
