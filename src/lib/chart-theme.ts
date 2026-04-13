/**
 * Shared chart theme constants for Recharts.
 * Recharts SVG doesn't support CSS variables, so we use JS theme switching.
 */

export type ThemeKey = "obsidian" | "violet"

/** Base chart theme colors shared across all chart pages. */
export const CHART_THEME = {
  obsidian: {
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

/** Categorical palette for donut/bar/city charts. */
export const PALETTE = ["#2dd4bf", "#fbbf24", "#a78bfa", "#4ade80", "#fb923c", "#f87171", "#38bdf8", "#818cf8"]

/** Google Ads status → StatusBadge props mapping. */
export function googleStatusMap(s: string) {
  switch (s) {
    case "ENABLED":
      return { status: "active" as const, label: "Enabled" }
    case "PAUSED":
      return { status: "paused" as const, label: "Paused" }
    case "ENDED":
      return { status: "info" as const, label: "Ended" }
    case "REMOVED":
      return { status: "error" as const, label: "Removed" }
    default:
      return { status: "info" as const, label: s }
  }
}
