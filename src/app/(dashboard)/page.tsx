"use client";

import { useState, useMemo } from "react";
import {
  LogIn,
  LayoutDashboard,
  BarChart3,
  Globe,
  Facebook,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PredictionsPanel } from "@/components/dashboard/PredictionsPanel";
import { CampaignTable } from "@/components/dashboard/CampaignTable";
import { SyncReminder } from "@/components/dashboard/SyncReminder";
import {
  useCampaigns,
  useDashboard,
  useAggregatedMetrics,
  useProposals,
  type DateRange,
} from "@/hooks/use-campaigns";
import {
  useGoogleDashboard,
  useGoogleAuthStatus,
  useGoogleAnalyticsMetrics,
  useGoogleCampaigns,
} from "@/hooks/use-google";
import { useAppStore } from "@/lib/store";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { useTheme } from "@/lib/theme";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";

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
} as const;

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const colors = CHART_COLORS[theme];
  const isLoggedIn = isAuthenticated;
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId);
  const selectedGoogleAccountId = useAppStore((s) => s.selectedGoogleAccountId);
  const [chartDays, setChartDays] = useState(30);
  const [chartDateRange, setChartDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [platformFilter, setPlatformFilter] = useState<
    "all" | "meta" | "google"
  >("all");
  const {
    data: dashboardData,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboard(selectedAdAccountId);
  const { data: googleDashboard } = useGoogleDashboard(selectedGoogleAccountId);
  useGoogleAuthStatus();
  const {
    data: campaignsData,
    isLoading: campaignsLoading,
    error: campaignsError,
    refetch: refetchCampaigns,
  } = useCampaigns(selectedAdAccountId);
  const { data: googleCampaignsData, isLoading: googleCampaignsLoading } =
    useGoogleCampaigns(selectedGoogleAccountId);

  const { data: metricsRaw } = useAggregatedMetrics(
    selectedAdAccountId,
    chartDays,
    chartDateRange,
  );
  const { data: googleMetricsRaw } = useGoogleAnalyticsMetrics(
    selectedGoogleAccountId,
    chartDays,
    chartDateRange,
  );
  const allCampaigns = useMemo(
    () => campaignsData?.data || [],
    [campaignsData?.data],
  );
  const allGoogleCampaigns = useMemo(
    () => googleCampaignsData?.data || [],
    [googleCampaignsData?.data],
  );

  // Normalized campaign type for unified table
  interface UnifiedCampaign {
    id: string;
    name: string;
    platform: "meta" | "google";
    type: string;
    status: string;
    isActive: boolean;
    dailyBudget: number;
    spend: number;
    results: number;
    resultLabel: string;
    cpr: number | null;
    impressions: number;
    clicks: number;
    cpc: number;
  }

  // Filter to campaigns with activity, sorted by spend
  const metaCampaigns = useMemo(() => {
    const active = allCampaigns.filter(
      (c) => c.amountSpent > 0 || c.leads > 0 || c.impressions > 0,
    );
    const sorted = active.length > 0 ? active : allCampaigns;
    return [...sorted]
      .sort((a, b) => b.amountSpent - a.amountSpent)
      .slice(0, 5);
  }, [allCampaigns]);

  // Unified campaigns for "All Platforms" and "Google" views
  const unifiedCampaigns = useMemo((): UnifiedCampaign[] => {
    const meta: UnifiedCampaign[] = allCampaigns.map((c) => ({
      id: `meta-${c.id}`,
      name: c.name,
      platform: "meta",
      type: c.objective || "OUTCOME_LEADS",
      status: c.status,
      isActive: c.status === "ACTIVE",
      dailyBudget: c.dailyBudget,
      spend: c.amountSpent,
      results: c.leads,
      resultLabel: "Leads",
      cpr: c.costPerLead,
      impressions: c.impressions,
      clicks: c.linkClicks || 0,
      cpc: c.linkClicks > 0 ? c.amountSpent / c.linkClicks : 0,
    }));
    const google: UnifiedCampaign[] = allGoogleCampaigns.map((c) => ({
      id: `google-${c.id}`,
      name: c.name,
      platform: "google",
      type: c.campaignType || "SEARCH",
      status: c.status === "ENABLED" ? "ACTIVE" : c.status,
      isActive: c.status === "ENABLED",
      dailyBudget: c.dailyBudget,
      spend: c.spend,
      results: c.conversions,
      resultLabel: "Conv",
      cpr: c.costPerConversion,
      impressions: c.impressions,
      clicks: c.clicks,
      cpc: c.cpc,
    }));
    const all = [...meta, ...google];
    const active = all.filter(
      (c) => c.spend > 0 || c.results > 0 || c.impressions > 0,
    );
    const sorted = active.length > 0 ? active : all;
    return [...sorted].sort((a, b) => b.spend - a.spend).slice(0, 5);
  }, [allCampaigns, allGoogleCampaigns]);

  const chartData = useMemo(() => {
    const showMeta = platformFilter === "all" || platformFilter === "meta";
    const showGoogle = platformFilter === "all" || platformFilter === "google";

    const metaData = showMeta ? metricsRaw || [] : [];
    const googleData = showGoogle ? googleMetricsRaw || [] : [];

    // Merge by date
    const byDate = new Map<string, { spend: number; leads: number }>();
    for (const d of metaData) {
      const key = d.date.slice(0, 10);
      const existing = byDate.get(key) || { spend: 0, leads: 0 };
      existing.spend += d.spend;
      existing.leads += d.leads;
      byDate.set(key, existing);
    }
    for (const d of googleData) {
      const key = typeof d.date === "string" ? d.date.slice(0, 10) : "";
      if (!key) continue;
      const existing = byDate.get(key) || { spend: 0, leads: 0 };
      existing.spend += d.spend ?? 0;
      existing.leads += d.conversions ?? 0;
      byDate.set(key, existing);
    }

    if (byDate.size === 0) return [];
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, agg]) => ({
        date: date.slice(5), // "MM-DD"
        spend: Math.round(agg.spend * 100) / 100,
        leads: agg.leads,
      }));
  }, [metricsRaw, googleMetricsRaw, platformFilter]);

  const metrics = useMemo(() => {
    const meta = dashboardData;
    const google = googleDashboard;

    const showMeta = platformFilter === "all" || platformFilter === "meta";
    const showGoogle = platformFilter === "all" || platformFilter === "google";

    const metaSpend = showMeta ? (meta?.totalSpend ?? 0) : 0;
    const googleSpend = showGoogle ? (google?.totalSpend ?? 0) : 0;
    const totalSpend = metaSpend + googleSpend;

    const metaLeads = showMeta ? (meta?.leadsToday ?? 0) : 0;
    const googleConversions = showGoogle ? (google?.conversions ?? 0) : 0;
    const totalLeads = metaLeads + googleConversions;

    const metaCpl = showMeta ? (meta?.costPerLead ?? 0) : 0;
    const googleCpc = showGoogle ? (google?.costPerConversion ?? 0) : 0;
    // Weighted average: only count platforms that have data
    const cplParts: number[] = [];
    if (showMeta && meta) cplParts.push(metaCpl);
    if (showGoogle && google) cplParts.push(googleCpc);
    const avgCpl =
      cplParts.length > 0
        ? cplParts.reduce((a, b) => a + b, 0) / cplParts.length
        : 0;

    const metaActive = showMeta ? (meta?.activeCampaigns ?? 0) : 0;
    const googleActive = showGoogle ? (google?.activeCampaigns ?? 0) : 0;
    const metaPaused = showMeta ? (meta?.pausedCampaigns ?? 0) : 0;
    const googlePaused = showGoogle ? (google?.pausedCampaigns ?? 0) : 0;

    const hasData = (showMeta && meta) || (showGoogle && google);

    if (!hasData) {
      return [
        { label: "Total Spend", value: "--", subtext: "last 7 days" },
        { label: "Leads / Conversions", value: "--", subtext: "today" },
        { label: "Cost per Result", value: "--", subtext: "last 7 days" },
        { label: "Active Campaigns", value: "--", subtext: "no data" },
      ];
    }

    return [
      {
        label: "Total Spend",
        value: formatCurrency(totalSpend),
        subtext: "last 7 days",
      },
      {
        label:
          platformFilter === "google"
            ? "Conversions"
            : platformFilter === "meta"
              ? "Leads Today"
              : "Leads / Conversions",
        value: formatNumber(totalLeads),
        subtext: "today",
      },
      {
        label:
          platformFilter === "google"
            ? "Cost / Conversion"
            : platformFilter === "meta"
              ? "Cost per Lead"
              : "Cost per Result",
        value: formatCurrency(avgCpl),
        subtext: "last 7 days",
      },
      {
        label: "Active Campaigns",
        value: String(metaActive + googleActive),
        subtext: `${metaPaused + googlePaused} paused`,
      },
    ];
  }, [dashboardData, googleDashboard, platformFilter]);

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
            Sign in to see live metrics
          </span>
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium text-white transition-all"
            style={{ background: "var(--acc)" }}
          >
            <LogIn size={12} />
            Sign In
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
          <div key={m.label} className="animate-fade-in-up" style={{ animationDelay: `${i * 75}ms` }}>
            <MetricCard {...m} isFirst={i === 0} />
          </div>
        ))}
      </div>

      {/* Platform filter */}
      <div className="flex items-center gap-1.5">
        {[
          { key: "all" as const, label: "All Platforms", icon: Globe },
          { key: "meta" as const, label: "Meta", icon: Facebook },
          { key: "google" as const, label: "Google", icon: Search },
        ].map(({ key, label, icon: Icon }) => {
          const isActive = platformFilter === key;
          return (
            <button
              key={key}
              onClick={() => setPlatformFilter(key)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors"
              style={{
                background: isActive ? "var(--acc-subtle)" : "var(--bg-subtle)",
                color: isActive ? "var(--acc-text)" : "var(--text-secondary)",
              }}
            >
              <Icon size={12} />
              {label}
            </button>
          );
        })}
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
                onPreset={(d) => {
                  setChartDays(d);
                  setChartDateRange(undefined);
                }}
                onCustomRange={(r) => setChartDateRange(r)}
              />
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={colors.spend}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor={colors.spend}
                        stopOpacity={0.04}
                      />
                    </linearGradient>
                    <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={colors.leads}
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="100%"
                        stopColor={colors.leads}
                        stopOpacity={0.03}
                      />
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
                    labelStyle={{
                      color: colors.tooltipLabel,
                      marginBottom: 4,
                      fontWeight: 500,
                    }}
                    formatter={(value, name) => {
                      if (name === "Spend")
                        return [
                          new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 0,
                          }).format(Number(value)),
                          name,
                        ];
                      return [String(value), name];
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
                    activeDot={{
                      r: 4,
                      stroke: colors.dotStroke,
                      strokeWidth: 2,
                      fill: colors.spend,
                    }}
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
                    activeDot={{
                      r: 4,
                      stroke: colors.dotStroke,
                      strokeWidth: 2,
                      fill: colors.leads,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No performance data yet"
                description="Connect an ad account and create your first campaign to see metrics here."
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
                href={
                  platformFilter === "google"
                    ? "/google/campaigns"
                    : "/campaigns"
                }
                className="text-xs font-medium"
                style={{ color: "var(--acc)" }}
              >
                View all
              </a>
            </div>
            {campaignsLoading || googleCampaignsLoading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : platformFilter === "meta" ? (
              campaignsError ? (
                <ErrorBanner
                  message={campaignsError.message || "Failed to load campaigns"}
                  onRetry={() => refetchCampaigns()}
                />
              ) : metaCampaigns.length > 0 ? (
                <CampaignTable campaigns={metaCampaigns} isLoading={false} />
              ) : (
                <EmptyState
                  icon={LayoutDashboard}
                  title="No Meta campaigns synced yet"
                  description="Select an ad account above and sync to pull your campaigns."
                />
              )
            ) : (
              /* "All Platforms" and "Google" use the unified table */
              (() => {
                const rows =
                  platformFilter === "google"
                    ? unifiedCampaigns.filter((c) => c.platform === "google")
                    : unifiedCampaigns;
                if (rows.length === 0)
                  return (
                    <EmptyState
                      icon={LayoutDashboard}
                      title="No campaigns synced yet"
                      description="Select an ad account above and sync to pull your campaigns."
                    />
                  );
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr
                          style={{
                            borderBottom: "1px solid var(--border-subtle)",
                          }}
                        >
                          {[
                            "Campaign",
                            "Platform",
                            "Status",
                            "Budget",
                            "Spend",
                            "Results",
                            "CPR",
                            "Clicks",
                            "CPC",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider"
                              style={{
                                color: "var(--text-tertiary)",
                                fontSize: "10px",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((c) => (
                          <tr
                            key={c.id}
                            style={{
                              borderBottom: "1px solid var(--border-subtle)",
                            }}
                          >
                            <td className="px-3 py-3">
                              <div
                                className="font-medium"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {c.name}
                              </div>
                              <div
                                className="text-[10px]"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                {c.type}
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                                style={{
                                  background:
                                    c.platform === "meta"
                                      ? "rgba(59,130,246,0.12)"
                                      : "rgba(234,179,8,0.12)",
                                  color:
                                    c.platform === "meta"
                                      ? "#60a5fa"
                                      : "#facc15",
                                }}
                              >
                                {c.platform === "meta" ? "Meta" : "Google"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                                style={{
                                  background: c.isActive
                                    ? "rgba(34,197,94,0.15)"
                                    : "rgba(161,161,170,0.15)",
                                  color: c.isActive
                                    ? "rgb(34,197,94)"
                                    : "rgb(161,161,170)",
                                }}
                              >
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ background: "currentColor" }}
                                />
                                {c.isActive ? "Active" : "Paused"}
                              </span>
                            </td>
                            <td
                              className="px-3 py-3"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {c.dailyBudget > 0
                                ? formatCurrency(c.dailyBudget)
                                : "—"}
                            </td>
                            <td
                              className="px-3 py-3"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {c.spend > 0 ? formatCurrency(c.spend) : "—"}
                            </td>
                            <td
                              className="px-3 py-3"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {c.results > 0 ? (
                                <>
                                  {formatNumber(c.results)}{" "}
                                  <span
                                    className="text-[9px]"
                                    style={{ color: "var(--text-tertiary)" }}
                                  >
                                    {c.resultLabel}
                                  </span>
                                </>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td
                              className="px-3 py-3"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {c.cpr != null && c.cpr > 0
                                ? formatCurrency(c.cpr)
                                : "—"}
                            </td>
                            <td
                              className="px-3 py-3"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {c.clicks > 0 ? formatNumber(c.clicks) : "—"}
                            </td>
                            <td
                              className="px-3 py-3"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {c.cpc > 0 ? formatCurrency(c.cpc) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()
            )}
          </div>
        </div>

        {/* Right: AI Insights */}
        <DashboardInsights adAccountId={selectedAdAccountId} />
      </div>
    </div>
  );
}

// ── AI Insights Sidebar ───────────────────────────────

const riskColors = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
} as const;
const statusColors: Record<string, string> = {
  pending: "#60a5fa",
  approved: "#22c55e",
  executed: "#a78bfa",
  rejected: "#71717a",
  failed: "#ef4444",
  superseded: "#71717a",
  undone: "#71717a",
};

function DashboardInsights({ adAccountId }: { adAccountId: string | null }) {
  const { data: proposalsData } = useProposals(adAccountId);
  const proposals = useMemo(
    () => proposalsData?.data || [],
    [proposalsData?.data],
  );

  // Show the most relevant: pending first, then recent executed/approved
  const sorted = useMemo(() => {
    const order: Record<string, number> = {
      pending: 0,
      approved: 1,
      executed: 2,
      failed: 3,
      rejected: 4,
      superseded: 5,
      undone: 5,
    };
    return [...proposals]
      .sort(
        (a, b) =>
          (order[a.status] ?? 9) - (order[b.status] ?? 9) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [proposals]);

  return (
    <div className="w-[320px] shrink-0">
      <div className="mb-2 flex items-center justify-between">
        <h2
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          AI Insights
        </h2>
        {proposals.length > 0 && (
          <Link
            href="/insights"
            className="text-xs font-medium"
            style={{ color: "var(--acc)" }}
          >
            View all
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {sorted.length === 0 ? (
          <div
            className="flex h-24 items-center justify-center rounded-lg"
            style={{
              background: "var(--bg-base)",
              border: "1px solid var(--border-default)",
            }}
          >
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              No insights yet — sync and analyze campaigns to get AI
              recommendations
            </span>
          </div>
        ) : (
          sorted.map((p) => (
            <Link
              key={p.id}
              href="/insights"
              className="group rounded-lg p-3 transition-colors"
              style={{
                background: "var(--bg-base)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="truncate text-xs font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
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
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {p.campaignName}
                    </span>
                    {p.estimatedSavings != null && p.estimatedSavings > 0 && (
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: "#22c55e" }}
                      >
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
  );
}
