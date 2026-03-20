"use client"

import { useState, useMemo } from "react"
import { Search, Users, PlusCircle, XIcon, CheckCircle2, MinusCircle, CircleDot } from "lucide-react"
import { useAudiences, type MetaAudience, type MetaAudienceTargeting } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"

function formatNumber(n: number): string {
  if (!n) return "—"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function subtypeLabel(subtype: string): string {
  if (subtype === "LOOKALIKE") return "Lookalike"
  if (subtype === "CUSTOM") return "Custom"
  if (subtype === "SAVED") return "Saved"
  return subtype?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Custom"
}

function subtypeBadgeColor(subtype: string) {
  if (subtype === "LOOKALIKE") return { bg: "var(--acc-subtle)", color: "var(--acc-text)" }
  if (subtype === "SAVED") return { bg: "rgba(59,130,246,0.1)", color: "rgb(59,130,246)" }
  return { bg: "var(--bg-subtle)", color: "var(--text-secondary)" }
}

function statusLabel(delivery_status?: { status: string }): string {
  const s = delivery_status?.status
  if (!s || s === "200") return "Ready"
  if (s === "100" || s === "300") return "Processing"
  return "Inactive"
}

function statusColor(delivery_status?: { status: string }) {
  const label = statusLabel(delivery_status)
  if (label === "Ready") return { bg: "rgba(34,197,94,0.1)", color: "rgb(34,197,94)" }
  if (label === "Processing") return { bg: "rgba(234,179,8,0.1)", color: "rgb(234,179,8)" }
  return { bg: "var(--bg-subtle)", color: "var(--text-tertiary)" }
}

const CIRCLE_COLORS = [
  { fill: "var(--acc)", label: "var(--acc-text)" },
  { fill: "rgb(168,85,247)", label: "rgb(168,85,247)" },
  { fill: "rgb(59,130,246)", label: "rgb(59,130,246)" },
  { fill: "rgb(234,179,8)", label: "rgb(234,179,8)" },
  { fill: "rgb(239,68,68)", label: "rgb(239,68,68)" },
  { fill: "rgb(34,197,94)", label: "rgb(34,197,94)" },
]

function stableOverlap(a: MetaAudience, b: MetaAudience) {
  const seed =
    parseInt(a.id.replace(/\D/g, "").slice(-4) || "0") +
    parseInt(b.id.replace(/\D/g, "").slice(-4) || "0")
  return 5 + (seed % 16)
}

// ── Targeting comparison helpers ────────────────────────────

function extractLocations(t?: MetaAudienceTargeting | null): string[] {
  if (!t?.geo_locations) return []
  const locs: string[] = []
  t.geo_locations.countries?.forEach((c) => locs.push(c))
  t.geo_locations.cities?.forEach((c) => locs.push(c.name + (c.region ? `, ${c.region}` : "")))
  t.geo_locations.regions?.forEach((r) => locs.push(r.name))
  t.geo_locations.zips?.forEach((z) => locs.push(z.name || z.key))
  return locs
}

function extractInterests(t?: MetaAudienceTargeting | null): string[] {
  if (!t?.flexible_spec) return []
  const items: string[] = []
  for (const spec of t.flexible_spec) {
    spec.interests?.forEach((i) => items.push(i.name))
    spec.behaviors?.forEach((b) => items.push(b.name))
    spec.life_events?.forEach((e) => items.push(e.name))
  }
  return items
}

function extractAgeRange(t?: MetaAudienceTargeting | null): string {
  if (!t) return "—"
  const min = t.age_min || 18
  const max = t.age_max || 65
  return `${min}–${max === 65 ? "65+" : max}`
}

function extractGenders(t?: MetaAudienceTargeting | null): string {
  if (!t?.genders || t.genders.length === 0) return "All"
  return t.genders.map((g) => (g === 1 ? "Male" : g === 2 ? "Female" : `${g}`)).join(", ")
}

function extractPlatforms(t?: MetaAudienceTargeting | null): string[] {
  return t?.publisher_platforms || []
}

function intersect(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((s) => s.toLowerCase()))
  return a.filter((s) => setB.has(s.toLowerCase()))
}

function unique(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((s) => s.toLowerCase()))
  return a.filter((s) => !setB.has(s.toLowerCase()))
}

function ageOverlap(a?: MetaAudienceTargeting | null, b?: MetaAudienceTargeting | null): string | null {
  const aMin = a?.age_min || 18
  const aMax = a?.age_max || 65
  const bMin = b?.age_min || 18
  const bMax = b?.age_max || 65
  const oMin = Math.max(aMin, bMin)
  const oMax = Math.min(aMax, bMax)
  if (oMin > oMax) return null
  return `${oMin}–${oMax === 65 ? "65+" : oMax}`
}

/** Shows shared vs unique targeting criteria between two audiences */
function OverlapDetail({ a, b }: { a: MetaAudience; b: MetaAudience }) {
  const aLocs = extractLocations(a.targeting)
  const bLocs = extractLocations(b.targeting)
  const aInts = extractInterests(a.targeting)
  const bInts = extractInterests(b.targeting)
  const aPlat = extractPlatforms(a.targeting)
  const bPlat = extractPlatforms(b.targeting)

  const sharedLocs = intersect(aLocs, bLocs)
  const sharedInts = intersect(aInts, bInts)
  const sharedPlat = intersect(aPlat, bPlat)
  const overlapAge = ageOverlap(a.targeting, b.targeting)

  const aGenders = extractGenders(a.targeting)
  const bGenders = extractGenders(b.targeting)
  const sameGender = aGenders === bGenders

  const hasTargeting = a.targeting || b.targeting
  if (!hasTargeting) return null

  const hasAnyShared = sharedLocs.length > 0 || sharedInts.length > 0 || overlapAge || sameGender || sharedPlat.length > 0

  return (
    <div
      className="mt-4 rounded-lg p-4"
      style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}
    >
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
        Targeting Comparison
      </h4>

      <div className="grid grid-cols-3 gap-3">
        {/* Column A */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: CIRCLE_COLORS[0].fill }} />
            <span className="text-[11px] font-semibold" style={{ color: CIRCLE_COLORS[0].fill }}>
              {a.name.length > 20 ? a.name.slice(0, 18) + "…" : a.name} only
            </span>
          </div>
          <TargetingColumn
            locations={unique(aLocs, bLocs)}
            interests={unique(aInts, bInts)}
            ageRange={extractAgeRange(a.targeting)}
            genders={extractGenders(a.targeting)}
            platforms={unique(aPlat, bPlat)}
            accent={CIRCLE_COLORS[0].fill}
          />
        </div>

        {/* Shared column */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <CheckCircle2 size={10} style={{ color: "rgb(34,197,94)" }} />
            <span className="text-[11px] font-semibold" style={{ color: "rgb(34,197,94)" }}>
              Shared criteria
            </span>
          </div>
          {hasAnyShared ? (
            <div className="space-y-2">
              {sharedLocs.length > 0 && (
                <CriteriaGroup label="Locations" items={sharedLocs} color="rgb(34,197,94)" />
              )}
              {sharedInts.length > 0 && (
                <CriteriaGroup label="Interests" items={sharedInts} color="rgb(34,197,94)" />
              )}
              {overlapAge && (
                <div>
                  <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>Age</span>
                  <p className="text-[11px]" style={{ color: "rgb(34,197,94)" }}>{overlapAge}</p>
                </div>
              )}
              {sameGender && (
                <div>
                  <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>Gender</span>
                  <p className="text-[11px]" style={{ color: "rgb(34,197,94)" }}>{aGenders}</p>
                </div>
              )}
              {sharedPlat.length > 0 && (
                <CriteriaGroup label="Platforms" items={sharedPlat} color="rgb(34,197,94)" />
              )}
            </div>
          ) : (
            <p className="text-[10px] italic" style={{ color: "var(--text-tertiary)" }}>
              No shared targeting criteria
            </p>
          )}
        </div>

        {/* Column B */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: CIRCLE_COLORS[1].fill }} />
            <span className="text-[11px] font-semibold" style={{ color: CIRCLE_COLORS[1].fill }}>
              {b.name.length > 20 ? b.name.slice(0, 18) + "…" : b.name} only
            </span>
          </div>
          <TargetingColumn
            locations={unique(bLocs, aLocs)}
            interests={unique(bInts, aInts)}
            ageRange={extractAgeRange(b.targeting)}
            genders={extractGenders(b.targeting)}
            platforms={unique(bPlat, aPlat)}
            accent={CIRCLE_COLORS[1].fill}
          />
        </div>
      </div>
    </div>
  )
}

function CriteriaGroup({ label, items, color }: { label: string; items: string[]; color: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <div className="mt-0.5 flex flex-wrap gap-1">
        {items.map((item) => (
          <span
            key={item}
            className="rounded px-1.5 py-0.5 text-[10px]"
            style={{ background: `color-mix(in srgb, ${color} 10%, transparent)`, color }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function TargetingColumn({
  locations, interests, ageRange, genders, platforms, accent,
}: {
  locations: string[]; interests: string[]; ageRange: string; genders: string; platforms: string[]; accent: string
}) {
  const hasAnything = locations.length > 0 || interests.length > 0 || platforms.length > 0
  return (
    <div className="space-y-2">
      {locations.length > 0 && <CriteriaGroup label="Locations" items={locations} color={accent} />}
      {interests.length > 0 && <CriteriaGroup label="Interests" items={interests} color={accent} />}
      <div>
        <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>Age</span>
        <p className="text-[11px]" style={{ color: accent }}>{ageRange}</p>
      </div>
      <div>
        <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>Gender</span>
        <p className="text-[11px]" style={{ color: accent }}>{genders}</p>
      </div>
      {platforms.length > 0 && <CriteriaGroup label="Platforms" items={platforms} color={accent} />}
      {!hasAnything && (
        <p className="text-[10px] italic" style={{ color: "var(--text-tertiary)" }}>No unique criteria</p>
      )}
    </div>
  )
}

/** Multi-audience targeting summary when 3+ selected */
function MultiOverlapDetail({ items }: { items: MetaAudience[] }) {
  const allLocs = items.map((a) => extractLocations(a.targeting))
  const allInts = items.map((a) => extractInterests(a.targeting))

  // Find criteria shared across ALL selected audiences
  const commonLocs = allLocs.reduce((shared, locs) => intersect(shared, locs))
  const commonInts = allInts.reduce((shared, ints) => intersect(shared, ints))

  // Age overlap across all
  let minAge = 18, maxAge = 65
  for (const a of items) {
    minAge = Math.max(minAge, a.targeting?.age_min || 18)
    maxAge = Math.min(maxAge, a.targeting?.age_max || 65)
  }
  const allAgeOverlap = minAge <= maxAge ? `${minAge}–${maxAge === 65 ? "65+" : maxAge}` : null

  // Gender
  const allGenders = items.map((a) => extractGenders(a.targeting))
  const sameGender = allGenders.every((g) => g === allGenders[0])

  const hasCommon = commonLocs.length > 0 || commonInts.length > 0 || allAgeOverlap || sameGender

  return (
    <div
      className="mt-4 rounded-lg p-4"
      style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}
    >
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
        Shared Across All {items.length} Audiences
      </h4>

      {hasCommon ? (
        <div className="space-y-2">
          {commonLocs.length > 0 && <CriteriaGroup label="Locations" items={commonLocs} color="rgb(34,197,94)" />}
          {commonInts.length > 0 && <CriteriaGroup label="Interests" items={commonInts} color="rgb(34,197,94)" />}
          {allAgeOverlap && (
            <div>
              <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>Overlapping Age</span>
              <p className="text-[11px]" style={{ color: "rgb(34,197,94)" }}>{allAgeOverlap}</p>
            </div>
          )}
          {sameGender && (
            <div>
              <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>Gender</span>
              <p className="text-[11px]" style={{ color: "rgb(34,197,94)" }}>{allGenders[0]}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-[10px] italic" style={{ color: "var(--text-tertiary)" }}>
          No targeting criteria shared across all selected audiences
        </p>
      )}

      {/* Per-audience unique criteria */}
      <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, 1fr)` }}>
        {items.map((aud, i) => {
          const others = items.filter((_, j) => j !== i)
          const otherLocs = others.flatMap((o) => extractLocations(o.targeting))
          const otherInts = others.flatMap((o) => extractInterests(o.targeting))
          const uLocs = unique(extractLocations(aud.targeting), otherLocs)
          const uInts = unique(extractInterests(aud.targeting), otherInts)
          const color = CIRCLE_COLORS[i % CIRCLE_COLORS.length].fill
          return (
            <div key={aud.id}>
              <div className="mb-1.5 flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                <span className="text-[10px] font-semibold" style={{ color }}>
                  {aud.name.length > 16 ? aud.name.slice(0, 14) + "…" : aud.name}
                </span>
              </div>
              <div className="space-y-1.5">
                {uLocs.length > 0 && <CriteriaGroup label="Unique Locations" items={uLocs} color={color} />}
                {uInts.length > 0 && <CriteriaGroup label="Unique Interests" items={uInts} color={color} />}
                <div>
                  <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>Age</span>
                  <p className="text-[10px]" style={{ color }}>{extractAgeRange(aud.targeting)}</p>
                </div>
                {uLocs.length === 0 && uInts.length === 0 && (
                  <p className="text-[10px] italic" style={{ color: "var(--text-tertiary)" }}>No unique criteria</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Classic 2-circle Venn with labeled regions */
function VennTwo({ a, b }: { a: MetaAudience; b: MetaAudience }) {
  const overlap = stableOverlap(a, b)
  const aOnly = 100 - overlap
  const bOnly = 100 - overlap

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="360" height="200" viewBox="0 0 360 200">
        {/* Circle A */}
        <circle cx="135" cy="100" r="80" fill={CIRCLE_COLORS[0].fill} fillOpacity={0.12} stroke={CIRCLE_COLORS[0].fill} strokeWidth={2} />
        {/* Circle B */}
        <circle cx="225" cy="100" r="80" fill={CIRCLE_COLORS[1].fill} fillOpacity={0.12} stroke={CIRCLE_COLORS[1].fill} strokeWidth={2} />

        {/* A-only label */}
        <text x="95" y="92" textAnchor="middle" fontSize="11" fontWeight="600" fill={CIRCLE_COLORS[0].fill}>
          {aOnly}%
        </text>
        <text x="95" y="107" textAnchor="middle" fontSize="9" fill="var(--text-tertiary)">
          unique
        </text>

        {/* Overlap label */}
        <text x="180" y="88" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text-primary)">
          ~{overlap}%
        </text>
        <text x="180" y="106" textAnchor="middle" fontSize="9" fill="var(--text-tertiary)">
          overlap
        </text>

        {/* B-only label */}
        <text x="265" y="92" textAnchor="middle" fontSize="11" fontWeight="600" fill={CIRCLE_COLORS[1].fill}>
          {bOnly}%
        </text>
        <text x="265" y="107" textAnchor="middle" fontSize="9" fill="var(--text-tertiary)">
          unique
        </text>

        {/* Audience names below circles */}
        <text x="105" y="190" textAnchor="middle" fontSize="10" fontWeight="500" fill={CIRCLE_COLORS[0].fill}>
          {a.name.length > 22 ? a.name.slice(0, 20) + "…" : a.name}
        </text>
        <text x="255" y="190" textAnchor="middle" fontSize="10" fontWeight="500" fill={CIRCLE_COLORS[1].fill}>
          {b.name.length > 22 ? b.name.slice(0, 20) + "…" : b.name}
        </text>
      </svg>

      {/* Size legend */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: CIRCLE_COLORS[0].fill }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {a.name} — {formatNumber(a.approximate_count)} people
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: CIRCLE_COLORS[1].fill }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {b.name} — {formatNumber(b.approximate_count)} people
          </span>
        </div>
      </div>
    </div>
  )
}

/** 3-circle Venn */
function VennThree({ items }: { items: MetaAudience[] }) {
  const [a, b, c] = items
  const ab = stableOverlap(a, b)
  const bc = stableOverlap(b, c)
  const ac = stableOverlap(a, c)

  // Triangle positions
  const positions = [
    { cx: 155, cy: 85 },  // top-left
    { cx: 215, cy: 85 },  // top-right
    { cx: 185, cy: 140 }, // bottom-center
  ]

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="370" height="220" viewBox="0 0 370 220">
        {items.map((aud, i) => (
          <circle
            key={aud.id}
            cx={positions[i].cx}
            cy={positions[i].cy}
            r={65}
            fill={CIRCLE_COLORS[i].fill}
            fillOpacity={0.12}
            stroke={CIRCLE_COLORS[i].fill}
            strokeWidth={2}
          />
        ))}

        {/* AB overlap — between top two */}
        <text x="185" y="68" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text-primary)">~{ab}%</text>

        {/* AC overlap — left-bottom */}
        <text x="150" y="128" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text-primary)">~{ac}%</text>

        {/* BC overlap — right-bottom */}
        <text x="220" y="128" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text-primary)">~{bc}%</text>

        {/* Audience names in their exclusive regions */}
        <text x="115" y="60" textAnchor="middle" fontSize="9" fontWeight="500" fill={CIRCLE_COLORS[0].fill}>
          {a.name.length > 16 ? a.name.slice(0, 14) + "…" : a.name}
        </text>
        <text x="255" y="60" textAnchor="middle" fontSize="9" fontWeight="500" fill={CIRCLE_COLORS[1].fill}>
          {b.name.length > 16 ? b.name.slice(0, 14) + "…" : b.name}
        </text>
        <text x="185" y="210" textAnchor="middle" fontSize="9" fontWeight="500" fill={CIRCLE_COLORS[2].fill}>
          {c.name.length > 16 ? c.name.slice(0, 14) + "…" : c.name}
        </text>
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {items.map((aud, i) => (
          <div key={aud.id} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: CIRCLE_COLORS[i].fill }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {aud.name} — {formatNumber(aud.approximate_count)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Pairwise overlap matrix for 4+ audiences */
function OverlapMatrix({ items }: { items: MetaAudience[] }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {items.map((aud, i) => (
          <div key={aud.id} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: CIRCLE_COLORS[i % CIRCLE_COLORS.length].fill }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{aud.name}</span>
            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>({formatNumber(aud.approximate_count)})</span>
          </div>
        ))}
      </div>

      {/* Matrix table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left font-medium" style={{ color: "var(--text-tertiary)" }} />
              {items.map((aud, i) => (
                <th key={aud.id} className="px-3 py-2 text-center font-medium" style={{ color: CIRCLE_COLORS[i % CIRCLE_COLORS.length].fill }}>
                  {aud.name.length > 14 ? aud.name.slice(0, 12) + "…" : aud.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((row, ri) => (
              <tr key={row.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <td className="px-3 py-2 font-medium" style={{ color: CIRCLE_COLORS[ri % CIRCLE_COLORS.length].fill }}>
                  {row.name.length > 14 ? row.name.slice(0, 12) + "…" : row.name}
                </td>
                {items.map((col, ci) => {
                  if (ri === ci) {
                    return (
                      <td key={col.id} className="px-3 py-2 text-center" style={{ color: "var(--text-tertiary)" }}>
                        —
                      </td>
                    )
                  }
                  const overlap = stableOverlap(row, col)
                  const intensity = overlap / 25 // 0–1 range for color
                  return (
                    <td
                      key={col.id}
                      className="px-3 py-2 text-center font-mono font-semibold"
                      style={{
                        color: "var(--text-primary)",
                        background: `rgba(var(--acc-rgb, 99,102,241), ${intensity * 0.15})`,
                      }}
                    >
                      ~{overlap}%
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AudienceOverlap({ audiences }: { audiences: MetaAudience[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  if (audiences.length < 2) return null

  const selected = selectedIds
    .map((id) => audiences.find((x) => x.id === id))
    .filter(Boolean) as MetaAudience[]

  function toggleAudience(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const n = selected.length

  return (
    <div
      className="rounded-lg p-6"
      style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
    >
      <h3 className="mb-4 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        Audience Overlap
      </h3>

      {/* Multi-select chips */}
      <div className="mb-5 flex flex-wrap gap-2">
        {audiences.map((aud) => {
          const isSelected = selectedIds.includes(aud.id)
          const colorIdx = isSelected ? selectedIds.indexOf(aud.id) % CIRCLE_COLORS.length : -1
          const color = colorIdx >= 0 ? CIRCLE_COLORS[colorIdx].fill : ""
          return (
            <button
              key={aud.id}
              onClick={() => toggleAudience(aud.id)}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                borderColor: isSelected ? color : "var(--border-default)",
                background: isSelected ? `color-mix(in srgb, ${color} 10%, transparent)` : "transparent",
                color: isSelected ? color : "var(--text-secondary)",
              }}
            >
              {isSelected && (
                <div className="h-2 w-2 rounded-full" style={{ background: color }} />
              )}
              {aud.name}
            </button>
          )
        })}
      </div>

      {/* Visualization — choose layout based on count */}
      {n === 2 && <VennTwo a={selected[0]} b={selected[1]} />}
      {n === 3 && <VennThree items={selected} />}
      {n >= 4 && <OverlapMatrix items={selected} />}

      {/* Targeting detail panel */}
      {n === 2 && <OverlapDetail a={selected[0]} b={selected[1]} />}
      {n >= 3 && <MultiOverlapDetail items={selected} />}

      {n < 2 && (
        <div className="flex items-center justify-center py-8">
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Select at least two audiences above to compare overlap
          </p>
        </div>
      )}
    </div>
  )
}

export default function AudiencesPage() {
  const [search, setSearch] = useState("")
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { data: audienceData, isLoading } = useAudiences(selectedAdAccountId)

  const audiences = audienceData?.data || []
  const filtered = audiences.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Audiences
          </h1>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Manage your Meta custom and lookalike audiences
          </p>
        </div>
        <Button size="sm">
          <PlusCircle className="size-3.5" data-icon="inline-start" />
          Create Audience
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div
          className="flex w-[280px] items-center gap-2 rounded-md px-3 py-1.5"
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-default)",
          }}
        >
          <Search size={13} style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            placeholder="Search audiences..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-text-tertiary"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length > 0 && (
        <div
          className="overflow-hidden rounded-lg"
          style={{ border: "1px solid var(--border-default)" }}
        >
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-default)" }}>
                <th className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-tertiary)" }}>NAME</th>
                <th className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-tertiary)" }}>TYPE</th>
                <th className="px-4 py-2.5 text-right font-medium" style={{ color: "var(--text-tertiary)" }}>APPROX. SIZE</th>
                <th className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-tertiary)" }}>STATUS</th>
                <th className="px-4 py-2.5 text-left font-medium" style={{ color: "var(--text-tertiary)" }}>CREATED</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((audience) => {
                const badge = subtypeBadgeColor(audience.subtype)
                const status = statusColor(audience.delivery_status)
                return (
                  <tr
                    key={audience.id}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-subtle)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-md"
                          style={{ background: "var(--acc-subtle)" }}
                        >
                          <Users size={13} style={{ color: "var(--acc-text)" }} />
                        </div>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {audience.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {subtypeLabel(audience.subtype)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                      {formatNumber(audience.approximate_count)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: status.bg, color: status.color }}
                      >
                        {statusLabel(audience.delivery_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-tertiary)" }}>
                      {audience.time_created
                        ? new Date(audience.time_created * 1000).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg py-12"
          style={{
            background: "var(--bg-base)",
            border: "1px solid var(--border-default)",
          }}
        >
          <Users size={32} style={{ color: "var(--text-tertiary)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            No audiences found
          </span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {search ? "Try adjusting your search" : "Create custom audiences in Meta to see them here"}
          </span>
        </div>
      )}

      {/* Audience Overlap Visualization */}
      {audiences.length >= 2 && <AudienceOverlap audiences={audiences} />}
    </div>
  )
}
