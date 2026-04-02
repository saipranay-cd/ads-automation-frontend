"use client"

import { useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useAuth } from "@/hooks/use-auth"
import {
  LayoutDashboard,
  BarChart3,
  Megaphone,
  Layers,
  FileText,
  Users,
  Sparkles,
  PlusCircle,
  Settings,
  Zap,
  LogOut,
  LogIn,
  MessageCircle,
  Target,
  Compass,
  GitCommitVertical,
  X,
  FolderOpen,
  KeyRound,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePlatform } from "@/hooks/use-platform"
import { ThemeToggle } from "./ThemeToggle"

const metaManageItems = [
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Ad Sets", href: "/ad-sets", icon: Layers },
  { label: "Ads", href: "/ads", icon: FileText },
  { label: "Audiences", href: "/audiences", icon: Users },
]

const googleManageItems = [
  { label: "Campaigns", href: "/google/campaigns", icon: Megaphone },
  { label: "Ad Groups", href: "/google/ad-groups", icon: FolderOpen },
  { label: "Ads", href: "/google/ads", icon: FileText },
  { label: "Keywords", href: "/google/keywords", icon: KeyRound },
]

function getNavSections(platform: "meta" | "google") {
  return [
    {
      label: "OVERVIEW",
      items: [
        { label: "Dashboard", href: "/", icon: LayoutDashboard },
        { label: "Analytics", href: "/analytics", icon: BarChart3 },
      ],
    },
    {
      label: "MANAGE",
      items: platform === "google" ? googleManageItems : metaManageItems,
    },
    {
      label: "INTELLIGENCE",
      items: platform === "google"
        ? [
            { label: "Insights", href: "/insights", icon: Sparkles },
            { label: "AI Chat", href: "/chat", icon: MessageCircle },
            { label: "Create Campaign", href: "/google/create", icon: PlusCircle },
          ]
        : [
            { label: "Insights", href: "/insights", icon: Sparkles },
            { label: "Lead Quality", href: "/lead-quality", icon: Target },
            { label: "Funnel", href: "/funnel", icon: GitCommitVertical },
            { label: "Creatives", href: "/creatives", icon: FileText },
            { label: "AI Chat", href: "/chat", icon: MessageCircle },
            { label: "Create Ad", href: "/create", icon: PlusCircle },
          ],
    },
    {
      label: "SYSTEM",
      items: [
        { label: "Onboarding", href: "/onboarding", icon: Compass },
        { label: "Settings", href: "/settings", icon: Settings },
      ],
    },
  ]
}

interface MobileNavDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const pathname = usePathname()
  const { user: authUser, isAuthenticated, isMetaAuth } = useAuth()
  const { platform } = usePlatform()
  const navSections = getNavSections(platform)
  const drawerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  // Focus trap
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return

    const drawer = drawerRef.current
    const focusableElements = drawer.querySelectorAll<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    )
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    // Focus close button on open
    firstFocusable?.focus()

    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    document.addEventListener("keydown", handleTab)
    return () => document.removeEventListener("keydown", handleTab)
  }, [isOpen])

  // Close on navigation
  useEffect(() => {
    onClose()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Swipe left to close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return
      const deltaX = e.changedTouches[0].clientX - touchStartX.current
      if (deltaX < -60) {
        onClose()
      }
      touchStartX.current = null
    },
    [onClose]
  )

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        style={{ background: "rgba(0, 0, 0, 0.5)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "var(--bg-base)",
          boxShadow: isOpen ? "var(--shadow-float)" : "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header: Logo + Close */}
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{
                background: "var(--acc)",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              <Zap size={14} color="white" />
            </div>
            <div className="flex flex-col">
              <span
                className="text-sm font-semibold leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Adsflow
              </span>
              <span
                className="font-mono text-[10px] leading-tight"
                style={{ color: "var(--text-tertiary)" }}
              >
                Meta Ads Platform
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {navSections.map((section) => (
            <div key={section.label} className="mb-4">
              <span
                className="mb-1 block px-2.5 text-[10px] font-medium uppercase tracking-[0.06em]"
                style={{ color: "var(--text-tertiary)" }}
              >
                {section.label}
              </span>
              {section.items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex min-h-[44px] items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                      isActive ? "font-medium" : ""
                    )}
                    style={{
                      background: isActive
                        ? "var(--acc-subtle)"
                        : "transparent",
                      color: isActive
                        ? "var(--acc-text)"
                        : "var(--text-secondary)",
                    }}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom: Theme toggle + User */}
        <div
          className="border-t px-4 py-3"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {/* Theme toggle row */}
          <div className="mb-3 flex items-center justify-between">
            <span
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Theme
            </span>
            <ThemeToggle />
          </div>

          {/* User row */}
          {isAuthenticated && authUser ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {authUser.image ? (
                  <Image
                    src={authUser.image}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full"
                  />
                ) : (
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium"
                    style={{
                      background: "var(--acc-subtle)",
                      color: "var(--acc-text)",
                    }}
                  >
                    {authUser.name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="flex flex-col">
                  <span
                    className="max-w-[140px] truncate text-xs font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {authUser.name || "User"}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {isMetaAuth ? "Connected" : "Signed in"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (isMetaAuth) {
                    document.cookie = "org-token=; path=/; max-age=0"
                    signOut({ callbackUrl: "/login" })
                  } else {
                    localStorage.removeItem("org-token")
                    localStorage.removeItem("org-user")
                    document.cookie = "org-token=; path=/; max-age=0"
                    window.location.href = "/org-login"
                  }
                }}
                className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                aria-label="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link
              href="/org-login"
              className="flex w-full items-center gap-2.5 rounded-md px-1 py-1 text-xs font-medium transition-colors"
              style={{ color: "var(--acc-text)" }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  background: "var(--acc-subtle)",
                  color: "var(--acc-text)",
                }}
              >
                <LogIn size={13} />
              </div>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
