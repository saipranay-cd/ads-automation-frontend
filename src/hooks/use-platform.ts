"use client"

import { usePathname } from "next/navigation"

export type Platform = "meta" | "google"

// Shared pages where platform is determined by localStorage, not URL
const SHARED_PAGES = ["/", "/analytics", "/insights", "/chat", "/settings", "/automation"]

/**
 * Derives the active platform.
 * - /google/* → always "google"
 * - Meta-specific pages (/campaigns, /ad-sets, /ads, etc.) → always "meta"
 * - Shared pages (/, /analytics, /settings) → read from localStorage
 */
export function usePlatform(): { platform: Platform } {
  const pathname = usePathname()

  if (pathname.startsWith("/google")) return { platform: "google" }

  // On shared pages, use the stored preference
  if (SHARED_PAGES.includes(pathname)) {
    return { platform: getDefaultPlatform() }
  }

  // Meta-specific pages
  return { platform: "meta" }
}

/**
 * Returns the last-used platform from localStorage.
 */
export function getDefaultPlatform(): Platform {
  if (typeof window === "undefined") return "meta"
  return (localStorage.getItem("adsflow-platform") as Platform) || "meta"
}

export function setDefaultPlatform(platform: Platform) {
  localStorage.setItem("adsflow-platform", platform)
}
