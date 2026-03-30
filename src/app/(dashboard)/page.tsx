"use client"

import { useState, useMemo } from "react"
import { LogIn, LayoutDashboard, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { PredictionsPanel } from "@/components/dashboard/PredictionsPanel"
import { CampaignTable } from "@/components/dashboard/CampaignTable"
import { SyncReminder } from "@/components/dashboard/SyncReminder"
import { useCampaigns, useDashboard, useAggregatedMetrics, type DateRange } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { DateRangePicker } from "@/components/ui/DateRangePicker"
import { useTheme } from "@/lib/theme"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorBanner } from "@/components/ui/error-banner"

// Chart colors extracted for theme-awareness.
// Recharts SVG doesn't support CSS variables, so we use JS theme switching.
const CHART_COLORS = {
  obsidian: {
    spend: "#5eead4",
    leads: "#fbbf24",
    grid: "rgba(255,255,255,0.06)",
    tick: "rgba(255,255,255,0.35)",
    legendText: "rgba(255,255,255,0.5)",
    tooltipBg: "rgba(30, 30, 36, 0.95)",
    tooltipBorder: "rgba(255,255,255,0.1)",
    tooltipLabel: "rgba(255,255,255,0.7)",
    tooltipShadow: "0 8px 24px rgba(0,0,0,0.4)",
    dotStroke: "#fff",
  },
  violet: {
    spend: "#0d9488",
    leads: "#d97706",
    grid: "rgba(0,0,0,0.06)",
    tick: "rgba(0,0,0,0.35)",
    legendText: "rgba(0,0,0,0.5)",
    tooltipBg: "rgba(255, 255, 255, 0.95)",
    tooltipBorder: "rgba(0,0,0,0.1)",
    tooltipLabel: "rgba(0,0,0,0.7)",
    tooltipShadow: "0 8px 24px rgba(0,0,0,0.1)",
    dotStroke: "#fff",
  },
} as const

export default function DashboardPage() {
  const { data: session } = useSession()
  const { theme } = useTheme()
  const colors = CHART_COLORS[theme]
  const isLoggedIn = !!session?.metaAccessToken
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const [chartDays, setChartDays] = useState(30)
  const [chartDateRange, setChartDateRange] = useState<DateRange | undefined>(undefined)
  const { data: dashboardData, error: dashboardError, refetch: refetchDashboard } = useDashboard(selectedAdAccountId)
  const { data: campaignsData, isLoading: campaignsLoading, error: campaignsError, refetch: refetchCampaigns } = useCampaigns(selectedAdAccountId, 5)

  const { data: metricsRaw } = useAggregatedMetrics(selectedAdAccountId, chartDays, chartDateRange)
  const campaigns = campaignsData?.data || []

  // Backend returns { data: [...] } but hook types as PerformanceMetric[]
  const metricsData = Array.isArray(metricsRaw) ? metricsRaw : (metricsRaw as any)?.data || []

  const chartData = useMemo(() => {
    if (!metricsData || metricsData.length === 0) return []
    return metricsData.map((d: any) => ({
      date: d.date.slice(5), // "MM-DD"
      spend: d.spend,
      leads: d.leads,
    }))
  }, [metricsData])

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
    <div className="flex flex-col gap-6 overflow-hidden">
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

      {/* Dashboard error */}
      {dashboardError && (
        <ErrorBanner
          message={dashboardError.message || "Failed to load dashboard data"}
          onRetry={() => refetchDashboard()}
        />
      )}

      {/* Predictions (shows only when there are predictions) */}
      <PredictionsPanel />

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <MetricCard key={m.label} {...m} isFirst={i === 0} />
        ))}
      </div>

      {/* Two-column layout (stacks on mobile) */}
      <div className="flex flex-col gap-5 lg:flex-row">
        {/* Left: Chart + Table */}
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {/* Performance chart */}
          <div
            className="rounded-lg px-4 pt-4 pb-2"
            style={{
              background: "var(--bg-base)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                Campaign Performance
              </h3>
              <DateRangePicker
                days={chartDays}
                dateRange={chartDateRange}
                onPreset={(d) => { setChartDays(d); setChartDateRange(undefined) }}
                onCustomRange={(r) => setChartDateRange(r)}
              />
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.spend} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={colors.spend} stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.leads} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={colors.leads} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={colors.grid}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: colors.tick }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    yAxisId="spend"
                    tick={{ fontSize: 10, fill: colors.tick }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                    }
                  />
                  <YAxis
                    yAxisId="leads"
                    orientation="right"
                    tick={{ fontSize: 10, fill: colors.tick }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: colors.tooltipBg,
                      border: `1px solid ${colors.tooltipBorder}`,
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow: colors.tooltipShadow,
                    }}
                    itemStyle={{ padding: "2px 0" }}
                    labelStyle={{ color: colors.tooltipLabel, marginBottom: 4, fontWeight: 500 }}
                    formatter={(value, name) => {
                      if (name === "Spend")
                        return [
                          new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 0,
                          }).format(Number(value)),
                          name,
                        ]
                      return [String(value), name]
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={6}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    formatter={(val) => (
                      <span style={{ color: colors.legendText, marginLeft: 2 }}>
                        {val}
                      </span>
                    )}
                  />
                  <Area
                    yAxisId="spend"
                    type="monotone"
                    dataKey="spend"
                    name="Spend"
                    stroke={colors.spend}
                    strokeWidth={2}
                    fill="url(#gradSpend)"
                    dot={false}
                    activeDot={{ r: 4, stroke: colors.dotStroke, strokeWidth: 2, fill: colors.spend }}
                  />
                  <Area
                    yAxisId="leads"
                    type="monotone"
                    dataKey="leads"
                    name="Leads"
                    stroke={colors.leads}
                    strokeWidth={2}
                    fill="url(#gradLeads)"
                    dot={false}
                    activeDot={{ r: 4, stroke: colors.dotStroke, strokeWidth: 2, fill: colors.leads }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No performance data"
                description="Data appears after your campaigns start running"
                className="h-[240px] py-0"
              />
            )}
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
            {campaignsError ? (
              <ErrorBanner
                message={campaignsError.message || "Failed to load campaigns"}
                onRetry={() => refetchCampaigns()}
              />
            ) : campaignsLoading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : campaigns.length > 0 ? (
              <CampaignTable
                campaigns={campaigns}
                isLoading={campaignsLoading}
              />
            ) : (
              <EmptyState
                icon={LayoutDashboard}
                title="No campaigns yet"
                description="Sync your ad account to see your campaigns here"
                actionLabel="Sync Now"
              />
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
