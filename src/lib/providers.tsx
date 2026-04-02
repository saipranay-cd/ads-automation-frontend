"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider } from "next-auth/react"
import { useState, useEffect } from "react"
import { ThemeProvider } from "@/lib/theme"
import { TooltipProvider } from "@/components/ui/tooltip"

/**
 * Sync org-token between localStorage and cookie.
 * Middleware can only read cookies, apiFetch reads localStorage.
 * This ensures both stay in sync on app load.
 */
function useOrgTokenSync() {
  useEffect(() => {
    const token = localStorage.getItem("org-token")
    if (token) {
      // Ensure cookie exists for middleware
      const hasCookie = document.cookie.split("; ").some(c => c.startsWith("org-token="))
      if (!hasCookie) {
        document.cookie = `org-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; secure; samesite=lax`
      }
    }
  }, [])
}

export function Providers({ children }: { children: React.ReactNode }) {
  useOrgTokenSync()
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider delay={200}>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
