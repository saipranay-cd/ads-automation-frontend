"use client"

import React from "react"
import type { IndustryMeta } from "@/config/industries"

interface Props {
  industry: IndustryMeta
  selected: boolean
  onClick: () => void
}

/**
 * Single industry card with lucide icon + label.
 * Used in the onboarding industry grid and the settings edit form.
 */
export function IndustryCard({ industry, selected, onClick }: Props) {
  const Icon = industry.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-center transition-all hover:opacity-90"
      style={{
        background: selected ? "var(--acc-subtle)" : "var(--bg-subtle)",
        color: selected ? "var(--acc-text)" : "var(--text-primary)",
        border: selected ? "1px solid var(--acc-border)" : "1px solid var(--border-default)",
      }}
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
        style={{
          background: selected ? "var(--acc)" : "var(--bg-base)",
          color: selected ? "#fff" : "var(--text-secondary)",
          border: selected ? "none" : "1px solid var(--border-subtle)",
        }}
      >
        <Icon size={15} strokeWidth={1.75} />
      </span>
      <span className="text-[11.5px] font-medium leading-tight">{industry.label}</span>
    </button>
  )
}
