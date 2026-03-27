"use client"

import { Search, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./ThemeToggle"
import { AccountSelector } from "./AccountSelector"
import { NotificationCenter } from "./NotificationCenter"

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/analytics": "Analytics",
  "/campaigns": "Campaigns",
  "/ad-sets": "Ad Sets",
  "/ads": "Ads",
  "/audiences": "Audiences",
  "/insights": "Insights",
  "/chat": "AI Chat",
  "/create": "Create Ad",
  "/settings": "Settings",
}

export function Topbar() {
  const pathname = usePathname()
  const title = pageTitles[pathname] || "Dashboard"

  return (
    <header
      className="sticky top-0 z-30 flex h-[52px] items-center justify-between border-b px-3 md:px-5"
      style={{
        background: "var(--bg-base)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* Left: Page title + Account selector */}
      <div className="flex items-center gap-2 md:gap-3">
        <h1
          className="text-[13px] md:text-[15px] font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h1>
        <AccountSelector />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 md:gap-2.5">
        <Link
          href="/create"
          className="hidden sm:flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium text-white transition-all"
          style={{
            background: "var(--acc)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <Plus size={13} />
          New Campaign
        </Link>
        <NotificationCenter />
        <ThemeToggle />
      </div>
    </header>
  )
}
