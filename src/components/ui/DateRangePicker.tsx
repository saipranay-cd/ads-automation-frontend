"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, ChevronDown } from "lucide-react"
import type { DateRange } from "@/hooks/use-campaigns"

const PRESETS = [
  { label: "Today", days: 0 },
  { label: "Yesterday", days: 1 },
  { label: "Last 7d", days: 7 },
  { label: "Last 14d", days: 14 },
  { label: "Last 30d", days: 30 },
  { label: "Last 90d", days: 90 },
] as const

/**
 * Date preset logic matching Google Ads / Zoho:
 * - "Today" = today only
 * - "Yesterday" = yesterday only
 * - "Last 7d" = 7 days ago through yesterday (excludes today's partial data)
 * - "Last 30d" = 30 days ago through yesterday
 */
export function presetRange(days: number): { since: string; until: string } {
  const now = new Date()
  if (days === 0) {
    const t = now.toISOString().split("T")[0]
    return { since: t, until: t }
  }
  if (days === 1) {
    const y = new Date(now)
    y.setDate(y.getDate() - 1)
    const yStr = y.toISOString().split("T")[0]
    return { since: yStr, until: yStr }
  }
  // "Last N days" = N days ago through yesterday
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const from = new Date(now)
  from.setDate(from.getDate() - days)
  return {
    since: from.toISOString().split("T")[0],
    until: yesterday.toISOString().split("T")[0],
  }
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split("T")[0]
}

function today(): string {
  return new Date().toISOString().split("T")[0]
}

function formatLabel(days: number | null, dateRange: DateRange | undefined): string {
  if (dateRange) {
    const fmt = (s: string) => {
      const d = new Date(s + "T00:00:00")
      return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })}`
    }
    return `${fmt(dateRange.since)} – ${fmt(dateRange.until)}`
  }
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days) return `Last ${days} days`
  return "Last 30 days"
}

interface Props {
  days: number
  dateRange: DateRange | undefined
  onPreset: (days: number) => void
  onCustomRange: (range: DateRange) => void
}

export function DateRangePicker({ days, dateRange, onPreset, onCustomRange }: Props) {
  const [open, setOpen] = useState(false)
  const [since, setSince] = useState(dateRange?.since ?? daysAgo(30))
  const [until, setUntil] = useState(dateRange?.until ?? today())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const isCustom = !!dateRange
  const activeLabel = formatLabel(isCustom ? null : days, dateRange)

  function applyCustom() {
    if (since && until && since <= until) {
      onCustomRange({ since, until })
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Preset chips */}
      <div className="flex items-center gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.days}
            onClick={() => { onPreset(p.days); setOpen(false) }}
            className="rounded-md px-3 py-1 text-xs font-medium transition-colors"
            style={{
              background: !isCustom && days === p.days ? "var(--acc)" : "transparent",
              color: !isCustom && days === p.days ? "white" : "var(--text-secondary)",
            }}
          >
            {p.label}
          </button>
        ))}

        {/* Custom trigger */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
          style={{
            background: isCustom ? "var(--acc)" : open ? "var(--bg-muted)" : "transparent",
            color: isCustom ? "white" : "var(--text-secondary)",
            border: isCustom ? "none" : open ? "1px solid var(--border-default)" : "1px solid transparent",
          }}
        >
          <Calendar size={12} />
          {isCustom ? activeLabel : "Custom"}
          <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 w-[280px] rounded-lg p-3"
          style={{
            background: "var(--bg-base)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
          }}
        >
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
            Custom Date Range
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="w-12 text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>From</label>
              <input
                type="date"
                value={since}
                max={until || today()}
                onChange={(e) => setSince(e.target.value)}
                className="flex-1 rounded-md px-2.5 py-1.5 text-xs outline-none"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  colorScheme: "dark",
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-12 text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>To</label>
              <input
                type="date"
                value={until}
                min={since}
                max={today()}
                onChange={(e) => setUntil(e.target.value)}
                className="flex-1 rounded-md px-2.5 py-1.5 text-xs outline-none"
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  colorScheme: "dark",
                }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => { onPreset(days); setOpen(false) }}
              className="rounded-md px-2.5 py-1 text-[11px] font-medium"
              style={{ color: "var(--text-tertiary)" }}
            >
              Clear
            </button>
            <button
              onClick={applyCustom}
              disabled={!since || !until || since > until}
              className="rounded-md px-3.5 py-1.5 text-xs font-medium text-white transition-all disabled:opacity-40"
              style={{ background: "var(--acc)" }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
