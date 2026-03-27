"use client"

import { useQuery } from "@tanstack/react-query"
import { useAppStore } from "@/lib/store"
import { TrendingUp, TrendingDown, Clock, AlertCircle, AlertTriangle, Info, Users } from "lucide-react"

interface Prediction {
  type: string
  campaignId: string
  campaignName: string
  severity: "info" | "warning" | "critical"
  title: string
  description: string
  metric: string
  currentValue: number
  projectedValue: number
  daysUntilEvent?: number
}

const severityConfig = {
  critical: { icon: AlertCircle, color: "#f87171", bg: "rgba(248,113,113,0.08)" },
  warning: { icon: AlertTriangle, color: "#fbbf24", bg: "rgba(251,191,36,0.08)" },
  info: { icon: Info, color: "#60a5fa", bg: "rgba(96,165,250,0.08)" },
}

const typeIcon: Record<string, typeof TrendingUp> = {
  audience_exhaustion: Users,
  cpl_projection: TrendingUp,
  budget_pacing: Clock,
}

export function PredictionsPanel() {
  const adAccountId = useAppStore((s) => s.selectedAdAccountId)

  const { data, isLoading } = useQuery<{ data: Prediction[] }>({
    queryKey: ["predictions", adAccountId],
    queryFn: async () => {
      const res = await fetch(`/api/meta/predictions?adAccountId=${adAccountId}`)
      return res.json()
    },
    enabled: !!adAccountId,
    refetchInterval: 5 * 60 * 1000, // Every 5 min
  })

  const predictions = data?.data || []

  if (isLoading) return null
  if (predictions.length === 0) return null

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: "var(--bg-base)",
        border: "1px solid var(--border-default)",
      }}
    >
      <h3
        className="mb-3 text-[10px] font-medium uppercase tracking-[0.06em]"
        style={{ color: "var(--text-tertiary)" }}
      >
        Predictions
      </h3>
      <div className="flex flex-col gap-2">
        {predictions.slice(0, 5).map((p, i) => {
          const config = severityConfig[p.severity]
          const Icon = typeIcon[p.type] || TrendingUp
          return (
            <div
              key={i}
              className="flex gap-3 rounded-lg px-3 py-2.5"
              style={{ background: config.bg }}
            >
              <div className="mt-0.5 shrink-0">
                <Icon size={14} style={{ color: config.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  {p.title}
                </span>
                <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {p.description}
                </p>
                <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  {p.campaignName}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
