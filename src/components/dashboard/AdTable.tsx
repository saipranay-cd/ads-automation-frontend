"use client"

import Image from "next/image"
import { StatusBadge } from "@/components/campaigns/StatusBadge"
import { CampaignToggle } from "@/components/campaigns/CampaignToggle"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination, usePagination } from "@/components/ui/pagination"
import { fmt, fmtCurrencyPrecise as fmtCurrency } from "@/lib/format"
import type { AdTableRow } from "@/types/adsflow"

interface AdTableProps {
  ads: AdTableRow[]
  isLoading?: boolean
  onToggle?: (id: string, active: boolean) => void
  onRowClick?: (id: string) => void
}

const scrollHeaders = [
  "Status",
  "CPL",
  "Leads",
  "Amount Spent",
  "Impressions",
  "Reach",
  "Clicks",
  "CTR",
  "CPC",
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

export function AdTable({
  ads,
  isLoading = false,
  onToggle,
  onRowClick,
}: AdTableProps) {
  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, setCurrentPage } = usePagination(ads, 25)

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
              Ad
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
            {paginatedItems.map((row, i) => {
              const badge = statusMap(row.status)
              const isLast = i === paginatedItems.length - 1
              return (
                <tr
                  key={row.id}
                  className={`group transition-colors duration-100 ${onRowClick ? "cursor-pointer" : ""}`}
                  style={{
                    borderBottom: isLast ? "none" : "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.setProperty("--row-bg", "var(--bg-subtle)")
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.setProperty("--row-bg", "var(--bg-base)")
                  }}
                  onClick={onRowClick ? () => onRowClick(row.id) : undefined}
                >
                  {/* Frozen name column */}
                  <td
                    className={stickyCol}
                    style={{
                      background: "var(--row-bg, var(--bg-base))",
                      borderRight: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {row.thumbnailUrl && (
                        <Image
                          src={row.thumbnailUrl}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 shrink-0 rounded object-cover"
                          style={{ border: "1px solid var(--border-subtle)" }}
                        />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span
                          className="truncate text-[13px] font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {row.name}
                        </span>
                        <span
                          className="text-[11px]"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {row.adSetName}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-2.5">
                    <StatusBadge {...badge} />
                  </td>

                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {row.costPerLead != null ? fmtCurrency(row.costPerLead) : "—"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {row.leads > 0 ? fmt(row.leads) : "—"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {row.amountSpent > 0 ? fmtCurrency(row.amountSpent) : "—"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {row.impressions > 0 ? fmt(row.impressions) : "—"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {row.reach > 0 ? fmt(row.reach) : "—"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {row.clicks > 0 ? fmt(row.clicks) : "—"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {row.ctr > 0 ? `${row.ctr}%` : "—"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {row.cpc > 0 ? fmtCurrency(row.cpc) : "—"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {row.cpm > 0 ? fmtCurrency(row.cpm) : "—"}
                    </span>
                  </td>

                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <CampaignToggle
                      isActive={row.isActive}
                      onChange={(active) => onToggle?.(row.id, active)}
                      campaignName={row.name}
                    />
                  </td>
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
