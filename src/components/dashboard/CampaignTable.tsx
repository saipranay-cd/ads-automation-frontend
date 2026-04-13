"use client"

import { StatusBadge } from "@/components/campaigns/StatusBadge"
import { PacingBar } from "@/components/campaigns/PacingBar"
import { CampaignToggle } from "@/components/campaigns/CampaignToggle"
import { ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination, usePagination } from "@/components/ui/pagination"
import { fmt, fmtCurrencyPrecise as fmtCurrency } from "@/lib/format"
import type { CampaignTableRow } from "@/types/adsflow"

interface CampaignTableProps {
  campaigns: CampaignTableRow[]
  isLoading?: boolean
  onToggle?: (id: string, active: boolean) => void
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  onRowClick?: (campaign: CampaignTableRow) => void
}

const scrollHeaders = [
  "Status",
  "Daily Budget",
  "CPL",
  "Pacing",
  "Leads",
  "Results",
  "CPR",
  "Amount Spent",
  "Impressions",
  "Reach",
  "Link Clicks",
  "CPM",
  "",
]

import { stickyCol, stickyColBg, stickyHeaderBg, thClass, thStyle } from "@/lib/table-styles"

const headerTitles: Record<string, string> = {
  CPL: "Cost Per Lead",
  CPR: "Cost Per Result",
  CPM: "Cost Per Mille (1000 impressions)",
  CTR: "Click-Through Rate",
  CPC: "Cost Per Click",
}

export function CampaignTable({
  campaigns,
  isLoading = false,
  onToggle,
  selectedIds = new Set(),
  onSelectionChange,
  onRowClick,
}: CampaignTableProps) {
  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, setCurrentPage } = usePagination(campaigns, 25)

  const allSelected = campaigns.length > 0 && campaigns.every((c) => selectedIds.has(c.id))
  const someSelected = campaigns.some((c) => selectedIds.has(c.id))

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange?.(new Set())
    } else {
      onSelectionChange?.(new Set(campaigns.map((c) => c.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onSelectionChange?.(next)
  }
  const statusMap = (s: string) => {
    switch (s) {
      case "ACTIVE":
        return { status: "active" as const, label: "Active" }
      case "PAUSED":
        return { status: "paused" as const, label: "Paused" }
      default:
        return { status: "info" as const, label: s }
    }
  }

  return (
    <>
    <div
      className="table-scroll-container relative max-h-[70vh] overflow-auto rounded-lg animate-fade-in"
      style={{
        background: "var(--bg-base)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <table className="w-max min-w-full border-collapse">
        {/* Header */}
        <thead className="sticky top-0 z-30">
          <tr>
            {/* Checkbox header */}
            {onSelectionChange && (
              <th
                className="sticky left-0 z-30 w-10 px-3 py-2.5 text-center"
                style={{
                  ...stickyHeaderBg,
                  ...thStyle,
                }}
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 cursor-pointer rounded"
                  style={{ accentColor: "var(--accent-primary)" }}
                />
              </th>
            )}
            {/* Frozen campaign header */}
            <th
              className={`${onSelectionChange ? "sticky left-10 z-30" : stickyCol + " z-30"} text-left text-[10px] font-medium uppercase tracking-[0.06em] px-3 py-2.5 min-w-[220px] max-w-[280px]`}
              style={{
                ...stickyHeaderBg,
                ...thStyle,
                borderRight: "1px solid var(--border-subtle)",
              }}
            >
              Campaign
            </th>
            {scrollHeaders.map((h) => (
              <th key={h} className={thClass} style={{ ...stickyHeaderBg, ...thStyle }} title={headerTitles[h] || undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>

        {isLoading ? (
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td
                  className={stickyCol}
                  style={{ ...stickyColBg, borderRight: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </td>
                {scrollHeaders.map((_, j) => (
                  <td key={j} className="px-3 py-3">
                    <Skeleton className="h-3.5 w-14" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ) : (
          <tbody>
            {paginatedItems.map((c, i) => {
              const badge = statusMap(c.status)
              const isLast = i === paginatedItems.length - 1
              return (
                <tr
                  key={c.id}
                  className={`group transition-colors duration-150${onRowClick ? " cursor-pointer" : ""}`}
                  style={{
                    borderBottom: isLast
                      ? "none"
                      : "1px solid var(--border-subtle)",
                  }}
                  onClick={() => onRowClick?.(c)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.setProperty("--row-bg", "var(--bg-subtle)")
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.setProperty("--row-bg", "var(--bg-base)")
                  }}
                >
                  {/* Checkbox column */}
                  {onSelectionChange && (
                    <td
                      className="sticky left-0 z-20 w-10 px-3 py-2.5 text-center"
                      style={{ background: "var(--row-bg, var(--bg-base))" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleOne(c.id)}
                        className="h-3.5 w-3.5 cursor-pointer rounded"
                        style={{ accentColor: "var(--accent-primary)" }}
                      />
                    </td>
                  )}
                  {/* Frozen campaign column */}
                  <td
                    className={`${onSelectionChange ? "sticky left-10 z-20" : stickyCol} px-3 py-2.5 min-w-[220px] max-w-[280px]`}
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
                        {c.name}
                      </span>
                      <span
                        className="text-[11px]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {c.objective}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2.5">
                    <StatusBadge {...badge} />
                  </td>

                  {/* Daily Budget */}
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {c.dailyBudget > 0 ? fmtCurrency(c.dailyBudget) : "—"}
                    </span>
                  </td>

                  {/* CPL */}
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {c.costPerLead != null ? fmtCurrency(c.costPerLead) : "—"}
                    </span>
                  </td>

                  {/* Pacing */}
                  <td className="w-28 px-3 py-2.5">
                    {c.status === "ACTIVE" ? (
                      <PacingBar percent={c.pacing} />
                    ) : (
                      <span className="font-mono text-[11px]" style={{ color: "var(--text-disabled)" }}>—</span>
                    )}
                  </td>

                  {/* Leads */}
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {c.leads > 0 ? fmt(c.leads) : "—"}
                    </span>
                  </td>

                  {/* Results */}
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {c.results > 0 ? fmt(c.results) : "—"}
                    </span>
                  </td>

                  {/* CPR */}
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {c.costPerResult != null ? fmtCurrency(c.costPerResult) : "—"}
                    </span>
                  </td>

                  {/* Amount Spent */}
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {c.amountSpent > 0 ? fmtCurrency(c.amountSpent) : "—"}
                    </span>
                  </td>

                  {/* Impressions */}
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {c.impressions > 0 ? fmt(c.impressions) : "—"}
                    </span>
                  </td>

                  {/* Reach */}
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {c.reach > 0 ? fmt(c.reach) : "—"}
                    </span>
                  </td>

                  {/* Link Clicks */}
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {c.linkClicks > 0 ? fmt(c.linkClicks) : "—"}
                    </span>
                  </td>

                  {/* CPM */}
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {c.cpm > 0 ? fmtCurrency(c.cpm) : "—"}
                    </span>
                  </td>

                  {/* Toggle */}
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <CampaignToggle
                      isActive={c.isActive}
                      onChange={(active) => onToggle?.(c.id, active)}
                      campaignName={c.name}
                    />
                  </td>

                  {/* Row click indicator */}
                  {onRowClick && (
                    <td className="px-3 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-tertiary)" }}>
                      <ChevronRight size={14} />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        )}
      </table>
    </div>
    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} pageSize={pageSize} />
    </>
  )
}
