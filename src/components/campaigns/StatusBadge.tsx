"use client"

type Status = "active" | "paused" | "warning" | "error" | "info" | "accent"

const statusStyles: Record<
  Status,
  { bg: string; text: string }
> = {
  active: { bg: "var(--green-bg)", text: "var(--green-text)" },
  paused: { bg: "var(--bg-muted)", text: "var(--text-tertiary)" },
  warning: { bg: "var(--amber-bg)", text: "var(--amber-text)" },
  error: { bg: "var(--red-bg)", text: "var(--red-text)" },
  info: { bg: "var(--blue-bg)", text: "var(--blue-text)" },
  accent: { bg: "var(--acc-subtle)", text: "var(--acc-text)" },
}

interface StatusBadgeProps {
  status: Status
  label: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = statusStyles[status]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: style.bg, color: style.text }}
    >
      <span
        className="h-[5px] w-[5px] rounded-full"
        style={{ background: "currentColor" }}
      />
      {label}
    </span>
  )
}
