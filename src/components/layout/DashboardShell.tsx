"use client"

import { useEffect } from "react"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { MobileNavDrawer } from "./MobileNavDrawer"
import { RateLimitWarning } from "./RateLimitWarning"
import { useMobileNav } from "@/hooks/use-mobile-nav"
import { useAuth } from "@/hooks/use-auth"
import { useCurrentOrg } from "@/hooks/use-org"
import { syncStoreScope } from "@/lib/store"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isOpen, open, close } = useMobileNav()
  const { user } = useAuth()
  const { data: orgData } = useCurrentOrg()
  const currentOrg = orgData?.data?.[0]

  // Clear persisted account selections when user or org changes
  useEffect(() => {
    if (user?.email && currentOrg?.id) {
      syncStoreScope(`${user.email}:${currentOrg.id}`)
    }
  }, [user?.email, currentOrg?.id])

  useEffect(() => {
    function handleGlobalShortcuts(e: KeyboardEvent) {
      // Don't trigger in input/textarea/contenteditable
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return

      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key === "n") {
        e.preventDefault()
        window.location.href = "/create"
      }

      if (mod && e.key === "/") {
        e.preventDefault()
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]'
        )
        if (searchInput) {
          searchInput.focus()
        }
      }
    }

    window.addEventListener("keydown", handleGlobalShortcuts)
    return () => window.removeEventListener("keydown", handleGlobalShortcuts)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
        style={{ background: "var(--acc)", color: "white" }}
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <RateLimitWarning />
        <Topbar onMenuClick={open} />
        <main
          id="main-content"
          role="main"
          className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6"
          style={{
            background: "var(--bg-page)",
          }}
        >
          {children}
        </main>
      </div>
      <MobileNavDrawer isOpen={isOpen} onClose={close} />
    </div>
  )
}
