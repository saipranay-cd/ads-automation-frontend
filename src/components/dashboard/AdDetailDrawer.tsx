"use client"

import Image from "next/image"
import { ExternalLink, ImageOff } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { StatusBadge } from "@/components/campaigns/StatusBadge"
import { Skeleton } from "@/components/ui/skeleton"
import { CopyButton } from "@/components/ui/copy-button"
import { MetricGrid } from "@/components/ui/metric-grid"
import { useAdDetail } from "@/hooks/use-campaigns"
import { fmt, fmtCurrencyPrecise as fmtCurrency } from "@/lib/format"

interface AdDetailDrawerProps {
  adId: string | null
  onClose: () => void
}

function statusVariant(s: string) {
  switch (s) {
    case "ACTIVE":
      return { status: "active" as const, label: "Active" }
    case "PAUSED":
      return { status: "paused" as const, label: "Paused" }
    default:
      return { status: "info" as const, label: s }
  }
}

function formatDate(iso: string | undefined) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return "—"
  }
}

export function AdDetailDrawer({ adId, onClose }: AdDetailDrawerProps) {
  const open = !!adId
  const { data, isLoading, error } = useAdDetail(adId ?? undefined)

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          {isLoading || !data ? (
            <>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 pr-8">
                <DrawerTitle className="truncate">{data.name}</DrawerTitle>
                <StatusBadge {...statusVariant(data.status)} />
              </div>
              <DrawerDescription>
                {data.campaignName}
                {data.adSetName ? ` › ${data.adSetName}` : ""}
              </DrawerDescription>
            </>
          )}
        </DrawerHeader>

        <DrawerBody>
          {error ? (
            <div
              className="rounded-md border px-3 py-2 text-xs"
              style={{
                borderColor: "var(--border-default)",
                color: "var(--text-secondary)",
              }}
            >
              {error.message || "Failed to load ad details"}
            </div>
          ) : isLoading || !data ? (
            <LoadingBody />
          ) : (
            <div className="flex flex-col gap-6">
              <CreativeSection data={data} />
              <MetricsSection data={data} />
              <MetadataSection data={data} />
            </div>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

// ─── Sections ──────────────────────────────────────────

function CreativeSection({ data }: { data: NonNullable<ReturnType<typeof useAdDetail>["data"]> }) {
  const { creative } = data
  const hasAnyCopy = creative.body || creative.title || creative.description || creative.cta

  return (
    <section>
      <SectionLabel>Creative</SectionLabel>

      <div
        className="overflow-hidden rounded-md"
        style={{ border: "1px solid var(--border-subtle)" }}
      >
        {creative.thumbnailUrl ? (
          <div
            className="relative aspect-[1.2/1] w-full"
            style={{ background: "var(--bg-subtle)" }}
          >
            <Image
              src={creative.thumbnailUrl}
              alt={data.name}
              fill
              sizes="560px"
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className="flex aspect-[1.2/1] w-full flex-col items-center justify-center gap-1.5 text-xs"
            style={{ background: "var(--bg-subtle)", color: "var(--text-tertiary)" }}
          >
            <ImageOff size={16} />
            No preview available
          </div>
        )}

        {hasAnyCopy && (
          <div
            className="flex flex-col gap-2 px-3 py-3"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            {creative.body && (
              <CopyLine label="Primary text" value={creative.body} multiline />
            )}
            {creative.title && <CopyLine label="Headline" value={creative.title} />}
            {creative.description && (
              <CopyLine label="Description" value={creative.description} multiline />
            )}
            {creative.cta && (
              <CopyLine label="CTA" value={formatCta(creative.cta)} />
            )}
          </div>
        )}
      </div>

      {creative.link && (
        <a
          href={creative.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex max-w-full items-center gap-1.5 truncate text-xs hover:underline"
          style={{ color: "var(--acc)" }}
        >
          <ExternalLink size={12} className="shrink-0" />
          <span className="truncate">{creative.link}</span>
        </a>
      )}
    </section>
  )
}

function MetricsSection({ data }: { data: NonNullable<ReturnType<typeof useAdDetail>["data"]> }) {
  const m = data.metrics
  return (
    <section>
      <SectionLabel>Performance</SectionLabel>
      <MetricGrid
        columns={3}
        items={[
          { label: "Spend", value: m.amountSpent > 0 ? fmtCurrency(m.amountSpent) : "—" },
          { label: "Leads", value: m.leads > 0 ? fmt(m.leads) : "—" },
          { label: "CPL", value: m.costPerLead != null ? fmtCurrency(m.costPerLead) : "—" },
          { label: "Impressions", value: m.impressions > 0 ? fmt(m.impressions) : "—" },
          { label: "Reach", value: m.reach > 0 ? fmt(m.reach) : "—" },
          { label: "Clicks", value: m.clicks > 0 ? fmt(m.clicks) : "—" },
          { label: "CTR", value: m.ctr > 0 ? `${m.ctr}%` : "—" },
          { label: "CPC", value: m.cpc > 0 ? fmtCurrency(m.cpc) : "—" },
          { label: "CPM", value: m.cpm > 0 ? fmtCurrency(m.cpm) : "—" },
        ]}
      />
    </section>
  )
}

function MetadataSection({ data }: { data: NonNullable<ReturnType<typeof useAdDetail>["data"]> }) {
  return (
    <section>
      <SectionLabel>Details</SectionLabel>
      <dl
        className="flex flex-col gap-px overflow-hidden rounded-md"
        style={{ background: "var(--border-subtle)" }}
      >
        <MetaRow label="Ad ID" value={data.id} copyable />
        <MetaRow label="Ad Set" value={data.adSetName} subValue={data.adSetId} />
        <MetaRow label="Campaign" value={data.campaignName} subValue={data.campaignId} />
        {data.objective && <MetaRow label="Objective" value={data.objective} />}
        <MetaRow label="Created" value={formatDate(data.createdAt)} />
        <MetaRow label="Updated" value={formatDate(data.updatedAt)} />
      </dl>
    </section>
  )
}

// ─── Helpers ──────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="mb-2 text-[10px] font-medium uppercase tracking-[0.08em]"
      style={{ color: "var(--text-tertiary)" }}
    >
      {children}
    </h3>
  )
}

function CopyLine({
  label,
  value,
  multiline,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[10px] uppercase tracking-[0.06em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {label}
        </span>
        <CopyButton value={value} />
      </div>
      <p
        className={`text-[13px] ${multiline ? "whitespace-pre-wrap" : "truncate"}`}
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  )
}

function MetaRow({
  label,
  value,
  subValue,
  copyable,
}: {
  label: string
  value: string
  subValue?: string
  copyable?: boolean
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-3 py-2"
      style={{ background: "var(--bg-base)" }}
    >
      <dt
        className="shrink-0 text-[11px]"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </dt>
      <dd className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-col items-end">
          <span
            className="truncate text-[12px]"
            style={{ color: "var(--text-primary)" }}
          >
            {value}
          </span>
          {subValue && (
            <span
              className="truncate font-mono text-[10px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              {subValue}
            </span>
          )}
        </div>
        {copyable && <CopyButton value={value} />}
      </dd>
    </div>
  )
}

function LoadingBody() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-48 w-full rounded-md" />
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>
    </div>
  )
}

function formatCta(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
