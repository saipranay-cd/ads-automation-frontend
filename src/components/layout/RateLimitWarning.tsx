"use client"

import { useState, useEffect } from "react"
import { AlertTriangle } from "lucide-react"

/**
 * Monitors Meta API rate limit headers and 429 errors from backend responses.
 * Shows amber warning at 80% usage, red when rate limit is fully hit.
 */
export function RateLimitWarning() {
  const [remaining, setRemaining] = useState<number | null>(null)
  const [total, setTotal] = useState(2000)
  const [rateLimited, setRateLimited] = useState(false)

  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)

      const remainingHeader = response.headers.get("X-Meta-RateLimit-Remaining")
      const totalHeader = response.headers.get("X-Meta-RateLimit-Total")

      if (remainingHeader !== null) {
        const rem = parseInt(remainingHeader, 10)
        setRemaining(rem)
        if (totalHeader) setTotal(parseInt(totalHeader, 10))
        if (rem <= 0) setRateLimited(true)
      }

      // Detect 429 from API responses (rate limit hit)
      if (response.status === 429) {
        setRateLimited(true)
        setRemaining(0)
      }

      // Also detect rate limit errors in JSON body for proxied responses
      const url = typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url || ""
      if (url.includes("/api/meta/") || url.includes("/api/google/")) {
        try {
          const cloned = response.clone()
          const body = await cloned.json().catch(() => null)
          if (body?.error?.metaCode === 429 || body?.error?.code === "META_API_ERROR" && body?.error?.message?.includes("rate limit")) {
            setRateLimited(true)
            setRemaining(0)
          }
        } catch {
          // ignore
        }
      }

      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  // Auto-clear rate limit after 5 minutes
  useEffect(() => {
    if (!rateLimited) return
    const timer = setTimeout(() => {
      setRateLimited(false)
      setRemaining(null)
    }, 5 * 60 * 1000)
    return () => clearTimeout(timer)
  }, [rateLimited])

  if (!rateLimited && (remaining === null || remaining > total * 0.2)) return null

  const isRed = rateLimited || (remaining !== null && remaining <= total * 0.05)
  const bgColor = isRed ? "var(--red-bg)" : "var(--amber-bg)"
  const borderColor = isRed ? "var(--red-solid)" : "var(--amber-solid)"
  const textColor = isRed ? "var(--red-text)" : "var(--amber-text)"
  const message = rateLimited
    ? `Rate limit reached (${total} calls/hour). Data will refresh when the limit resets.`
    : `Rate limit warning: ${remaining} of ${total} calls remaining this hour.`

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4">
      <div
        className="pointer-events-auto flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-xs font-medium shadow-lg"
        style={{ background: bgColor, color: textColor, border: `1px solid ${borderColor}` }}
        role="alert"
      >
        <AlertTriangle size={14} className="shrink-0" />
        {message}
        <button
          onClick={() => { setRateLimited(false); setRemaining(null) }}
          className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80"
          style={{ background: `${textColor}20`, color: textColor }}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
