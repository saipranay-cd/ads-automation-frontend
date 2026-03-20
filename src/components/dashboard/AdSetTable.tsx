"use client"

import { StatusBadge } from "@/components/campaigns/StatusBadge"
import { CampaignToggle } from "@/components/campaigns/CampaignToggle"
import { Skeleton } from "@/components/ui/skeleton"
import type { AdSetTableRow } from "@/types/adsflow"

interface AdSetTableProps {
  adSets: AdSetTableRow[]
  isLoading?: boolean
  onToggle?: (id: string, active: boolean) => void
}

const scrollHeaders = [
  "Status",
  "Daily Budget",
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

function fmt(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n)
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

const stickyCol =
  "sticky left-0 z-20 px-3 py-2.5 min-w-[220px] max-w-[280px]"
const stickyColBg = { background: "var(--bg-base)" }
const stickyHeaderBg = { background: "var(--bg-muted)" }
const thClass =
  "whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.06em]"
const thStyle = {
  color: "var(--text-tertiary)",
  borderBottom: "1px solid var(--border-subtle)",
}

export function AdSetTable({
  adSets,
  isLoading = false,
  onToggle,
}: AdSetTableProps) {
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
              Ad Set
            </th>
            {scrollHeaders.map((h) => (
              <th key={h} className={thClass} style={{ ...stickyHeaderBg, ...thStyle }}>
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
            {adSets.map((row, i) => {
              const badge = statusMap(row.status)
              const isLast = i === adSets.length - 1
              return (
                <tr
                  key={row.id}
                  className="group transition-colors duration-100"
                  style={{
                    borderBottom: isLast ? "none" : "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.setProperty("--row-bg", "var(--bg-subtle)")
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.setProperty("--row-bg", "var(--bg-base)")
                  }}
                >
                  {/* Frozen name column */}
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
                        {row.name}
                      </span>
                      <span
                        className="text-[11px]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {row.campaignName}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-2.5">
                    <StatusBadge {...badge} />
                  </td>

                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>
                      {row.dailyBudget > 0 ? fmtCurrency(row.dailyBudget) : "—"}
                    </span>
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

                  <td className="px-3 py-2.5">
                    <CampaignToggle
                      isActive={row.isActive}
                      onChange={(active) => onToggle?.(row.id, active)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        )}
      </table>
    </div>
  )
}
