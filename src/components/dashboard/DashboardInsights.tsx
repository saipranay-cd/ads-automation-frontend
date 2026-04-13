"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useProposals } from "@/hooks/use-campaigns"
import { formatCurrency } from "@/lib/utils"

const riskColors = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
} as const

const statusColors: Record<string, string> = {
  pending: "#60a5fa",
  approved: "#22c55e",
  executed: "#a78bfa",
  rejected: "#71717a",
  failed: "#ef4444",
  superseded: "#71717a",
  undone: "#71717a",
}

export function DashboardInsights({ adAccountId }: { adAccountId: string | null }) {
  const { data: proposalsData } = useProposals(adAccountId)
  const proposals = useMemo(() => proposalsData?.data || [], [proposalsData?.data])

  const sorted = useMemo(() => {
    const order: Record<string, number> = {
      pending: 0,
      approved: 1,
      executed: 2,
      failed: 3,
      rejected: 4,
      superseded: 5,
      undone: 5,
    }
    return [...proposals]
      .sort(
        (a, b) =>
          (order[a.status] ?? 9) - (order[b.status] ?? 9) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5)
  }, [proposals])

  return (
    <div className="w-[320px] shrink-0">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          AI Insights
        </h2>
        {proposals.length > 0 && (
          <Link href="/insights" className="text-xs font-medium" style={{ color: "var(--acc)" }}>
            View all
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {sorted.length === 0 ? (
          <div
            className="flex h-24 items-center justify-center rounded-lg"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
          >
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              No insights yet — sync and analyze campaigns to get AI recommendations
            </span>
          </div>
        ) : (
          sorted.map((p) => (
            <Link
              key={p.id}
              href="/insights"
              className="group rounded-lg p-3 transition-colors"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {p.title}
                    </span>
                    <span
                      className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                      style={{
                        background: `${statusColors[p.status] || "#71717a"}20`,
                        color: statusColors[p.status] || "#71717a",
                      }}
                    >
                      {p.status}
                    </span>
                    <div
                      className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: riskColors[p.risk] || "#71717a" }}
                    />
                  </div>
                  <p
                    className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {p.description}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      {p.campaignName}
                    </span>
                    {p.estimatedSavings != null && p.estimatedSavings > 0 && (
                      <span className="text-[10px] font-medium" style={{ color: "#22c55e" }}>
                        Save {formatCurrency(p.estimatedSavings)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
