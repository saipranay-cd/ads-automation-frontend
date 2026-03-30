"use client"

import { useSession, signIn } from "next-auth/react"
import { AlertTriangle } from "lucide-react"

/**
 * Non-dismissable amber banner shown when Meta access token has expired.
 * Data is still visible (read from DB cache) but write operations are disabled.
 */
export function TokenExpiredBanner() {
  const { data: session } = useSession()

  // Show banner when session indicates token expired
  if (!session?.metaTokenExpired) return null

  return (
    <div
      className="flex items-center justify-between px-4 py-2.5"
      style={{
        background: "var(--amber-bg)",
        borderBottom: "1px solid var(--amber-solid)",
      }}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} style={{ color: "var(--amber-text)" }} />
        <span className="text-xs font-medium" style={{ color: "var(--amber-text)" }}>
          Your Meta connection has expired. Reconnect to continue managing campaigns.
        </span>
      </div>
      <button
        onClick={() => signIn("facebook")}
        className="rounded-md px-3 py-1 text-xs font-medium text-white transition-all hover:opacity-90"
        style={{ background: "var(--amber-solid)" }}
      >
        Reconnect with Meta
      </button>
    </div>
  )
}
