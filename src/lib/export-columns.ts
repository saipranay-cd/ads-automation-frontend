import { BarChart3, Layers, Users, MapPin, Megaphone, LayoutGrid, Image, type LucideIcon } from "lucide-react"

// ── Data Groups (what rows represent) ─────────────────────

export interface GroupDef {
  key: string
  name: string
  icon: LucideIcon
}

export const DATA_GROUPS: GroupDef[] = [
  { key: "campaigns", name: "Campaigns", icon: Megaphone },
  { key: "adSets", name: "Ad Sets", icon: LayoutGrid },
  { key: "ads", name: "Ads", icon: Image },
  { key: "daily", name: "Daily Performance", icon: BarChart3 },
  { key: "placements", name: "Placements", icon: Layers },
  { key: "ageGender", name: "Age & Gender", icon: Users },
  { key: "regions", name: "Regions", icon: MapPin },
]

export const GROUP_MAP = new Map(DATA_GROUPS.map((g) => [g.key, g]))

// ── Data Points (columns users can pick) ──────────────────

export type DataPointCategory = "dimension" | "metric" | "budget" | "creative"

export interface DataPointDef {
  key: string
  label: string
  category: DataPointCategory
  defaultOn: boolean
  /** Which groups this point applies to. undefined = all groups. */
  groups?: string[]
}

export const DATA_POINTS: DataPointDef[] = [
  // ── Dimensions ──
  { key: "campaignId", label: "Campaign ID", category: "dimension", defaultOn: true, groups: ["campaigns", "adSets", "ads"] },
  { key: "campaignName", label: "Campaign Name", category: "dimension", defaultOn: true, groups: ["campaigns", "adSets", "ads"] },
  { key: "campaignStatus", label: "Campaign Status", category: "dimension", defaultOn: true, groups: ["campaigns"] },
  { key: "objective", label: "Objective", category: "dimension", defaultOn: false, groups: ["campaigns"] },
  { key: "adSetId", label: "Ad Set ID", category: "dimension", defaultOn: true, groups: ["adSets", "ads"] },
  { key: "adSetName", label: "Ad Set Name", category: "dimension", defaultOn: true, groups: ["adSets", "ads"] },
  { key: "adSetStatus", label: "Ad Set Status", category: "dimension", defaultOn: true, groups: ["adSets"] },
  { key: "adId", label: "Ad ID", category: "dimension", defaultOn: true, groups: ["ads"] },
  { key: "adName", label: "Ad Name", category: "dimension", defaultOn: true, groups: ["ads"] },
  { key: "adStatus", label: "Ad Status", category: "dimension", defaultOn: true, groups: ["ads"] },
  { key: "date", label: "Date", category: "dimension", defaultOn: true, groups: ["daily"] },
  { key: "placement", label: "Placement", category: "dimension", defaultOn: true, groups: ["placements"] },
  { key: "age", label: "Age Group", category: "dimension", defaultOn: true, groups: ["ageGender"] },
  { key: "region", label: "Region", category: "dimension", defaultOn: true, groups: ["regions"] },

  // ── Performance Metrics ──
  { key: "spend", label: "Spend", category: "metric", defaultOn: true },
  { key: "leads", label: "Leads", category: "metric", defaultOn: true },
  { key: "cpl", label: "CPL", category: "metric", defaultOn: true },
  { key: "impressions", label: "Impressions", category: "metric", defaultOn: true },
  { key: "clicks", label: "Clicks", category: "metric", defaultOn: true },
  { key: "reach", label: "Reach", category: "metric", defaultOn: false },
  { key: "ctr", label: "CTR %", category: "metric", defaultOn: true },
  { key: "cpc", label: "CPC", category: "metric", defaultOn: true },
  { key: "cpm", label: "CPM", category: "metric", defaultOn: false },
  { key: "frequency", label: "Frequency", category: "metric", defaultOn: false },

  // ── Budget & Results ──
  { key: "dailyBudget", label: "Daily Budget", category: "budget", defaultOn: false, groups: ["campaigns", "adSets"] },
  { key: "pacing", label: "Pacing %", category: "budget", defaultOn: false, groups: ["campaigns"] },
  { key: "results", label: "Results", category: "budget", defaultOn: false, groups: ["campaigns", "adSets", "ads"] },
  { key: "costPerResult", label: "Cost / Result", category: "budget", defaultOn: false, groups: ["campaigns", "adSets", "ads"] },

  // ── Creative ──
  { key: "thumbnailUrl", label: "Thumbnail URL", category: "creative", defaultOn: false, groups: ["ads"] },
]

export const CATEGORIES: { key: DataPointCategory; label: string }[] = [
  { key: "dimension", label: "Dimensions" },
  { key: "metric", label: "Performance" },
  { key: "budget", label: "Budget & Results" },
  { key: "creative", label: "Creative" },
]

// ── Helpers ────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Check if a data point applies to a given group */
export function pointAppliesToGroup(dp: DataPointDef, groupKey: string): boolean {
  return !dp.groups || dp.groups.includes(groupKey)
}

/** Get the set of data-point keys relevant to at least one of the selected groups */
export function getRelevantPoints(selectedGroups: Set<string>): Set<string> {
  const relevant = new Set<string>()
  for (const dp of DATA_POINTS) {
    if (!dp.groups || dp.groups.some((g) => selectedGroups.has(g))) {
      relevant.add(dp.key)
    }
  }
  return relevant
}

/**
 * For a given group + selected data points, return the ordered column defs.
 * For ageGender, metric keys are auto-expanded to Male/Female variants.
 */
export function getGroupColumns(
  groupKey: string,
  selectedPoints: Set<string>
): { key: string; label: string }[] {
  const cols: { key: string; label: string }[] = []

  for (const dp of DATA_POINTS) {
    if (!selectedPoints.has(dp.key)) continue
    if (!pointAppliesToGroup(dp, groupKey)) continue

    if (groupKey === "ageGender" && dp.category === "metric") {
      cols.push({ key: `male${capitalize(dp.key)}`, label: `Male ${dp.label}` })
      cols.push({ key: `female${capitalize(dp.key)}`, label: `Female ${dp.label}` })
    } else {
      cols.push({ key: dp.key, label: dp.label })
    }
  }

  return cols
}

/**
 * Build a single export sheet from group data + selected data points.
 */
export function buildExportSheet(
  groupKey: string,
  data: Record<string, string>[],
  selectedPoints: Set<string>
): { name: string; headers: string[]; rows: string[][] } | null {
  const group = GROUP_MAP.get(groupKey)
  if (!group || !data.length) return null

  const columns = getGroupColumns(groupKey, selectedPoints)
  if (!columns.length) return null

  return {
    name: group.name,
    headers: columns.map((c) => c.label),
    rows: data.map((row) => columns.map((c) => row[c.key] ?? "")),
  }
}
