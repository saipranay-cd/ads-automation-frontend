"use client"

import { Search, Plus, ChevronDown } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "./ThemeToggle"
import { AccountSelector } from "./AccountSelector"

interface TopbarProps {
  title?: string
}

export function Topbar({ title = "Dashboard" }: TopbarProps) {
  return (
    <header
      className="sticky top-0 z-30 flex h-[52px] items-center justify-between border-b px-5"
      style={{
        background: "var(--bg-base)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* Left: Page title + Account selector */}
      <div className="flex items-center gap-3">
        <h1
          className="text-[15px] font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h1>
        <AccountSelector />
      </div>

      {/* Center: Search */}
      <div className="flex items-center">
        <div
          className="flex w-[200px] items-center gap-2 rounded-md px-3 py-1.5"
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-default)",
          }}
        >
          <Search size={13} style={{ color: "var(--text-tertiary)" }} />
          <span
            className="text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            Search...
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/create"
          className="flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium text-white transition-all"
          style={{
            background: "var(--acc)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <Plus size={13} />
          New Campaign
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}
