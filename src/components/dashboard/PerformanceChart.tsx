"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface ChartColors {
  spend: string
  leads: string
  grid: string
  tick: string
  legendText: string
  tooltipBg: string
  tooltipBorder: string
  tooltipLabel: string
  tooltipShadow: string
  dotStroke: string
}

interface PerformanceChartProps {
  data: { date: string; spend: number; leads: number }[]
  colors: ChartColors
}

export function PerformanceChart({ data, colors }: PerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.spend} stopOpacity={0.3} />
            <stop offset="100%" stopColor={colors.spend} stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.leads} stopOpacity={0.25} />
            <stop offset="100%" stopColor={colors.leads} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis
          yAxisId="spend"
          tick={{ fontSize: 10, fill: colors.tick }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
        />
        <YAxis yAxisId="leads" orientation="right" tick={{ fontSize: 10, fill: colors.tick }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: colors.tooltipBg,
            border: `1px solid ${colors.tooltipBorder}`,
            borderRadius: 8,
            fontSize: 12,
            boxShadow: colors.tooltipShadow,
          }}
          itemStyle={{ padding: "2px 0" }}
          labelStyle={{ color: colors.tooltipLabel, marginBottom: 4, fontWeight: 500 }}
          formatter={(value, name) => {
            if (name === "Spend")
              return [
                new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value)),
                name,
              ]
            return [String(value), name]
          }}
        />
        <Legend
          iconType="circle"
          iconSize={6}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(val) => <span style={{ color: colors.legendText, marginLeft: 2 }}>{val}</span>}
        />
        <Area
          yAxisId="spend" type="monotone" dataKey="spend" name="Spend"
          stroke={colors.spend} strokeWidth={2} fill="url(#gradSpend)" dot={false}
          activeDot={{ r: 4, stroke: colors.dotStroke, strokeWidth: 2, fill: colors.spend }}
        />
        <Area
          yAxisId="leads" type="monotone" dataKey="leads" name="Leads"
          stroke={colors.leads} strokeWidth={2} fill="url(#gradLeads)" dot={false}
          activeDot={{ r: 4, stroke: colors.dotStroke, strokeWidth: 2, fill: colors.leads }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
