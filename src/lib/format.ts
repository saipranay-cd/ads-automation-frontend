/**
 * Shared formatting utilities for numbers, currency, percentages, and dates.
 * Import from here instead of defining local formatters per-page.
 */

const enIN = "en-IN"
const enUS = "en-US"

/* ─── Numbers ─── */

/** Format number with Indian locale (en-IN). */
export function fmt(n: number | null | undefined): string {
  if (n == null) return "—"
  return new Intl.NumberFormat(enIN).format(n)
}

/** Format number with US locale (en-US). */
export function fmtUS(n: number): string {
  return new Intl.NumberFormat(enUS).format(n)
}

/** Compact Indian notation: 1.2Cr / 3.5L / 12.4K or locale string. */
export function fmtCompact(n: number | null | undefined): string {
  if (n == null) return "—"
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)}Cr`
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString(enIN)
}

/** Compact international notation: 1.2M / 12.4K or locale string. */
export function fmtCompactIntl(n: number | null | undefined): string {
  if (!n) return "—"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

/* ─── Currency ─── */

/** Format as ₹ INR with configurable fraction digits (default 0). */
export function fmtCurrency(n: number | null | undefined, maximumFractionDigits = 0): string {
  if (n == null) return "—"
  return new Intl.NumberFormat(enIN, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits,
  }).format(n)
}

/** Format as ₹ with Intl (2 decimal places) — for Google Ads tables. */
export function fmtCurrencyPrecise(n: number): string {
  return new Intl.NumberFormat(enIN, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n)
}

/** Simple ₹ prefix with Indian locale grouping (no Intl currency). */
export function fmtInr(n: number | null | undefined): string {
  if (n == null) return "—"
  return `₹${n.toLocaleString(enIN, { maximumFractionDigits: 0 })}`
}

/* ─── Percentage ─── */

/** Format as percentage with 2 decimal places. */
export function fmtPercent(n: number): string {
  return `${n.toFixed(2)}%`
}

/* ─── Dates ─── */

/** Format date as "05 Apr" (day + short month). */
export function fmtDateShort(d: string | null | undefined): string {
  if (!d) return "—"
  const date = new Date(d)
  return `${date.getDate()} ${date.toLocaleString("en", { month: "short" })}`
}

/** Format date as "05 Apr 2025" (en-IN medium). */
export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString(enIN, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

/** Conversion rate helper: (to / from * 100) with adaptive precision. */
export function conversionRate(from: number, to: number): string {
  if (from === 0) return "—"
  const pct = (to / from) * 100
  return pct < 1 ? `${pct.toFixed(2)}%` : `${pct.toFixed(1)}%`
}
