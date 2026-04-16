"use client"

import Image from "next/image"
import {
  ExternalLink,
  Phone,
  MapPin,
  AppWindow,
  Tag,
  FileText,
  Link as LinkIcon,
  ImageIcon,
} from "lucide-react"
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
import { googleStatusMap } from "@/lib/chart-theme"
import {
  fmtUS as fmt,
  fmtCurrencyPrecise as fmtCurrency,
  fmtPercent,
} from "@/lib/format"
import { useGoogleAdDetail } from "@/hooks/use-google"
import type {
  GoogleAdRow,
  GoogleAdDetail,
  GoogleAssetScope,
  GoogleSitelinkAsset,
  GoogleCalloutAsset,
  GoogleStructuredSnippetAsset,
  GoogleCallAsset,
  GoogleLeadFormAsset,
  GoogleLocationAsset,
  GooglePriceAsset,
  GoogleAppAsset,
  GooglePromotionAsset,
  GoogleImageAsset,
  GoogleBusinessNameAsset,
} from "@/types/google-ads"
import type { DateRange } from "@/hooks/use-campaigns"

interface GoogleAdDetailDrawerProps {
  adId: string | null
  initial?: GoogleAdRow | null
  days?: number
  dateRange?: DateRange
  onClose: () => void
}

export function GoogleAdDetailDrawer({
  adId,
  initial,
  days = 30,
  dateRange,
  onClose,
}: GoogleAdDetailDrawerProps) {
  const open = !!adId
  const { data, isLoading, error } = useGoogleAdDetail(adId, days, dateRange)

  // Show initial row data immediately so the drawer isn't blank while fetching
  const headline = data?.headlines?.[0] || initial?.headlines?.[0] || "Untitled ad"
  const status = data?.status || initial?.status
  const adGroupName = data?.adGroupName || initial?.adGroupName
  const adType = data?.adType || initial?.adType

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center gap-2 pr-8">
            <DrawerTitle className="truncate">{headline}</DrawerTitle>
            {status && <StatusBadge {...googleStatusMap(status)} />}
          </div>
          <DrawerDescription>
            {adGroupName}
            {adType ? ` · ${adType}` : ""}
          </DrawerDescription>
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
              <AssetsSection assets={data.assets} />
              <MetricsSection data={data} />
              <MetadataSection data={data} />
            </div>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

// ─── Core sections ────────────────────────────────────

function CreativeSection({ data }: { data: GoogleAdDetail }) {
  const headlines = data.headlines ?? []
  const descriptions = data.descriptions ?? []

  return (
    <section className="flex flex-col gap-4">
      <SectionLabel>Creative</SectionLabel>

      {headlines.length > 0 && (
        <CopyList label="Headlines" items={headlines} />
      )}

      {descriptions.length > 0 && (
        <CopyList label="Descriptions" items={descriptions} multiline />
      )}

      {data.finalUrl && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <FieldLabel>Final URL</FieldLabel>
            <CopyButton value={data.finalUrl} />
          </div>
          <a
            href={data.finalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 truncate text-xs hover:underline"
            style={{ color: "var(--acc)" }}
          >
            <ExternalLink size={12} className="shrink-0" />
            <span className="truncate">{data.finalUrl}</span>
          </a>
        </div>
      )}
    </section>
  )
}

function AssetsSection({ assets }: { assets: GoogleAdDetail["assets"] }) {
  const total =
    assets.sitelinks.length +
    assets.callouts.length +
    assets.structuredSnippets.length +
    assets.calls.length +
    assets.leadForms.length +
    assets.locations.length +
    assets.prices.length +
    assets.apps.length +
    assets.promotions.length +
    assets.images.length +
    assets.businessLogos.length +
    (assets.businessName ? 1 : 0)

  if (total === 0) {
    return (
      <section>
        <SectionLabel>Assets</SectionLabel>
        <p
          className="text-xs"
          style={{ color: "var(--text-tertiary)" }}
        >
          No assets attached at the ad, ad group, campaign, or account level.
        </p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <SectionLabel>Assets · {total}</SectionLabel>

      {assets.businessName && (
        <AssetGroup title="Business name" count={1}>
          <AssetCard scope={assets.businessName.scope}>
            <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>
              {assets.businessName.text}
            </span>
          </AssetCard>
        </AssetGroup>
      )}

      {assets.businessLogos.length > 0 && (
        <AssetGroup title="Business logo" count={assets.businessLogos.length}>
          <div className="flex flex-wrap gap-2">
            {assets.businessLogos.map((logo) => (
              <ImageTile key={logo.id} asset={logo} size={64} />
            ))}
          </div>
        </AssetGroup>
      )}

      {assets.images.length > 0 && (
        <AssetGroup title="Images" count={assets.images.length}>
          <div className="flex flex-wrap gap-2">
            {assets.images.map((img) => (
              <ImageTile key={img.id} asset={img} size={88} />
            ))}
          </div>
        </AssetGroup>
      )}

      {assets.sitelinks.length > 0 && (
        <AssetGroup title="Sitelinks" count={assets.sitelinks.length}>
          {assets.sitelinks.map((s) => (
            <SitelinkCard key={s.id} sitelink={s} />
          ))}
        </AssetGroup>
      )}

      {assets.callouts.length > 0 && (
        <AssetGroup title="Callouts" count={assets.callouts.length}>
          <div className="flex flex-wrap gap-1.5">
            {assets.callouts.map((c) => (
              <CalloutPill key={c.id} callout={c} />
            ))}
          </div>
        </AssetGroup>
      )}

      {assets.structuredSnippets.length > 0 && (
        <AssetGroup title="Structured snippets" count={assets.structuredSnippets.length}>
          {assets.structuredSnippets.map((s) => (
            <StructuredSnippetCard key={s.id} snippet={s} />
          ))}
        </AssetGroup>
      )}

      {assets.calls.length > 0 && (
        <AssetGroup title="Calls" count={assets.calls.length}>
          {assets.calls.map((c) => (
            <IconRow
              key={c.id}
              scope={c.scope}
              icon={<Phone size={12} />}
              primary={c.phoneNumber}
              secondary={c.countryCode}
            />
          ))}
        </AssetGroup>
      )}

      {assets.leadForms.length > 0 && (
        <AssetGroup title="Lead forms" count={assets.leadForms.length}>
          {assets.leadForms.map((l) => (
            <LeadFormCard key={l.id} leadForm={l} />
          ))}
        </AssetGroup>
      )}

      {assets.locations.length > 0 && (
        <AssetGroup title="Locations" count={assets.locations.length}>
          {assets.locations.map((loc) => (
            <IconRow
              key={loc.id}
              scope={loc.scope}
              icon={<MapPin size={12} />}
              primary={loc.name || loc.placeId || "Location"}
              secondary={loc.placeId && loc.name ? loc.placeId : undefined}
            />
          ))}
        </AssetGroup>
      )}

      {assets.prices.length > 0 && (
        <AssetGroup title="Prices" count={assets.prices.length}>
          {assets.prices.map((p) => (
            <IconRow
              key={p.id}
              scope={p.scope}
              icon={<Tag size={12} />}
              primary={prettify(p.priceType)}
              secondary={`${p.offerings} offering${p.offerings === 1 ? "" : "s"}${p.qualifier ? ` · ${prettify(p.qualifier)}` : ""}`}
            />
          ))}
        </AssetGroup>
      )}

      {assets.apps.length > 0 && (
        <AssetGroup title="Apps" count={assets.apps.length}>
          {assets.apps.map((a) => (
            <IconRow
              key={a.id}
              scope={a.scope}
              icon={<AppWindow size={12} />}
              primary={a.linkText || a.appId}
              secondary={a.appStore ? prettify(a.appStore) : undefined}
            />
          ))}
        </AssetGroup>
      )}

      {assets.promotions.length > 0 && (
        <AssetGroup title="Promotions" count={assets.promotions.length}>
          {assets.promotions.map((p) => (
            <PromotionCard key={p.id} promotion={p} />
          ))}
        </AssetGroup>
      )}
    </section>
  )
}

function MetricsSection({ data }: { data: GoogleAdDetail }) {
  const m = data.metrics
  return (
    <section>
      <SectionLabel>Performance</SectionLabel>
      <MetricGrid
        columns={2}
        items={[
          { label: "Spend", value: m.spend > 0 ? fmtCurrency(m.spend) : "—" },
          { label: "Impressions", value: m.impressions > 0 ? fmt(m.impressions) : "—" },
          { label: "Clicks", value: m.clicks > 0 ? fmt(m.clicks) : "—" },
          { label: "CTR", value: m.ctr > 0 ? fmtPercent(m.ctr) : "—" },
          { label: "CPC", value: m.cpc > 0 ? fmtCurrency(m.cpc) : "—" },
        ]}
      />
    </section>
  )
}

function MetadataSection({ data }: { data: GoogleAdDetail }) {
  return (
    <section>
      <SectionLabel>Details</SectionLabel>
      <dl
        className="flex flex-col gap-px overflow-hidden rounded-md"
        style={{ background: "var(--border-subtle)" }}
      >
        <MetaRow label="Ad ID" value={data.id} copyable />
        <MetaRow label="Ad Group" value={data.adGroupName} subValue={data.adGroupId} />
        <MetaRow label="Campaign" value={data.campaignName} subValue={data.campaignId} />
        <MetaRow label="Type" value={data.adType} />
        <MetaRow label="Status" value={data.status} />
        <MetaRow label="Created" value={formatDate(data.createdAt)} />
        <MetaRow label="Updated" value={formatDate(data.updatedAt)} />
      </dl>
    </section>
  )
}

// ─── Asset cards ──────────────────────────────────────

function SitelinkCard({ sitelink }: { sitelink: GoogleSitelinkAsset }) {
  const href = sitelink.finalUrls?.[0]
  return (
    <AssetCard scope={sitelink.scope}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <LinkIcon size={12} style={{ color: "var(--text-tertiary)" }} />
          <span
            className="truncate text-[13px] font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {sitelink.linkText}
          </span>
        </div>
        {(sitelink.description1 || sitelink.description2) && (
          <div
            className="text-[11px]"
            style={{ color: "var(--text-secondary)" }}
          >
            {[sitelink.description1, sitelink.description2]
              .filter(Boolean)
              .join(" · ")}
          </div>
        )}
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-[11px] hover:underline"
            style={{ color: "var(--acc)" }}
          >
            {href}
          </a>
        )}
      </div>
    </AssetCard>
  )
}

function CalloutPill({ callout }: { callout: GoogleCalloutAsset }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
      style={{
        background: "var(--bg-subtle)",
        color: "var(--text-primary)",
        border: "1px solid var(--border-subtle)",
      }}
      title={`Scope: ${scopeLabel(callout.scope)}`}
    >
      {callout.text}
    </span>
  )
}

function StructuredSnippetCard({ snippet }: { snippet: GoogleStructuredSnippetAsset }) {
  return (
    <AssetCard scope={snippet.scope}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <FileText size={12} style={{ color: "var(--text-tertiary)" }} />
          <span
            className="text-[12px] font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {snippet.header}
          </span>
        </div>
        {snippet.values.length > 0 && (
          <div
            className="text-[11px]"
            style={{ color: "var(--text-secondary)" }}
          >
            {snippet.values.join(" · ")}
          </div>
        )}
      </div>
    </AssetCard>
  )
}

function LeadFormCard({ leadForm }: { leadForm: GoogleLeadFormAsset }) {
  return (
    <AssetCard scope={leadForm.scope}>
      <div className="flex flex-col gap-0.5">
        <span
          className="text-[13px] font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {leadForm.headline || leadForm.businessName}
        </span>
        {leadForm.businessName && leadForm.headline && (
          <span
            className="text-[11px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {leadForm.businessName}
          </span>
        )}
        {leadForm.description && (
          <span
            className="text-[11px]"
            style={{ color: "var(--text-secondary)" }}
          >
            {leadForm.description}
          </span>
        )}
      </div>
    </AssetCard>
  )
}

function PromotionCard({ promotion }: { promotion: GooglePromotionAsset }) {
  const label = promotion.promotionTarget || promotion.discountModifier || "Promotion"
  const window =
    promotion.redemptionStart || promotion.redemptionEnd
      ? `${promotion.redemptionStart || "…"} – ${promotion.redemptionEnd || "…"}`
      : null

  return (
    <AssetCard scope={promotion.scope}>
      <div className="flex flex-col gap-0.5">
        <span
          className="text-[13px] font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </span>
        {promotion.discountModifier && promotion.promotionTarget && (
          <span
            className="text-[11px]"
            style={{ color: "var(--text-secondary)" }}
          >
            {promotion.discountModifier}
          </span>
        )}
        {window && (
          <span
            className="text-[11px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {window}
          </span>
        )}
      </div>
    </AssetCard>
  )
}

function ImageTile({ asset, size }: { asset: GoogleImageAsset; size: number }) {
  if (!asset.url) {
    return (
      <div
        className="flex items-center justify-center rounded-md"
        style={{
          width: size,
          height: size,
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-tertiary)",
        }}
        title={asset.name}
      >
        <ImageIcon size={16} />
      </div>
    )
  }
  return (
    <div
      className="relative overflow-hidden rounded-md"
      style={{
        width: size,
        height: size,
        border: "1px solid var(--border-subtle)",
      }}
      title={asset.name}
    >
      <Image
        src={asset.url}
        alt={asset.name}
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
    </div>
  )
}

function IconRow({
  scope,
  icon,
  primary,
  secondary,
}: {
  scope: GoogleAssetScope
  icon: React.ReactNode
  primary: string
  secondary?: string
}) {
  return (
    <AssetCard scope={scope}>
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--text-tertiary)" }}>{icon}</span>
        <div className="flex min-w-0 flex-col">
          <span
            className="truncate text-[13px]"
            style={{ color: "var(--text-primary)" }}
          >
            {primary}
          </span>
          {secondary && (
            <span
              className="truncate text-[11px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              {secondary}
            </span>
          )}
        </div>
      </div>
    </AssetCard>
  )
}

// ─── Shared bits ──────────────────────────────────────

function AssetGroup({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] uppercase tracking-[0.06em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {title}
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  )
}

function AssetCard({
  scope,
  children,
}: {
  scope: GoogleAssetScope
  children: React.ReactNode
}) {
  return (
    <div
      className="flex items-start justify-between gap-2 rounded-md px-3 py-2"
      style={{
        background: "var(--bg-base)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <ScopeBadge scope={scope} />
    </div>
  )
}

function ScopeBadge({ scope }: { scope: GoogleAssetScope }) {
  return (
    <span
      className="shrink-0 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em]"
      style={{
        background: "var(--bg-subtle)",
        color: "var(--text-tertiary)",
      }}
      title={`Linked at ${scopeLabel(scope)} level`}
    >
      {scopeLabel(scope)}
    </span>
  )
}

function scopeLabel(scope: GoogleAssetScope): string {
  switch (scope) {
    case "ad":
      return "Ad"
    case "adGroup":
      return "Ad group"
    case "campaign":
      return "Campaign"
    case "customer":
      return "Account"
  }
}

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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] uppercase tracking-[0.06em]"
      style={{ color: "var(--text-tertiary)" }}
    >
      {children}
    </span>
  )
}

function CopyList({
  label,
  items,
  multiline,
}: {
  label: string
  items: string[]
  multiline?: boolean
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <FieldLabel>{label}</FieldLabel>
        <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
          {items.length}
        </span>
      </div>
      <ul
        className="flex flex-col gap-px overflow-hidden rounded-md"
        style={{ background: "var(--border-subtle)" }}
      >
        {items.map((text, i) => (
          <li
            key={i}
            className="flex items-start justify-between gap-2 px-3 py-2"
            style={{ background: "var(--bg-base)" }}
          >
            <span
              className={`text-[13px] ${multiline ? "whitespace-pre-wrap" : "truncate"}`}
              style={{ color: "var(--text-primary)" }}
            >
              {text}
            </span>
            <CopyButton value={text} className="shrink-0" />
          </li>
        ))}
      </ul>
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
      <Skeleton className="h-5 w-32" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
      <Skeleton className="h-5 w-32" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    </div>
  )
}

function prettify(raw: string): string {
  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(iso: string | undefined): string {
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
