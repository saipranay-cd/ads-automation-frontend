"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { ThemeProvider } from "@/lib/theme"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthStore } from "@/lib/auth-store"

/**
 * Ensure cookie and localStorage stay in sync on app load.
 * AuthStore.setToken writes both atomically, so we just
 * re-stamp the existing token to fix any stale cookie.
 */
function useAuthSync() {
  useEffect(() => {
    const token = AuthStore.getToken()
    if (token) {
      AuthStore.setToken(token)
    }
  }, [])
}

export function Providers({ children }: { children: React.ReactNode }) {
  useAuthSync()
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider delay={200}>
          {children}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
