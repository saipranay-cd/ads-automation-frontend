"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { ChevronDown, Building2, Search, Check } from "lucide-react"
import { useGoogleAccounts, useGoogleSync } from "@/hooks/use-google"
import { useAppStore } from "@/lib/store"

export function GoogleAccountSelector() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const { data: accountsData } = useGoogleAccounts()
  const syncMutation = useGoogleSync()
  const selectedId = useAppStore((s) => s.selectedGoogleAccountId)
  const setSelectedId = useAppStore((s) => s.setSelectedGoogleAccountId)

  const accounts = useMemo(() => accountsData?.data || [], [accountsData?.data])
  const selected = accounts.find((a) => a.id === selectedId)

  // Auto-select first account
  useEffect(() => {
    if (!selectedId && accounts.length > 0) {
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

  // Filter by search
  const filteredAccounts = useMemo(() => {
    if (!search.trim()) return accounts

    const q = search.toLowerCase()
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
    )
  }, [accounts, search])

  if (accounts.length === 0) {
    return (
      <button
        onClick={() => {
          // Trigger sync to discover accounts
          syncMutation.mutate(undefined)
        }}
        disabled={syncMutation.isPending}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] transition-colors hover:opacity-80"
        style={{
          background: "var(--acc-subtle)",
          border: "1px solid var(--acc-border)",
          color: "var(--acc-text)",
        }}
      >
        <Building2 size={12} />
        Sync Google Accounts
      </button>
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
        <span className="max-w-[160px] truncate">{selected?.name || "Select Google account"}</span>
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
              Google Ad Accounts
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              {accounts.length} account{accounts.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Search */}
          {accounts.length > 3 && (
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
                  placeholder="Search accounts..."
                  className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-text-tertiary"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
            </div>
          )}

          {/* Account list */}
          <div className="max-h-[340px] overflow-y-auto px-1">
            {filteredAccounts.length === 0 && (
              <div className="px-3 py-4 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                No accounts match &quot;{search}&quot;
              </div>
            )}

            {filteredAccounts.map((account) => {
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
                    style={{ background: "rgb(34,197,94)" }}
                    title="Active"
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
                        {account.id}
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
        </div>
      )}
    </div>
  )
}
