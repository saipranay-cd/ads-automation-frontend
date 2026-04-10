"use client"

import Link from "next/link"
import { AlertTriangle, ExternalLink } from "lucide-react"
import { GoogleAuthExpiredError } from "@/hooks/use-google"

interface GoogleAuthBannerProps {
  error: Error | null
}

export function GoogleAuthBanner({ error }: GoogleAuthBannerProps) {
  if (!error || !(error instanceof GoogleAuthExpiredError)) return null

  return (
    <div
      className="flex items-center justify-between rounded-lg px-4 py-3"
      style={{
        background: "var(--amber-bg)",
        border: "1px solid color-mix(in srgb, var(--amber-text) 30%, transparent)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <AlertTriangle size={15} style={{ color: "var(--amber-text)" }} />
        <p className="text-xs font-medium" style={{ color: "var(--amber-text)" }}>
          Your Google Ads connection has expired. Reconnect to continue syncing data.
        </p>
      </div>
      <Link
        href="/settings"
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
        style={{
          background: "color-mix(in srgb, var(--amber-text) 15%, transparent)",
          color: "var(--amber-text)",
        }}
      >
        Reconnect
        <ExternalLink size={11} />
      </Link>
    </div>
  )
}
