"use client"

import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { MobileNavDrawer } from "./MobileNavDrawer"
import { RateLimitWarning } from "./RateLimitWarning"
import { useMobileNav } from "@/hooks/use-mobile-nav"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isOpen, open, close } = useMobileNav()

  return (
    <div className="flex h-screen overflow-hidden">
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
