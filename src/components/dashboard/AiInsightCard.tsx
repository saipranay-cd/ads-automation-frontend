"use client"

import { X, Sparkles, AlertTriangle, Lightbulb, AlertCircle } from "lucide-react"

type InsightType = "ai" | "budget" | "opportunity" | "warning"

const borderColors: Record<InsightType, string> = {
  ai: "var(--acc)",
  budget: "var(--amber-solid)",
  opportunity: "var(--blue-solid)",
  warning: "var(--red-solid)",
}

const tagStyles: Record<InsightType, { bg: string; text: string }> = {
  ai: { bg: "var(--acc-subtle)", text: "var(--acc-text)" },
  budget: { bg: "var(--amber-bg)", text: "var(--amber-text)" },
  opportunity: { bg: "var(--blue-bg)", text: "var(--blue-text)" },
  warning: { bg: "var(--red-bg)", text: "var(--red-text)" },
}

const typeIcons: Record<InsightType, typeof Sparkles> = {
  ai: Sparkles,
  budget: AlertTriangle,
  opportunity: Lightbulb,
  warning: AlertCircle,
}

interface AiInsightCardProps {
  type: InsightType
  tag: string
  title: string
  body: string
  ctaLabel?: string
  onCtaClick?: () => void
  onDismiss?: () => void
}

export function AiInsightCard({
  type,
  tag,
  title,
  body,
  ctaLabel,
  onCtaClick,
  onDismiss,
}: AiInsightCardProps) {
  const tagStyle = tagStyles[type]
  const Icon = typeIcons[type]
  return (
    <div
      className="flex flex-col gap-2.5 rounded-lg p-3.5"
      style={{
        background: "var(--bg-base)",
        border: "1px solid var(--border-default)",
        borderTop: `2px solid ${borderColors[type]}`,
        boxShadow: "var(--shadow-card)",
        animation: "fade-in 200ms cubic-bezier(0.25, 1, 0.5, 1)",
      }}
    >
      <div className="flex items-start justify-between">
        <span
          className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]"
          style={{ background: tagStyle.bg, color: tagStyle.text }}
        >
          <Icon size={10} />
          {tag}
        </span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex h-5 w-5 items-center justify-center rounded"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X size={12} />
          </button>
        )}
      </div>
      <h4
        className="text-[13px] font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h4>
      <p
        className="line-clamp-2 text-xs leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {body}
      </p>
      {ctaLabel && (
        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={onCtaClick}
            className="rounded-md px-3 py-1 text-[11px] font-medium text-white transition-all"
            style={{ background: "var(--acc)" }}
          >
            {ctaLabel}
          </button>
          <button
            onClick={onDismiss}
            className="rounded-md px-3 py-1 text-[11px] font-medium transition-all"
            style={{
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
