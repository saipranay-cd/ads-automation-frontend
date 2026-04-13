"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  LogIn,
  LayoutDashboard,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { usePlatform } from "@/hooks/use-platform";

const PerformanceChart = dynamic(
  () => import("@/components/dashboard/PerformanceChart").then((m) => m.PerformanceChart),
  { ssr: false, loading: () => <div className="h-[240px] animate-pulse rounded-md" style={{ background: "var(--bg-muted)" }} /> },
);
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PredictionsPanel } from "@/components/dashboard/PredictionsPanel";
import { CampaignTable } from "@/components/dashboard/CampaignTable";
import { DashboardInsights } from "@/components/dashboard/DashboardInsights";
import { SyncReminder } from "@/components/dashboard/SyncReminder";
import {
  useCampaigns,
  useDashboard,
  useAggregatedMetrics,
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

import { CHART_THEME } from "@/lib/chart-theme";

const CHART_COLORS = {
  obsidian: { ...CHART_THEME.obsidian, spend: "#5eead4", leads: "#fbbf24" },
  violet: { ...CHART_THEME.violet, spend: "#0d9488", leads: "#d97706" },
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
  const { platform } = usePlatform();
  const platformFilter = platform;
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

  // Unified campaigns for "Google" view
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
    const showMeta = platformFilter === "meta";
    const showGoogle = platformFilter === "google";

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

    const showMeta = platformFilter === "meta";
    const showGoogle = platformFilter === "google";

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
            : "Leads Today",
        value: formatNumber(totalLeads),
        subtext: "today",
      },
      {
        label:
          platformFilter === "google"
            ? "Cost / Conversion"
            : "Cost per Lead",
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
              <PerformanceChart data={chartData} colors={colors} />
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
              /* Google uses the unified table */
              (() => {
                const rows = unifiedCampaigns.filter((c) => c.platform === "google");
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
                                      : "rgba(180,83,9,0.12)",
                                  color:
                                    c.platform === "meta"
                                      ? "#60a5fa"
                                      : "#d97706",
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

