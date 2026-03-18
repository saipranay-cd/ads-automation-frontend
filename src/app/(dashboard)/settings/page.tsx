"use client"

import { useSession } from "next-auth/react"

export default function SettingsPage() {
  const { data: session } = useSession()

  return (
    <div className="space-y-6">
      <h1
        className="text-2xl font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Settings
      </h1>

      <div
        className="rounded-lg p-6 space-y-4"
        style={{
          background: "var(--bg-base)",
          border: "1px solid var(--border-default)",
        }}
      >
        <h2
          className="text-sm font-medium uppercase tracking-wide"
          style={{ color: "var(--text-tertiary)" }}
        >
          Account
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Email
            </span>
            <span className="text-sm font-mono" style={{ color: "var(--text-primary)" }}>
              {session?.user?.email || "—"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Meta Connection
            </span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                background: session?.metaAccessToken
                  ? "var(--status-success-bg)"
                  : "var(--status-error-bg)",
                color: session?.metaAccessToken
                  ? "var(--status-success)"
                  : "var(--status-error)",
              }}
            >
              {session?.metaAccessToken ? "Connected" : "Not connected"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
