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
      className="flex flex-col gap-1 rounded-lg p-4"
      style={{
        background: "var(--bg-base)",
        border: "1px solid var(--border-default)",
        borderTop: isFirst ? "2px solid var(--acc)" : undefined,
        boxShadow: "var(--shadow-card)",
      }}
    >
      <span
        className="text-[10px] font-medium uppercase tracking-[0.06em]"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
      <span
        className="font-mono text-[22px] font-semibold leading-8"
        style={{
          color: "var(--text-primary)",
          letterSpacing: "-0.5px",
        }}
      >
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
            <span
              className="text-[11px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
