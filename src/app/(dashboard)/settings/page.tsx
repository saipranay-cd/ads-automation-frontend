"use client"

import { useSession, signOut } from "next-auth/react"
import { LogOut, ExternalLink } from "lucide-react"
import { useAdAccounts } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"

export default function SettingsPage() {
  const { data: session } = useSession()
  const { data: accountsData } = useAdAccounts()
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const accounts = accountsData?.data || []
  const selectedAccount = accounts.find((a) => a.id === selectedAdAccountId)

  const sectionStyle = {
    background: "var(--bg-base)" as const,
    border: "1px solid var(--border-default)" as const,
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Account */}
      <div className="rounded-lg p-5" style={sectionStyle}>
        <h2
          className="mb-4 text-[10px] font-medium uppercase tracking-[0.06em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          Account
        </h2>
        <div className="space-y-3">
          <Row label="Email" value={session?.user?.email || "—"} />
          <Row label="Name" value={session?.user?.name || "—"} />
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Meta Connection
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                background: session?.metaAccessToken ? "rgba(74, 222, 128, 0.1)" : "rgba(248, 113, 113, 0.1)",
                color: session?.metaAccessToken ? "#4ade80" : "#f87171",
              }}
            >
              {session?.metaAccessToken ? "Connected" : "Not connected"}
            </span>
          </div>
        </div>
      </div>

      {/* Ad Account */}
      {selectedAccount && (
        <div className="rounded-lg p-5" style={sectionStyle}>
          <h2
            className="mb-4 text-[10px] font-medium uppercase tracking-[0.06em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Active Ad Account
          </h2>
          <div className="space-y-3">
            <Row label="Account Name" value={selectedAccount.name} />
            <Row label="Account ID" value={selectedAccount.account_id} mono />
            <Row label="Currency" value={selectedAccount.currency} />
            <Row
              label="Status"
              value={selectedAccount.account_status === 1 ? "Active" : "Inactive"}
              badge={selectedAccount.account_status === 1 ? "good" : "warning"}
            />
            <Row
              label="Last Synced"
              value={
                selectedAccount.syncedAt
                  ? new Date(selectedAccount.syncedAt).toLocaleString()
                  : "Never"
              }
            />
          </div>
        </div>
      )}

      {/* All Ad Accounts */}
      {accounts.length > 1 && (
        <div className="rounded-lg p-5" style={sectionStyle}>
          <h2
            className="mb-4 text-[10px] font-medium uppercase tracking-[0.06em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            All Ad Accounts ({accounts.length})
          </h2>
          <div className="space-y-2">
            {accounts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-md px-3 py-2"
                style={{
                  background: a.id === selectedAdAccountId ? "var(--acc-subtle)" : "transparent",
                  border: a.id === selectedAdAccountId ? "1px solid var(--acc-border)" : "1px solid transparent",
                }}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {a.name}
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    {a.account_id} · {a.currency}
                  </span>
                </div>
                {a.id === selectedAdAccountId && (
                  <span className="text-[10px] font-medium" style={{ color: "var(--acc-text)" }}>
                    Selected
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger zone */}
      {session && (
        <div className="rounded-lg p-5" style={{ ...sectionStyle, borderColor: "rgba(248, 113, 113, 0.2)" }}>
          <h2
            className="mb-4 text-[10px] font-medium uppercase tracking-[0.06em]"
            style={{ color: "#f87171" }}
          >
            Danger Zone
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Disconnect Meta Account
              </span>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                Sign out and remove your Meta access token from this session
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                border: "1px solid rgba(248, 113, 113, 0.3)",
                color: "#f87171",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248, 113, 113, 0.08)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
            >
              <LogOut size={12} />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  mono,
  badge,
}: {
  label: string
  value: string
  mono?: boolean
  badge?: "good" | "warning"
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      {badge ? (
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{
            background: badge === "good" ? "rgba(74, 222, 128, 0.1)" : "rgba(251, 191, 36, 0.1)",
            color: badge === "good" ? "#4ade80" : "#fbbf24",
          }}
        >
          {value}
        </span>
      ) : (
        <span
          className={`text-sm ${mono ? "font-mono" : ""}`}
          style={{ color: "var(--text-primary)" }}
        >
          {value}
        </span>
      )}
    </div>
  )
}
