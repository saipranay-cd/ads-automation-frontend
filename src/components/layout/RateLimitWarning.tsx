"use client"

import { useState, useEffect } from "react"
import { AlertTriangle } from "lucide-react"

/**
 * Monitors Meta API rate limit headers from backend responses.
 * Shows amber warning at 80% usage (40 calls remaining),
 * red warning at 95% usage (10 calls remaining).
 */
export function RateLimitWarning() {
  const [remaining, setRemaining] = useState<number | null>(null)
  const [total, setTotal] = useState(200)

  useEffect(() => {
    // Intercept fetch to read rate limit headers from adsflow API responses
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)

      const remainingHeader = response.headers.get("X-Meta-RateLimit-Remaining")
      const totalHeader = response.headers.get("X-Meta-RateLimit-Total")

      if (remainingHeader !== null) {
        setRemaining(parseInt(remainingHeader, 10))
        if (totalHeader) setTotal(parseInt(totalHeader, 10))
      }

      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  if (remaining === null || remaining > total * 0.2) return null

  const isRed = remaining <= total * 0.05
  const bgColor = isRed ? "var(--red-bg)" : "var(--amber-bg)"
  const textColor = isRed ? "var(--red-text)" : "var(--amber-text)"
  const message = isRed
    ? `Meta API rate limit almost exhausted (${remaining} calls left). Some features may be temporarily unavailable.`
    : `Meta API rate limit warning: ${remaining} of ${total} calls remaining this hour.`

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 text-xs font-medium"
      style={{ background: bgColor, color: textColor }}
      role="alert"
    >
      <AlertTriangle size={14} />
      {message}
    </div>
  )
}
