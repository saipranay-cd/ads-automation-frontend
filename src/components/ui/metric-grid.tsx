"use client"

import { cn } from "@/lib/utils"

export interface MetricItem {
  label: string
  value: string
  hint?: string
}

interface MetricGridProps {
  items: MetricItem[]
  columns?: 2 | 3 | 4
  className?: string
}

export function MetricGrid({ items, columns = 3, className }: MetricGridProps) {
  const gridCols =
    columns === 2 ? "grid-cols-2" : columns === 4 ? "grid-cols-4" : "grid-cols-3"

  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-md",
        gridCols,
        className
      )}
      style={{ background: "var(--border-subtle)" }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-0.5 px-3 py-2.5"
          style={{ background: "var(--bg-base)" }}
        >
          <span
            className="text-[10px] uppercase tracking-[0.06em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {item.label}
          </span>
          <span
            className="font-mono text-[13px] font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {item.value}
          </span>
          {item.hint && (
            <span
              className="text-[10px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              {item.hint}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
