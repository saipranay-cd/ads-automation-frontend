"use client"

import { ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string
  delta?: number
  deltaIsGood?: boolean
  subtext?: string
  isFirst?: boolean
}

export function MetricCard({
  label,
  value,
  delta,
  deltaIsGood = true,
  subtext,
  isFirst = false,
}: MetricCardProps) {
  const deltaUp = delta !== undefined && delta > 0
  const deltaColor =
    delta === undefined
      ? undefined
      : deltaUp
        ? deltaIsGood
          ? "var(--green-text)"
          : "var(--red-text)"
        : deltaIsGood
          ? "var(--red-text)"
          : "var(--green-text)"

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] p-4 shadow-[var(--shadow-card)]",
        isFirst && "border-t-2 border-t-[var(--acc)]"
      )}
    >
      <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
        {label}
      </span>
      <span className="font-mono text-[22px] font-semibold leading-8 tracking-tight text-[var(--text-primary)]">
        {value}
      </span>
      {(delta !== undefined || subtext) && (
        <div className="flex items-center gap-1.5">
          {delta !== undefined && (
            <span
              className="flex items-center gap-0.5 text-[11px] font-medium"
              style={{ color: deltaColor }}
            >
              {deltaUp ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {subtext && (
            <span className="text-[11px] text-[var(--text-tertiary)]">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
