/** Shared table styling constants for sticky-column data tables. */

export const stickyCol =
  "sticky left-0 z-20 px-3 py-2.5 min-w-[220px] max-w-[280px]"

export const stickyColBg = { background: "var(--bg-base)" } as const

export const stickyHeaderBg = { background: "var(--bg-muted)" } as const

export const thClass =
  "whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.06em]"

export const thStyle = {
  color: "var(--text-tertiary)",
  borderBottom: "1px solid var(--border-subtle)",
} as const
