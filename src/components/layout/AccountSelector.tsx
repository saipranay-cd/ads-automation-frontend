"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { ChevronDown, Building2, Search, Check, Briefcase } from "lucide-react"
import { useAdAccounts, type AdAccount } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"

interface AccountGroup {
  businessId: string | null
  businessName: string
  accounts: AdAccount[]
}

function statusDot(status: number) {
  // 1 = ACTIVE, 2 = DISABLED, 3 = UNSETTLED, 7 = PENDING_RISK_REVIEW, 9 = IN_GRACE_PERIOD, 101 = TEMPORARILY_UNAVAILABLE, 201 = PENDING_CLOSURE
  if (status === 1) return "rgb(34,197,94)"
  if (status === 2) return "rgb(239,68,68)"
  return "rgb(234,179,8)"
}

function statusLabel(status: number) {
  if (status === 1) return "Active"
  if (status === 2) return "Disabled"
  if (status === 3) return "Unsettled"
  return "Review"
}

export function AccountSelector() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const { data: accountsData } = useAdAccounts()
  const selectedId = useAppStore((s) => s.selectedAdAccountId)
  const setSelectedId = useAppStore((s) => s.setSelectedAdAccountId)

  const accounts = useMemo(() => accountsData?.data || [], [accountsData?.data])
  const isRateLimited = (accountsData as { error?: string })?.error?.includes?.("rate limit") ?? false
  const selected = accounts.find((a) => a.id === selectedId)

  // Auto-select first account, or reset if selected account doesn't belong to current org
  useEffect(() => {
    if (accounts.length > 0 && !accounts.find((a) => a.id === selectedId)) {
      setSelectedId(accounts[0].id)
    }
  }, [accounts, selectedId, setSelectedId])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Focus search when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [open])

  // Group accounts by business portfolio
  const groups = useMemo<AccountGroup[]>(() => {
    const map = new Map<string, AccountGroup>()

    for (const account of accounts) {
      const bizId = account.business?.id || "__personal__"
      const bizName = account.business?.name || "Personal Accounts"

      if (!map.has(bizId)) {
        map.set(bizId, { businessId: bizId === "__personal__" ? null : bizId, businessName: bizName, accounts: [] })
      }
      map.get(bizId)!.accounts.push(account)
    }

    // Sort: business portfolios first, personal last
    const sorted = Array.from(map.values()).sort((a, b) => {
      if (!a.businessId && b.businessId) return 1
      if (a.businessId && !b.businessId) return -1
      return a.businessName.localeCompare(b.businessName)
    })

    return sorted
  }, [accounts])

  // Filter by search
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups

    const q = search.toLowerCase()
    return groups
      .map((g) => ({
        ...g,
        accounts: g.accounts.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.id.toLowerCase().includes(q) ||
            g.businessName.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.accounts.length > 0)
  }, [groups, search])

  const totalAccounts = accounts.length
  const totalBusinesses = groups.filter((g) => g.businessId).length

  if (accounts.length === 0) {
    return (
      <div
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px]"
        style={{
          background: isRateLimited ? "var(--amber-bg)" : "var(--bg-subtle)",
          border: `1px solid ${isRateLimited ? "var(--amber-solid)" : "var(--border-default)"}`,
          color: isRateLimited ? "var(--amber-text)" : "var(--text-tertiary)",
        }}
      >
        <Building2 size={12} />
        {isRateLimited ? "Rate limited — wait a few min" : "Sync to load accounts"}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors"
        style={{
          background: open ? "var(--acc-subtle)" : "var(--bg-subtle)",
          border: `1px solid ${open ? "var(--acc)" : "var(--border-default)"}`,
          color: open ? "var(--acc-text)" : "var(--text-secondary)",
        }}
      >
        <Building2 size={12} />
        <span className="max-w-[160px] truncate">{selected?.name || "Select account"}</span>
        {selected?.business && (
          <span
            className="rounded px-1 py-0.5 text-[9px] font-medium"
            style={{ background: "var(--bg-subtle)", color: "var(--text-tertiary)" }}
          >
            {selected.business.name.length > 12 ? selected.business.name.slice(0, 10) + "…" : selected.business.name}
          </span>
        )}
        <ChevronDown
          size={11}
          className="transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 w-[320px] rounded-xl py-1"
          style={{
            background: "var(--bg-base)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
          }}
        >
          {/* Header with count */}
          <div className="flex items-center justify-between px-3 pt-1.5 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              Ad Accounts
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              {totalAccounts} account{totalAccounts !== 1 ? "s" : ""}
              {totalBusinesses > 0 && ` · ${totalBusinesses} portfolio${totalBusinesses !== 1 ? "s" : ""}`}
            </span>
          </div>

          {/* Search */}
          {totalAccounts > 3 && (
            <div className="px-2 py-1.5">
              <div
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
                style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}
              >
                <Search size={12} style={{ color: "var(--text-tertiary)" }} />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search accounts or portfolios..."
                  className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-text-tertiary"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
            </div>
          )}

          {/* Account list */}
          <div className="max-h-[340px] overflow-y-auto px-1">
            {filteredGroups.length === 0 && (
              <div className="px-3 py-4 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                No accounts match &quot;{search}&quot;
              </div>
            )}

            {filteredGroups.map((group) => (
              <div key={group.businessId || "__personal__"}>
                {/* Group header — only show if multiple groups */}
                {groups.length > 1 && (
                  <div
                    className="flex items-center gap-1.5 px-3 pt-2.5 pb-1"
                  >
                    <Briefcase size={10} style={{ color: "var(--text-tertiary)" }} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                      {group.businessName}
                    </span>
                    <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>
                      ({group.accounts.length})
                    </span>
                  </div>
                )}

                {group.accounts.map((account) => {
                  const isSelected = account.id === selectedId
                  return (
                    <button
                      key={account.id}
                      onClick={() => {
                        setSelectedId(account.id)
                        setOpen(false)
                        setSearch("")
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors"
                      style={{
                        background: isSelected ? "var(--acc-subtle)" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "var(--bg-subtle)"
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "transparent"
                      }}
                    >
                      {/* Status dot */}
                      <div
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: statusDot(account.account_status) }}
                        title={statusLabel(account.account_status)}
                      />

                      {/* Name + details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="truncate text-xs font-medium"
                            style={{ color: isSelected ? "var(--acc-text)" : "var(--text-primary)" }}
                          >
                            {account.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                            {account.id.replace("act_", "")}
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                            {account.currency}
                          </span>
                          {account.syncedAt && (
                            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                              Synced
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selected check */}
                      {isSelected && (
                        <Check size={13} style={{ color: "var(--acc-text)" }} className="shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
