"use client"

interface PacingBarProps {
  percent: number
  showLabel?: boolean
}

export function PacingBar({ percent, showLabel = true }: PacingBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))

  const fillColor =
    clamped >= 95
      ? "var(--red-solid)"
      : clamped >= 85
        ? "var(--amber-solid)"
        : "var(--acc)"

  return (
    <div className="flex flex-col gap-0.5">
      {showLabel && (
        <span
          className="font-mono text-[11px]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {clamped}%
        </span>
      )}
      <div
        className="h-1 w-full overflow-hidden rounded-full"
        style={{ background: "var(--bg-muted)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${clamped}%`,
            background: fillColor,
          }}
        />
      </div>
    </div>
  )
}
