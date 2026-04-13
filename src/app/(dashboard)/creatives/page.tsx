"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import NextImage from "next/image"
import { apiFetch } from "@/lib/api-fetch"
import { useAppStore } from "@/lib/store"
import {
  Trophy, AlertTriangle, TrendingDown, TrendingUp, Image,
  Layers, BarChart3, Zap, ImageOff, Play, Pause, Volume2, VolumeX,
  ChevronLeft, ChevronRight, X,
} from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

// ── Types ──────────────────────────────────────────────

interface CarouselImage {
  image_url: string
  link?: string
  name?: string
  description?: string
}

interface Creative {
  id: string
  name: string
  status: string
  adSetName: string
  campaignName: string
  campaignId: string
  imageUrl: string | null
  videoSourceUrl: string | null
  isVideo: boolean
  carouselImages: CarouselImage[] | null
  facebookPostUrl: string | null
  thumbnailUrl: string | null
  creativeName: string | null
  totalSpend: number
  totalClicks: number
  totalImpressions: number
  avgCtr: number
  avgCpc: number
  ctrTimeline: { date: string; ctr: number; spend: number }[]
  fatigueScore: number
  daysActive: number
  isWinner: boolean
  isFatigued: boolean
}

// ── Helpers ────────────────────────────────────────────

import { fmtCurrency, fmtCompact as fmtNum } from "@/lib/format"

// ── Main ───────────────────────────────────────────────

export default function CreativesPage() {
  const adAccountId = useAppStore((s) => s.selectedAdAccountId)
  const [filter, setFilter] = useState<"all" | "winners" | "fatigued">("all")
  const [sortBy, setSortBy] = useState<"spend" | "ctr" | "cpc" | "fatigue">("spend")
  const [lightbox, setLightbox] = useState<Creative | null>(null)

  const { data, isLoading } = useQuery<{ data: Creative[] }>({
    queryKey: ["creatives", adAccountId],
    queryFn: async () => {
      const res = await apiFetch(`/api/meta/creatives?adAccountId=${adAccountId}`)
      return res.json()
    },
    enabled: !!adAccountId,
  })

  const creatives = useMemo(() => data?.data || [], [data])

  const filtered = useMemo(() => {
    const list = creatives.filter((c) => {
      if (filter === "winners") return c.isWinner
      if (filter === "fatigued") return c.isFatigued
      return true
    })
    list.sort((a, b) => {
      switch (sortBy) {
        case "ctr": return b.avgCtr - a.avgCtr
        case "cpc": return a.avgCpc - b.avgCpc
        case "fatigue": return b.fatigueScore - a.fatigueScore
        default: return b.totalSpend - a.totalSpend
      }
    })
    return list
  }, [creatives, filter, sortBy])

  const winners = creatives.filter((c) => c.isWinner).length
  const fatigued = creatives.filter((c) => c.isFatigued).length
  const totalSpend = creatives.reduce((s, c) => s + c.totalSpend, 0)
  const avgCtr = creatives.length > 0 ? creatives.reduce((s, c) => s + c.avgCtr, 0) / creatives.length : 0

  const filters = [
    { key: "all" as const, label: "All", count: creatives.length },
    { key: "winners" as const, label: "Winners", count: winners, color: "#4ade80" },
    { key: "fatigued" as const, label: "Fatigued", count: fatigued, color: "#fbbf24" },
  ]

  const sorts = [
    { key: "spend" as const, label: "Spend" },
    { key: "ctr" as const, label: "CTR" },
    { key: "cpc" as const, label: "CPC" },
    { key: "fatigue" as const, label: "Fatigue" },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Creative Testing</h2>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Compare ad creatives, spot winners, detect fatigue. Click any creative to view full size.
          </p>
        </div>
        {creatives.length > 0 && (
          <div className="hidden items-center gap-4 rounded-lg px-5 py-3 sm:flex" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}>
            <HeaderStat label="Creatives" value={String(creatives.length)} icon={<Layers size={13} />} />
            <Divider />
            <HeaderStat label="Spend" value={fmtCurrency(totalSpend)} icon={<BarChart3 size={13} />} />
            <Divider />
            <HeaderStat label="Avg CTR" value={`${avgCtr.toFixed(2)}%`} icon={<Zap size={13} />} />
          </div>
        )}
      </div>

      {/* Filter + sort */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "var(--bg-subtle)" }}>
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: filter === f.key ? "var(--bg-base)" : "transparent",
                color: filter === f.key ? (f.color || "var(--text-primary)") : "var(--text-tertiary)",
                boxShadow: filter === f.key ? "var(--shadow-card)" : "none",
              }}
            >
              {f.label}
              {f.count > 0 && (
                <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ background: f.color ? `${f.color}14` : "var(--bg-muted)", color: f.color || "var(--text-tertiary)" }}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-medium" style={{ color: "var(--text-disabled)" }}>Sort:</span>
          {sorts.map((s) => (
            <button key={s.key} onClick={() => setSortBy(s.key)} className="rounded-md px-2 py-1 text-[10px] font-medium transition-all"
              style={{ background: sortBy === s.key ? "var(--acc-subtle)" : "transparent", color: sortBy === s.key ? "var(--acc-text)" : "var(--text-tertiary)" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-lg" style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Image}
          title={filter === "all" ? "No creatives found" : `No ${filter} creatives`}
          description="Sync your ad account to load your creatives"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c, i) => (
            <CreativeCard key={c.id} creative={c} rank={i + 1} onOpenLightbox={() => setLightbox(c)} />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && <Lightbox creative={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

// ── Creative Media ─────────────────────────────────────

function CreativeMedia({
  creative: c,
  onClick,
  className = "",
}: {
  creative: Creative
  onClick?: () => void
  className?: string
}) {
  const [imgError, setImgError] = useState(false)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  const hasCarousel = c.carouselImages && c.carouselImages.length > 1
  const displayUrl = hasCarousel
    ? c.carouselImages![carouselIdx]?.image_url
    : c.imageUrl || c.thumbnailUrl

  // Video ad with playable source
  if (c.isVideo && c.videoSourceUrl) {
    return (
      <div className={`relative overflow-hidden ${className}`} style={{ background: "#000" }}>
        <video
          ref={videoRef}
          src={c.videoSourceUrl}
          poster={c.imageUrl || c.thumbnailUrl || undefined}
          className="h-full w-full object-contain"
          muted={isMuted}
          loop
          playsInline
          onClick={() => {
            if (videoRef.current) {
              if (isPlaying) videoRef.current.pause()
              else videoRef.current.play()
              setIsPlaying(!isPlaying)
            }
          }}
        />
        {/* Video controls */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); if (videoRef.current) { if (isPlaying) videoRef.current.pause(); else videoRef.current.play(); setIsPlaying(!isPlaying) } }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); if (videoRef.current) videoRef.current.muted = !isMuted }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
          >
            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
        </div>
        {!isPlaying && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
              <Play size={20} className="ml-1 text-white" fill="white" />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Carousel
  if (hasCarousel) {
    return (
      <div className={`relative overflow-hidden ${className}`} style={{ background: "var(--bg-subtle)" }}>
        {displayUrl && !imgError ? (
          <NextImage
            src={displayUrl}
            alt={c.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="cursor-pointer object-cover"
            onError={() => setImgError(true)}
            onClick={onClick}
            unoptimized
          />
        ) : (
          <NoPreview />
        )}
        {/* Carousel arrows */}
        <button
          onClick={(e) => { e.stopPropagation(); setCarouselIdx(Math.max(0, carouselIdx - 1)) }}
          aria-label="Previous image"
          className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm disabled:opacity-30"
          disabled={carouselIdx === 0}
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setCarouselIdx(Math.min(c.carouselImages!.length - 1, carouselIdx + 1)) }}
          aria-label="Next image"
          className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm disabled:opacity-30"
          disabled={carouselIdx === c.carouselImages!.length - 1}
        >
          <ChevronRight size={14} />
        </button>
        {/* Dots */}
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
          {c.carouselImages!.map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i === carouselIdx ? "white" : "rgba(255,255,255,0.4)" }} />
          ))}
        </div>
      </div>
    )
  }

  // Single image (or video thumbnail with play overlay)
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: "var(--bg-subtle)" }}>
      {displayUrl && !imgError ? (
        <>
          <NextImage
            src={displayUrl}
            alt={c.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="cursor-pointer object-cover transition-transform hover:scale-[1.02]"
            onError={() => setImgError(true)}
            onClick={onClick}
            unoptimized
          />
          {/* Video overlay — clicking opens lightbox */}
          {c.isVideo && !c.videoSourceUrl && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer"
              onClick={onClick}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                <Play size={20} className="ml-1 text-white" fill="white" />
              </div>
            </div>
          )}
        </>
      ) : (
        <NoPreview />
      )}
    </div>
  )
}

function NoPreview() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
      <ImageOff size={28} style={{ color: "var(--text-disabled)" }} />
      <span className="text-[10px]" style={{ color: "var(--text-disabled)" }}>No preview available</span>
    </div>
  )
}

// ── Lightbox ───────────────────────────────────────────

function Lightbox({ creative: c, onClose }: { creative: Creative; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    },
    [onClose],
  )

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl"
        style={{ background: "var(--bg-base)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close lightbox"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* Media */}
          <CreativeMedia creative={c} className="h-[50vh] w-full lg:h-[80vh] lg:w-[60vw]" />

          {/* Info panel */}
          <div className="flex w-full flex-col gap-4 p-6 lg:w-80">
            <div>
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{c.name}</h3>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{c.campaignName} → {c.adSetName}</p>
            </div>

            <div className="flex items-center gap-2">
              <StatusPill status={c.status} />
              {c.isVideo && <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-400">Video</span>}
              {c.isWinner && <Badge label="Winner" color="#4ade80" icon={<Trophy size={9} />} />}
              {c.isFatigued && <Badge label="Fatigued" color="#fbbf24" icon={<AlertTriangle size={9} />} />}
            </div>

            {c.isVideo && c.facebookPostUrl && (
              <a
                href={c.facebookPostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition-all hover:opacity-90"
                style={{ background: "#1877F2" }}
              >
                <Play size={12} /> Watch on Facebook
              </a>
            )}

            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Spend" value={fmtCurrency(c.totalSpend)} />
              <MetricCard label="Impressions" value={fmtNum(c.totalImpressions)} />
              <MetricCard label="CTR" value={`${c.avgCtr}%`} good={c.isWinner} bad={c.avgCtr < 1} />
              <MetricCard label="CPC" value={fmtCurrency(c.avgCpc)} />
              <MetricCard label="Clicks" value={fmtNum(c.totalClicks)} />
              <MetricCard label="Days Active" value={String(c.daysActive)} />
            </div>

            {c.fatigueScore !== 0 && (
              <div className="flex items-center gap-1.5 rounded-lg px-3 py-2" style={{ background: c.fatigueScore > 0 ? "rgba(251,191,36,0.06)" : "rgba(74,222,128,0.06)" }}>
                {c.fatigueScore > 0 ? (
                  <>
                    <TrendingDown size={13} style={{ color: "#fbbf24" }} />
                    <span className="text-[11px] font-medium" style={{ color: "#fbbf24" }}>CTR declining {c.fatigueScore}%</span>
                  </>
                ) : (
                  <>
                    <TrendingUp size={13} style={{ color: "#4ade80" }} />
                    <span className="text-[11px] font-medium" style={{ color: "#4ade80" }}>CTR improving {Math.abs(c.fatigueScore)}%</span>
                  </>
                )}
              </div>
            )}

            {/* Sparkline in lightbox */}
            {c.ctrTimeline.length > 2 && (
              <div>
                <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "var(--text-disabled)" }}>CTR Trend</span>
                <Sparkline timeline={c.ctrTimeline} isFatigued={c.isFatigued} isWinner={c.isWinner} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Creative Card ──────────────────────────────────────

function CreativeCard({ creative: c, rank, onOpenLightbox }: { creative: Creative; rank: number; onOpenLightbox: () => void }) {
  const timeline = c.ctrTimeline.slice(-14)
  const borderColor = c.isWinner ? "rgba(74,222,128,0.35)" : c.isFatigued ? "rgba(251,191,36,0.25)" : "var(--border-default)"

  return (
    <div className="flex flex-col overflow-hidden rounded-lg transition-all" style={{ background: "var(--bg-base)", border: `1.5px solid ${borderColor}` }}>
      {/* Creative media */}
      <div className="relative">
        <CreativeMedia creative={c} onClick={onOpenLightbox} className="h-48" />

        {/* Overlays */}
        <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold backdrop-blur-sm"
          style={{ background: rank <= 3 ? "var(--accent-primary)" : "rgba(0,0,0,0.5)", color: "white" }}>
          {rank}
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-1">
          {c.isWinner && <Badge label="Winner" color="#4ade80" icon={<Trophy size={9} />} />}
          {c.isFatigued && <Badge label="Fatigued" color="#fbbf24" icon={<AlertTriangle size={9} />} title="How tired your audience is of seeing this creative. Higher = more fatigued, consider refreshing." />}
        </div>
        <StatusPill status={c.status} className="absolute bottom-2 left-2" />
        {c.isVideo && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
            VIDEO
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <span className="truncate text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{c.name}</span>
        <span className="mb-3 truncate text-[11px]" style={{ color: "var(--text-tertiary)" }}>{c.campaignName} → {c.adSetName}</span>

        {/* Key metrics as prominent numbers */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg px-3 py-2" style={{ background: "var(--bg-subtle)" }}>
            <div className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "var(--text-disabled)" }}>Spent</div>
            <div className="font-mono text-base font-bold" style={{ color: "var(--text-primary)" }}>{fmtCurrency(c.totalSpend)}</div>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: "var(--bg-subtle)" }}>
            <div className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "var(--text-disabled)" }}>Click-through rate</div>
            <div className="font-mono text-base font-bold" style={{ color: c.isWinner ? "#4ade80" : c.avgCtr < 1 ? "#f87171" : "var(--text-primary)" }}>
              {c.avgCtr}%
            </div>
          </div>
        </div>

        {/* Secondary metrics inline */}
        <div className="mb-3 flex items-center gap-4 px-1 text-[11px]">
          <span style={{ color: "var(--text-tertiary)" }}><b style={{ color: "var(--text-secondary)" }}>{fmtNum(c.totalClicks)}</b> clicks</span>
          <span style={{ color: "var(--text-tertiary)" }}><b style={{ color: "var(--text-secondary)" }}>{fmtCurrency(c.avgCpc)}</b> per click</span>
          <span style={{ color: "var(--text-tertiary)" }}><b style={{ color: "var(--text-secondary)" }}>{c.daysActive}d</b> active</span>
        </div>

        {/* CTR trend chart with clear labels */}
        {timeline.length > 2 && (
          <div className="mb-2">
            <div className="mb-1 flex items-center justify-between px-1">
              <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                Daily click-through rate
              </span>
              {c.fatigueScore !== 0 && (
                <span
                  className="flex items-center gap-1 text-[10px] font-semibold"
                  style={{ color: c.fatigueScore > 0 ? "#fbbf24" : "#4ade80" }}
                  title="How tired your audience is of seeing this creative. Higher = more fatigued, consider refreshing."
                >
                  {c.fatigueScore > 0 ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                  {c.fatigueScore > 0 ? `${c.fatigueScore}% decline` : `${Math.abs(c.fatigueScore)}% growth`}
                </span>
              )}
            </div>
            <CtrChart timeline={timeline} isFatigued={c.isFatigued} isWinner={c.isWinner} />
          </div>
        )}

        {/* Action recommendation */}
        {c.fatigueScore > 20 && (
          <div className="mt-auto flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
            <AlertTriangle size={13} style={{ color: "#fbbf24" }} />
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              CTR dropped {c.fatigueScore}% this week. Consider pausing or refreshing the creative.
            </span>
          </div>
        )}
        {c.fatigueScore < -15 && (
          <div className="mt-auto flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)" }}>
            <TrendingUp size={13} style={{ color: "#4ade80" }} />
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              CTR grew {Math.abs(c.fatigueScore)}% this week. Good candidate to increase budget.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── CTR Chart with labels ──────────────────────────────

function CtrChart({ timeline, isFatigued, isWinner }: { timeline: { date: string; ctr: number }[]; isFatigued: boolean; isWinner: boolean }) {
  const data = timeline.slice(-7) // Last 7 days, one bar per day
  const maxCtr = Math.max(...data.map((x) => x.ctr), 0.5)
  const barColor = isFatigued ? "#fbbf24" : isWinner ? "#4ade80" : "#60a5fa"

  return (
    <div className="rounded-lg px-2 pb-1 pt-2" style={{ background: "var(--bg-subtle)" }}>
      {/* Bars with value labels */}
      <div className="flex items-end gap-1" style={{ height: 48 }}>
        {data.map((d, i) => {
          const barH = Math.max(4, (d.ctr / maxCtr) * 38)
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
              {/* Value on top of bar */}
              <span className="font-mono text-[8px] font-medium" style={{ color: d.ctr > 0 ? "var(--text-secondary)" : "var(--text-disabled)" }}>
                {d.ctr > 0 ? `${d.ctr.toFixed(1)}%` : ""}
              </span>
              {/* Bar */}
              <div
                className="w-full rounded-sm"
                style={{
                  height: barH,
                  background: barColor,
                  opacity: 0.4 + (i / data.length) * 0.6,
                }}
              />
            </div>
          )
        })}
      </div>
      {/* Date labels */}
      <div className="mt-1 flex gap-1">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center font-mono text-[8px]" style={{ color: "var(--text-disabled)" }}>
            {d.date.slice(8)}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Sparkline (compact, for lightbox) ──────────────────

function Sparkline({ timeline, isFatigued, isWinner }: { timeline: { date: string; ctr: number }[]; isFatigued: boolean; isWinner: boolean; compact?: boolean }) {
  // Reuse CtrChart for consistency
  return <CtrChart timeline={timeline} isFatigued={isFatigued} isWinner={isWinner} />
}

// ── Sub-components ─────────────────────────────────────

function Badge({ label, color, icon, title }: { label: string; color: string; icon: React.ReactNode; title?: string }) {
  return (
    <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm" style={{ background: `${color}cc`, color: "white" }} title={title}>
      {icon} {label}
    </span>
  )
}

function StatusPill({ status, className = "" }: { status: string; className?: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold backdrop-blur-sm ${className}`}
      style={{ background: status === "ACTIVE" ? "rgba(74,222,128,0.9)" : "rgba(0,0,0,0.5)", color: "white" }}>
      {status}
    </span>
  )
}

function MetricCard({ label, value, good, bad }: { label: string; value: string; good?: boolean; bad?: boolean }) {
  return (
    <div className="rounded-lg px-3 py-2" style={{ background: "var(--bg-subtle)" }}>
      <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "var(--text-disabled)" }}>{label}</span>
      <span className="block font-mono text-sm font-bold" style={{ color: good ? "#4ade80" : bad ? "#f87171" : "var(--text-primary)" }}>{value}</span>
    </div>
  )
}

function HeaderStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">
        <span style={{ color: "var(--text-disabled)" }}>{icon}</span>
        <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{label}</span>
      </div>
      <span className="font-mono text-sm font-bold" style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  )
}

function Divider() {
  return <div className="h-8 w-px" style={{ background: "var(--border-subtle)" }} />
}
