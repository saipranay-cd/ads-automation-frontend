"use client"

import { Plus, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./ThemeToggle"
import { AccountSelector } from "./AccountSelector"
import { GoogleAccountSelector } from "./GoogleAccountSelector"
import { NotificationCenter } from "./NotificationCenter"
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
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors sm:hidden"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>
        <h1
          className="text-[13px] font-medium sm:text-[14px] lg:text-[15px]"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h1>
        {platform === "google" ? <GoogleAccountSelector /> : <AccountSelector />}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5">
        <Link
          href="/create"
          className="hidden items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium text-white transition-all sm:flex"
          style={{
            background: "var(--acc)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <Plus size={13} />
          New Campaign
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
