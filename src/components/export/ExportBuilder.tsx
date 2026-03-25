"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DATA_GROUPS,
  DATA_POINTS,
  CATEGORIES,
  getRelevantPoints,
  buildExportSheet,
} from "@/lib/export-columns"
import { useExportStore } from "@/lib/export-store"

export interface ExportBuilderProps {
  open: boolean
  onClose: () => void
  allGroupData: Record<string, Record<string, string>[]>
  filePrefix: string
  dateLabel: string
}

export function ExportBuilder({ open, onClose, allGroupData, filePrefix, dateLabel }: ExportBuilderProps) {
  const addPreset = useExportStore((s) => s.addPreset)

  const [name, setName] = useState("")

  // Which data groups are enabled
  const [enabledGroups, setEnabledGroups] = useState<Set<string>>(() => {
    const s = new Set<string>()
    for (const g of DATA_GROUPS) {
      if ((allGroupData[g.key]?.length ?? 0) > 0) s.add(g.key)
    }
    return s
  })

  // Which data points are selected
  const [selectedPoints, setSelectedPoints] = useState<Set<string>>(
    () => new Set(DATA_POINTS.filter((dp) => dp.defaultOn).map((dp) => dp.key))
  )

  // Reset state each time dialog opens
  useEffect(() => {
    if (open) {
      setName("")
      const s = new Set<string>()
      for (const g of DATA_GROUPS) {
        if ((allGroupData[g.key]?.length ?? 0) > 0) s.add(g.key)
      }
      setEnabledGroups(s)
      setSelectedPoints(new Set(DATA_POINTS.filter((dp) => dp.defaultOn).map((dp) => dp.key)))
    }
  }, [open, allGroupData])

  const relevantPoints = useMemo(
    () => getRelevantPoints(enabledGroups),
    [enabledGroups]
  )

  const toggleGroup = useCallback((key: string) => {
    setEnabledGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const togglePoint = useCallback((key: string) => {
    setSelectedPoints((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const toggleCategory = useCallback(
    (catKey: string, on: boolean) => {
      setSelectedPoints((prev) => {
        const next = new Set(prev)
        for (const dp of DATA_POINTS) {
          if (dp.category === catKey) {
            if (on) next.add(dp.key)
            else next.delete(dp.key)
          }
        }
        return next
      })
    },
    []
  )

  const doExport = useCallback(
    (groups: string[], points: Set<string>) => {
      const sheets: { name: string; headers: string[]; rows: string[][] }[] = []
      for (const gk of groups) {
        const data = allGroupData[gk]
        if (!data?.length) continue
        const sheet = buildExportSheet(gk, data, points)
        if (sheet) sheets.push(sheet)
      }
      if (!sheets.length) return
      import("xlsx").then((XLSX) => {
        const wb = XLSX.utils.book_new()
        for (const s of sheets) {
          const ws = XLSX.utils.aoa_to_sheet([s.headers, ...s.rows])
          ws["!cols"] = s.headers.map((h) => ({
            wch: h.toLowerCase().includes("id")
              ? 22
              : h.toLowerCase().includes("campaign") ||
                  h.toLowerCase().includes("ad set") ||
                  h.toLowerCase().includes("ad ") ||
                  h === "Ad" ||
                  h === "Region" ||
                  h === "Placement"
                ? 30
                : h.toLowerCase().includes("url")
                  ? 50
                  : 14,
          }))
          XLSX.utils.book_append_sheet(wb, ws, s.name)
        }
        XLSX.writeFile(wb, `${filePrefix}_report.xlsx`)
      })
    },
    [allGroupData, filePrefix]
  )

  const handleDownload = useCallback(() => {
    doExport(Array.from(enabledGroups), selectedPoints)
    onClose()
  }, [enabledGroups, selectedPoints, doExport, onClose])

  const handleSaveAndDownload = useCallback(() => {
    if (name.trim()) {
      addPreset({
        name: name.trim(),
        groups: Array.from(enabledGroups),
        dataPoints: Array.from(selectedPoints),
      })
    }
    doExport(Array.from(enabledGroups), selectedPoints)
    onClose()
  }, [name, enabledGroups, selectedPoints, addPreset, doExport, onClose])

  const enabledCount = enabledGroups.size
  const selectedCount = Array.from(selectedPoints).filter((k) => relevantPoints.has(k)).length

  // Split categories: dimensions on left, everything else on right
  const dimensionCat = CATEGORIES.filter((c) => c.key === "dimension")
  const metricCats = CATEGORIES.filter((c) => c.key !== "dimension")

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent className="sm:max-w-3xl" showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-baseline gap-2">
            Custom Report
            <span
              className="text-[11px] font-normal"
              style={{ color: "var(--text-tertiary)" }}
            >
              {dateLabel}
            </span>
          </DialogTitle>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Select data sources and columns. Each source becomes a sheet with its applicable columns.
          </p>
        </DialogHeader>

        {/* Data Sources — horizontal chips */}
        <div>
          <div className="mb-2">
            <span
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: "var(--text-tertiary)" }}
            >
              Data Sources
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DATA_GROUPS.map((group) => {
              const enabled = enabledGroups.has(group.key)
              const hasData = (allGroupData[group.key]?.length ?? 0) > 0
              const Icon = group.icon
              return (
                <button
                  key={group.key}
                  onClick={() => hasData && toggleGroup(group.key)}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all"
                  style={{
                    border: `1px solid ${enabled ? "var(--acc)" : "var(--border-default)"}`,
                    background: enabled ? "color-mix(in srgb, var(--acc) 15%, transparent)" : "transparent",
                    color: enabled ? "var(--acc-text)" : "var(--text-secondary)",
                    opacity: hasData ? 1 : 0.35,
                  }}
                >
                  <Icon size={12} />
                  {group.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Two-column grid: Dimensions left, Metrics+Budget+Creative right */}
        <div
          className="grid grid-cols-2 overflow-hidden rounded-lg"
          style={{
            border: "1px solid var(--border-default)",
            height: 340,
            maxHeight: "50vh",
          }}
        >
          {/* Left column — Dimensions */}
          <div
            className="flex flex-col overflow-y-auto"
            style={{
              borderRight: "1px solid var(--border-default)",
              background: "var(--bg-base)",
            }}
          >
            {dimensionCat.map((cat) => {
              const points = DATA_POINTS.filter((dp) => dp.category === cat.key)
              const allOn = points.every((dp) => selectedPoints.has(dp.key))
              return (
                <div key={cat.key}>
                  <div
                    className="sticky top-0 z-10 flex items-center justify-between px-3 py-1.5"
                    style={{
                      background: "var(--bg-subtle)",
                      borderBottom: "1px solid var(--border-default)",
                    }}
                  >
                    <span
                      className="text-[10px] font-medium uppercase tracking-wider"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {cat.label}
                    </span>
                    <button
                      onClick={() => toggleCategory(cat.key, !allOn)}
                      className="text-[10px] font-medium"
                      style={{ color: "var(--acc-text)" }}
                    >
                      {allOn ? "None" : "All"}
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5 px-2 py-1">
                    {points.map((dp) => {
                      const selected = selectedPoints.has(dp.key)
                      const relevant = relevantPoints.has(dp.key)
                      return (
                        <button
                          key={dp.key}
                          onClick={() => togglePoint(dp.key)}
                          className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors"
                          style={{
                            background: selected ? "var(--bg-subtle)" : "transparent",
                            opacity: relevant ? 1 : 0.4,
                          }}
                        >
                          <div
                            className="flex size-3.5 shrink-0 items-center justify-center rounded-sm"
                            style={{
                              border: `1px solid ${selected ? "var(--acc)" : "var(--border-default)"}`,
                              background: selected ? "var(--acc)" : "transparent",
                            }}
                          >
                            {selected && (
                              <Check size={9} style={{ color: "var(--acc-text)" }} />
                            )}
                          </div>
                          <span
                            className="text-xs"
                            style={{
                              color: selected ? "var(--text-primary)" : "var(--text-secondary)",
                            }}
                          >
                            {dp.label}
                          </span>
                          {!relevant && dp.groups && (
                            <span
                              className="ml-auto text-[9px]"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              {dp.groups
                                .map((g) => DATA_GROUPS.find((dg) => dg.key === g)?.name ?? g)
                                .join(", ")}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right column — Performance, Budget & Results, Creative */}
          <div
            className="flex flex-col overflow-y-auto"
            style={{ background: "var(--bg-base)" }}
          >
            {metricCats.map((cat) => {
              const points = DATA_POINTS.filter((dp) => dp.category === cat.key)
              const allOn = points.every((dp) => selectedPoints.has(dp.key))
              return (
                <div key={cat.key}>
                  <div
                    className="sticky top-0 z-10 flex items-center justify-between px-3 py-1.5"
                    style={{
                      background: "var(--bg-subtle)",
                      borderBottom: "1px solid var(--border-default)",
                    }}
                  >
                    <span
                      className="text-[10px] font-medium uppercase tracking-wider"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {cat.label}
                    </span>
                    <button
                      onClick={() => toggleCategory(cat.key, !allOn)}
                      className="text-[10px] font-medium"
                      style={{ color: "var(--acc-text)" }}
                    >
                      {allOn ? "None" : "All"}
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5 px-2 py-1">
                    {points.map((dp) => {
                      const selected = selectedPoints.has(dp.key)
                      const relevant = relevantPoints.has(dp.key)
                      return (
                        <button
                          key={dp.key}
                          onClick={() => togglePoint(dp.key)}
                          className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors"
                          style={{
                            background: selected ? "var(--bg-subtle)" : "transparent",
                            opacity: relevant ? 1 : 0.4,
                          }}
                        >
                          <div
                            className="flex size-3.5 shrink-0 items-center justify-center rounded-sm"
                            style={{
                              border: `1px solid ${selected ? "var(--acc)" : "var(--border-default)"}`,
                              background: selected ? "var(--acc)" : "transparent",
                            }}
                          >
                            {selected && (
                              <Check size={9} style={{ color: "var(--acc-text)" }} />
                            )}
                          </div>
                          <span
                            className="text-xs"
                            style={{
                              color: selected ? "var(--text-primary)" : "var(--text-secondary)",
                            }}
                          >
                            {dp.label}
                          </span>
                          {!relevant && dp.groups && (
                            <span
                              className="ml-auto text-[9px]"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              {dp.groups
                                .map((g) => DATA_GROUPS.find((dg) => dg.key === g)?.name ?? g)
                                .join(", ")}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer: summary + name input + action buttons */}
        <div
          className="flex flex-col gap-3 pt-1"
          style={{ borderTop: "1px solid var(--border-default)" }}
        >
          <div
            className="text-[11px] font-medium"
            style={{ color: "var(--text-tertiary)" }}
          >
            {enabledCount} source{enabledCount !== 1 ? "s" : ""} &middot; {selectedCount} column{selectedCount !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Report name (optional — needed to save)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-w-0 flex-1 rounded-md px-3 py-1.5 text-xs outline-none"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
            <button
              onClick={handleDownload}
              disabled={!enabledCount}
              className="shrink-0 rounded-md px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
              style={{
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                background: "transparent",
              }}
            >
              Download
            </button>
            <button
              onClick={handleSaveAndDownload}
              disabled={!enabledCount || !name.trim()}
              className="shrink-0 rounded-md px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
              style={{
                background: "var(--acc)",
                color: "var(--acc-text)",
              }}
            >
              Save & Download
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
