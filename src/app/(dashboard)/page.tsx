"use client"

import { LogIn } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { CampaignTable } from "@/components/dashboard/CampaignTable"
import { SyncReminder } from "@/components/dashboard/SyncReminder"
import { useCampaigns, useDashboard } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { formatCurrency, formatNumber } from "@/lib/utils"

export default function DashboardPage() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.metaAccessToken
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { data: dashboardData } = useDashboard()
  const { data: campaignsData, isLoading: campaignsLoading } = useCampaigns(selectedAdAccountId)

  const campaigns = campaignsData?.data || []

  const metrics = dashboardData
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
    : [
        { label: "Total Spend", value: "--", subtext: "last 7 days" },
        { label: "Leads Today", value: "--", subtext: "today" },
        { label: "Cost per Lead", value: "--", subtext: "last 7 days" },
        { label: "Active Campaigns", value: "--", subtext: "no data" },
      ]

  return (
    <div className="flex flex-col gap-6">
      {/* Not logged in banner */}
      {!isLoggedIn && (
        <div
          className="flex items-center justify-between rounded-lg px-4 py-2.5"
          style={{
            background: "var(--acc-subtle)",
            border: "1px solid var(--acc)",
          }}
        >
          <span className="text-xs" style={{ color: "var(--acc-text)" }}>
            Connect your Meta ad account to see live metrics
          </span>
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium text-white transition-all"
            style={{ background: "var(--acc)" }}
          >
            <LogIn size={12} />
            Connect Meta
          </Link>
        </div>
      )}

      {/* Sync reminder — shows when data is stale or never synced */}
      {isLoggedIn && <SyncReminder />}

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
            {campaigns.length > 0 ? (
              <CampaignTable
                campaigns={campaigns.slice(0, 5)}
                isLoading={campaignsLoading}
              />
            ) : (
              <div
                className="flex h-24 items-center justify-center rounded-lg"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {campaignsLoading ? "Loading campaigns..." : "No campaigns — sync your ad account to get started"}
                </span>
              </div>
            )}
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
            <div
              className="flex h-24 items-center justify-center rounded-lg"
              style={{
                background: "var(--bg-base)",
                border: "1px solid var(--border-default)",
              }}
            >
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                No insights yet — sync and analyze campaigns to get AI recommendations
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
