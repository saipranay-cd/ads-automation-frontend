"use client"

import { Suspense } from "react"
import { Plus, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./ThemeToggle"
import { AccountSelector } from "./AccountSelector"
import { GoogleAccountSelector } from "./GoogleAccountSelector"
import { NotificationCenter } from "./NotificationCenter"
import { Breadcrumbs } from "./Breadcrumbs"
import { usePlatform } from "@/hooks/use-platform"

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/analytics": "Analytics",
  "/campaigns": "Campaigns",
  "/ad-sets": "Ad Sets",
  "/ads": "Ads",
  "/audiences": "Audiences",
  "/insights": "Insights",
  "/chat": "AI Chat",
  "/create": "Create Campaign",
  "/settings": "Settings",
  "/google/campaigns": "Google Campaigns",
  "/google/ad-groups": "Google Ad Groups",
  "/google/ads": "Google Ads",
  "/google/keywords": "Google Keywords",
}

interface TopbarProps {
  onMenuClick?: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname()
  const title = pageTitles[pathname] || "Dashboard"
  const { platform } = usePlatform()

  return (
    <header
      role="banner"
      className="sticky top-0 z-30 flex h-12 items-center justify-between border-b px-3 sm:h-[52px] sm:px-4 lg:px-5"
      style={{
        background: "var(--bg-base)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* Left: Hamburger (mobile) + Page title + Account selector */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Hamburger menu — visible only on mobile (<640px) */}
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-md transition-colors sm:hidden"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>
        <div className="flex flex-col">
          <h1
            className="text-[13px] font-medium sm:text-[14px] lg:text-[15px]"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h1>
          <Suspense>
            <Breadcrumbs />
          </Suspense>
        </div>
        {platform === "google" ? <GoogleAccountSelector /> : <AccountSelector />}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5">
        <Link
          href="/create"
          className="flex h-8 w-8 items-center justify-center rounded-md text-white transition-all sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3.5 sm:py-1.5 sm:text-xs sm:font-medium"
          style={{
            background: "var(--acc)",
            boxShadow: "var(--shadow-glow)",
          }}
          aria-label="New Campaign"
          title="New Campaign (⌘N)"
        >
          <Plus size={13} />
          <span className="hidden sm:inline">New Campaign</span>
        </Link>
        <NotificationCenter />
        {/* Theme toggle hidden on mobile (available in mobile drawer instead) */}
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
