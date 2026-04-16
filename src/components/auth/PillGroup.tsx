"use client"

import React from "react"

export interface PillOption {
  id: string
  label: string
  desc?: string
}

interface Props {
  options: readonly PillOption[]
  value: string
  onChange: (id: string) => void
  columns?: 2 | 3 | 4
}

/**
 * Row/grid of selectable chips. One selected at a time.
 * Used in onboarding (team size, business type, primary goal).
 */
export function PillGroup({ options, value, onChange, columns = 3 }: Props) {
  const cols = columns === 4 ? "grid-cols-2 sm:grid-cols-4"
    : columns === 2 ? "grid-cols-2"
    : "grid-cols-2 sm:grid-cols-3"

  return (
    <div className={`grid gap-2 ${cols}`}>
      {options.map((opt) => {
        const selected = opt.id === value
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className="flex flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left text-[12px] font-medium transition-all hover:opacity-90"
            style={{
              background: selected ? "var(--acc-subtle)" : "var(--bg-subtle)",
              color: selected ? "var(--acc-text)" : "var(--text-primary)",
              border: selected ? "1px solid var(--acc-border)" : "1px solid var(--border-default)",
            }}
          >
            <span>{opt.label}</span>
            {opt.desc && (
              <span className="text-[10.5px] font-normal" style={{ color: selected ? "var(--acc-text)" : "var(--text-tertiary)" }}>
                {opt.desc}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
