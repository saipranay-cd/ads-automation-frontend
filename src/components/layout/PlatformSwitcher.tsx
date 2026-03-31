"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Facebook, Globe, ChevronDown } from "lucide-react"
import { usePlatform, setDefaultPlatform, type Platform } from "@/hooks/use-platform"

const platforms: { id: Platform; label: string; icon: typeof Facebook }[] = [
  { id: "meta", label: "Meta Ads", icon: Facebook },
  { id: "google", label: "Google Ads", icon: Globe },
]

/** Maps Meta paths ↔ Google paths for seamless switching */
const routeMap: Record<string, string> = {
  "/campaigns": "/google/campaigns",
  "/ad-sets": "/google/ad-groups",
  "/ads": "/google/ads",
  "/lead-quality": "/google/lead-quality",
  "/create": "/google/create",
  "/google/campaigns": "/campaigns",
  "/google/ad-groups": "/ad-sets",
  "/google/ads": "/ads",
  "/google/keywords": "/campaigns",
  "/google/lead-quality": "/lead-quality",
  "/google/create": "/create",
  "/funnel": "/google/funnel",
  "/google/funnel": "/funnel",
}

export function PlatformSwitcher() {
  const { platform } = usePlatform()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = platforms.find((p) => p.id === platform) || platforms[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Shared pages stay on the same URL when switching platforms
  const sharedPages = ["/", "/analytics", "/insights", "/chat", "/settings", "/onboarding", "/automation"]

  function handleSwitch(target: Platform) {
    if (target === platform) {
      setOpen(false)
      return
    }
    setDefaultPlatform(target)
    setOpen(false)

    // On shared pages, stay on the same page (sidebar + topbar re-render via usePlatform)
    if (sharedPages.includes(pathname)) {
      router.refresh()
      return
    }

    // On platform-specific pages, navigate to equivalent page
    const mapped = routeMap[pathname]
    if (mapped) {
      router.push(mapped)
    } else if (target === "google") {
      router.push("/google/campaigns")
    } else {
      router.push("/campaigns")
    }
  }

  return (
    <div ref={ref} className="relative hidden group-hover/sidebar:sm:block lg:block">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors"
        style={{
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-default)",
          color: "var(--text-primary)",
        }}
      >
        <current.icon size={14} style={{ color: "var(--text-secondary)" }} />
        <span className="flex-1 text-left text-xs font-medium">{current.label}</span>
        <ChevronDown
          size={12}
          style={{ color: "var(--text-tertiary)" }}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg"
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-float)",
          }}
        >
          {platforms.map((p) => {
            const Icon = p.icon
            const isActive = p.id === platform
            return (
              <button
                key={p.id}
                onClick={() => handleSwitch(p.id)}
                className="flex w-full items-center gap-2 px-2.5 py-2 text-xs font-medium transition-colors"
                style={{
                  background: isActive ? "var(--acc-subtle)" : "transparent",
                  color: isActive ? "var(--acc-text)" : "var(--text-primary)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--bg-subtle)"
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent"
                }}
              >
                <Icon size={14} />
                {p.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
