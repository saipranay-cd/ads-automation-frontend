"use client"

import { useState } from "react"
import { RefreshCw, LogIn } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { CampaignTable } from "@/components/dashboard/CampaignTable"
import { AiInsightCard } from "@/components/dashboard/AiInsightCard"
import { useCampaigns, useDashboard, useSync } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { CampaignTableRow } from "@/types/adsflow"

// ── Mock data (shown when not connected to Meta) ──────
const mockMetrics = [
  {
    label: "Total Spend",
    value: "\u20B912,480",
    delta: 8.3,
    deltaIsGood: false,
    subtext: "vs last week",
  },
  {
    label: "Leads Today",
    value: "247",
    delta: 12.5,
    deltaIsGood: true,
    subtext: "vs yesterday",
  },
  {
    label: "Cost per Lead",
    value: "\u20B9482",
    delta: -5.1,
    deltaIsGood: true,
    subtext: "vs last week",
  },
  {
    label: "Active Campaigns",
    value: "18",
    subtext: "3 paused",
  },
]

const mockCampaigns: CampaignTableRow[] = [
  {
    id: "1", name: "Summer Sale Leads — Mumbai", status: "ACTIVE", objective: "Lead Generation",
    dailyBudget: 4000, costPerLead: 288.5, pacing: 72, leads: 89,
    results: 89, costPerResult: 288.5, amountSpent: 25676, impressions: 42300, reach: 31200, linkClicks: 1240, cpm: 607.0, isActive: true,
  },
  {
    id: "2", name: "Property Enquiry — Delhi NCR", status: "ACTIVE", objective: "Lead Generation",
    dailyBudget: 6000, costPerLead: 478.3, pacing: 91, leads: 42,
    results: 42, costPerResult: 478.3, amountSpent: 20088, impressions: 28500, reach: 21800, linkClicks: 820, cpm: 704.8, isActive: true,
  },
  {
    id: "3", name: "Home Loan Awareness Q2", status: "PAUSED", objective: "Lead Generation",
    dailyBudget: 2500, costPerLead: 612.0, pacing: 0, leads: 15,
    results: 15, costPerResult: 612.0, amountSpent: 9180, impressions: 15200, reach: 12100, linkClicks: 390, cpm: 604.0, isActive: false,
  },
  {
    id: "4", name: "Tech Workshop Signups", status: "ACTIVE", objective: "Lead Generation",
    dailyBudget: 2000, costPerLead: 215.4, pacing: 65, leads: 67,
    results: 67, costPerResult: 215.4, amountSpent: 14432, impressions: 35100, reach: 28400, linkClicks: 1580, cpm: 411.2, isActive: true,
  },
  {
    id: "5", name: "Insurance Leads — Pune", status: "ACTIVE", objective: "Lead Generation",
    dailyBudget: 3200, costPerLead: 340.2, pacing: 88, leads: 53,
    results: 53, costPerResult: 340.2, amountSpent: 18030, impressions: 31800, reach: 25600, linkClicks: 960, cpm: 566.9, isActive: true,
  },
]

const mockInsights = [
  {
    type: "ai" as const,
    tag: "AI Insight",
    title: "Campaign #2 CPL is 42% above average",
    body: "Property Enquiry — Delhi NCR has a high cost per lead. Consider narrowing the audience or testing new creative.",
    ctaLabel: "View Campaign",
  },
  {
    type: "budget" as const,
    tag: "Budget Alert",
    title: "Property Enquiry pacing at 91%",
    body: "This campaign will exhaust its daily budget in ~2 hours. Consider increasing the budget or pausing to redistribute.",
    ctaLabel: "Adjust Budget",
  },
  {
    type: "opportunity" as const,
    tag: "Opportunity",
    title: "Tech Workshop has lowest CPR at \u20B9215",
    body: "This campaign is outperforming others. Consider scaling budget by 30% to capture more leads at this rate.",
    ctaLabel: "Scale Budget",
  },
]

export default function DashboardPage() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.metaAccessToken
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { data: dashboardData } = useDashboard()
  const { data: campaignsData, isLoading: campaignsLoading } = useCampaigns(selectedAdAccountId)
  const sync = useSync()
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set())

  // Use real data if available, otherwise mock
  const hasRealData = !!dashboardData && dashboardData.activeCampaigns > 0
  const campaigns = campaignsData?.data?.length ? campaignsData.data : mockCampaigns

  const metrics = hasRealData
    ? [
        {
          label: "Total Spend",
          value: formatCurrency(dashboardData.totalSpend),
          subtext: "last 7 days",
        },
        {
          label: "Leads Today",
          value: formatNumber(dashboardData.leadsToday),
          subtext: "today",
        },
        {
          label: "Cost per Lead",
          value: formatCurrency(dashboardData.costPerLead),
          subtext: "last 7 days",
        },
        {
          label: "Active Campaigns",
          value: String(dashboardData.activeCampaigns),
          subtext: `${dashboardData.pausedCampaigns} paused`,
        },
      ]
    : mockMetrics

  const visibleInsights = mockInsights.filter(
    (i) => !dismissedInsights.has(i.title)
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Demo banner */}
      {!hasRealData && (
        <div
          className="flex items-center justify-between rounded-lg px-4 py-2.5"
          style={{
            background: "var(--acc-subtle)",
            border: "1px solid var(--acc)",
          }}
        >
          <span className="text-xs" style={{ color: "var(--acc-text)" }}>
            Showing demo data —{" "}
            {isLoggedIn
              ? "click Sync to pull your Meta campaigns"
              : "connect your Meta ad account to see live metrics"}
          </span>
          {isLoggedIn ? (
            <button
              onClick={() => sync.mutate(selectedAdAccountId || undefined)}
              disabled={sync.isPending}
              className="flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium text-white transition-all disabled:opacity-50"
              style={{ background: "var(--acc)" }}
            >
              <RefreshCw size={12} className={sync.isPending ? "animate-spin" : ""} />
              {sync.isPending ? "Syncing..." : "Sync Now"}
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium text-white transition-all"
              style={{ background: "var(--acc)" }}
            >
              <LogIn size={12} />
              Connect Meta
            </Link>
          )}
        </div>
      )}

      {/* Sync error */}
      {sync.isError && (
        <div
          className="flex items-center justify-between rounded-lg px-4 py-2.5"
          style={{
            background: "var(--red-bg)",
            border: "1px solid var(--red-solid)",
          }}
        >
          <span className="text-xs" style={{ color: "var(--red-text)" }}>
            {sync.error?.message || "Sync failed"}
          </span>
          <button
            onClick={() => sync.reset()}
            className="text-xs font-medium"
            style={{ color: "var(--red-text)" }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.label} {...m} isFirst={i === 0} />
        ))}
      </div>

      {/* Two-column layout */}
      <div className="flex gap-5">
        {/* Left: Chart + Table */}
        <div className="flex flex-1 flex-col gap-5">
          {/* Chart placeholder */}
          <div
            className="flex h-[240px] items-center justify-center rounded-lg"
            style={{
              background: "var(--bg-base)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <span
              className="text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              Performance chart — coming soon
            </span>
          </div>

          {/* Campaign table */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Top Campaigns
              </h2>
              <a
                href="/campaigns"
                className="text-xs font-medium"
                style={{ color: "var(--acc)" }}
              >
                View all
              </a>
            </div>
            <CampaignTable
              campaigns={campaigns.slice(0, 5)}
              isLoading={campaignsLoading}
            />
          </div>
        </div>

        {/* Right: AI Insights */}
        <div className="w-[320px] shrink-0">
          <h2
            className="mb-2 text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            AI Insights
          </h2>
          <div className="flex flex-col gap-3">
            {visibleInsights.length > 0 ? (
              visibleInsights.map((insight) => (
                <AiInsightCard
                  key={insight.title}
                  {...insight}
                  onDismiss={() =>
                    setDismissedInsights((prev) =>
                      new Set(prev).add(insight.title)
                    )
                  }
                  onCtaClick={() => {}}
                />
              ))
            ) : (
              <div
                className="flex h-24 items-center justify-center rounded-lg"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  No new insights
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
