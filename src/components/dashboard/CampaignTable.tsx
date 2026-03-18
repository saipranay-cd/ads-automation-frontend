"use client"

import { StatusBadge } from "@/components/campaigns/StatusBadge"
import { PacingBar } from "@/components/campaigns/PacingBar"
import { CampaignToggle } from "@/components/campaigns/CampaignToggle"
import { Skeleton } from "@/components/ui/skeleton"
import type { CampaignTableRow } from "@/types/adsflow"

interface CampaignTableProps {
  campaigns: CampaignTableRow[]
  isLoading?: boolean
  onToggle?: (id: string, active: boolean) => void
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

export function CampaignTable({
  campaigns,
  isLoading = false,
  onToggle,
}: CampaignTableProps) {
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
        {/* Header */}
        <thead className="sticky top-0 z-30">
          <tr>
            {/* Frozen campaign header */}
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
            {campaigns.map((c, i) => {
              const badge = statusMap(c.status)
              const isLast = i === campaigns.length - 1
              return (
                <tr
                  key={c.id}
                  className="group transition-colors duration-100"
                  style={{
                    borderBottom: isLast
                      ? "none"
                      : "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.setProperty("--row-bg", "var(--bg-subtle)")
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.setProperty("--row-bg", "var(--bg-base)")
                  }}
                >
                  {/* Frozen campaign column */}
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
                  <td className="px-3 py-2.5">
                    <CampaignToggle
                      isActive={c.isActive}
                      onChange={(active) => onToggle?.(c.id, active)}
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
