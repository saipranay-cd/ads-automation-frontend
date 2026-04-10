"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart3, FileImage, FolderOpen, Home, Layers, Lightbulb,
  Megaphone, PlusCircle, Search, Settings, Users,
} from "lucide-react"

interface CommandItem {
  id: string
  label: string
  icon: React.ElementType
  href: string
  section: string
}

const COMMANDS: CommandItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, href: "/", section: "Navigate" },
  { id: "campaigns", label: "Campaigns", icon: Megaphone, href: "/campaigns", section: "Navigate" },
  { id: "ad-sets", label: "Ad Sets", icon: Layers, href: "/ad-sets", section: "Navigate" },
  { id: "ads", label: "Ads", icon: FileImage, href: "/ads", section: "Navigate" },
  { id: "creatives", label: "Creatives", icon: FileImage, href: "/creatives", section: "Navigate" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/analytics", section: "Navigate" },
  { id: "insights", label: "Insights", icon: Lightbulb, href: "/insights", section: "Navigate" },
  { id: "audiences", label: "Audiences", icon: FolderOpen, href: "/audiences", section: "Navigate" },
  { id: "team", label: "Team", icon: Users, href: "/team", section: "Navigate" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings", section: "Navigate" },
  { id: "create-meta", label: "Create Meta Campaign", icon: PlusCircle, href: "/create", section: "Actions" },
  { id: "create-google", label: "Create Google Campaign", icon: PlusCircle, href: "/google/create", section: "Actions" },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Open/close with Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = useMemo(() => {
    if (!query) return COMMANDS
    const q = query.toLowerCase()
    return COMMANDS.filter(
      (c) => c.label.toLowerCase().includes(q) || c.section.toLowerCase().includes(q)
    )
  }, [query])

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIdx(0)
  }, [filtered.length])

  const handleSelect = useCallback(
    (item: CommandItem) => {
      setOpen(false)
      router.push(item.href)
    },
    [router]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === "Enter" && filtered[selectedIdx]) {
        e.preventDefault()
        handleSelect(filtered[selectedIdx])
      }
    },
    [filtered, selectedIdx, handleSelect]
  )

  if (!open) return null

  // Group by section
  const sections = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    ;(acc[item.section] ??= []).push(item)
    return acc
  }, {})

  let globalIdx = -1

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center pt-[20vh] animate-fade-in"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl shadow-lg animate-scale-in"
        style={{
          background: "var(--bg-base)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-float)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <Search size={16} style={{ color: "var(--text-tertiary)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages and actions..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          <kbd
            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              background: "var(--bg-muted)",
              color: "var(--text-tertiary)",
              border: "1px solid var(--border-default)",
            }}
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
          {Object.entries(sections).map(([section, items]) => (
            <div key={section}>
              <p
                className="px-4 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wide"
                style={{ color: "var(--text-tertiary)" }}
              >
                {section}
              </p>
              {items.map((item) => {
                globalIdx++
                const isSelected = globalIdx === selectedIdx
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-center gap-3 px-4 py-2 text-xs transition-colors"
                    style={{
                      background: isSelected ? "var(--acc-subtle)" : "transparent",
                      color: isSelected ? "var(--acc-text)" : "var(--text-secondary)",
                    }}
                  >
                    <Icon size={14} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center justify-between px-4 py-2 text-[10px]"
          style={{
            borderTop: "1px solid var(--border-subtle)",
            color: "var(--text-tertiary)",
          }}
        >
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>esc Close</span>
        </div>
      </div>
    </div>
  )
}
