"use client"

import { usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/campaigns": "Campaigns",
  "/ad-sets": "Ad Sets",
  "/ads": "Ads",
  "/analytics": "Analytics",
  "/audiences": "Audiences",
  "/automation": "Automation",
  "/chat": "AI Chat",
  "/create": "Create Campaign",
  "/creatives": "Creatives",
  "/funnel": "Funnel",
  "/insights": "Insights",
  "/lead-quality": "Lead Quality",
  "/settings": "Settings",
  "/team": "Team",
  "/google/campaigns": "Campaigns",
  "/google/ads": "Ads",
  "/google/ad-groups": "Ad Groups",
  "/google/keywords": "Keywords",
  "/google/create": "Create Campaign",
  "/google/lead-quality": "Lead Quality",
  "/google/funnel": "Funnel",
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Build breadcrumb trail based on URL hierarchy and query params
  const crumbs: { label: string; href: string }[] = []

  // Add parent crumbs from search params (e.g., campaignName, adSetName)
  const campaignName = searchParams.get("campaignName")
  const adSetName = searchParams.get("adSetName")

  if (pathname === "/ad-sets" && campaignName) {
    crumbs.push({ label: "Campaigns", href: "/campaigns" })
    crumbs.push({ label: decodeURIComponent(campaignName), href: pathname + "?" + searchParams.toString() })
  } else if (pathname === "/ads" && adSetName) {
    crumbs.push({ label: "Ad Sets", href: "/ad-sets" })
    crumbs.push({ label: decodeURIComponent(adSetName), href: pathname + "?" + searchParams.toString() })
  } else {
    // Single level - no breadcrumbs needed
    return null
  }

  if (crumbs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px]">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={10} style={{ color: "var(--text-tertiary)" }} />}
          {i === crumbs.length - 1 ? (
            <span style={{ color: "var(--text-secondary)" }}>{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="transition-colors hover:underline" style={{ color: "var(--acc)" }}>
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
