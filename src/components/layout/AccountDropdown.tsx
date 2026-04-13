"use client"

import { useState, useRef, useEffect, useMemo, useCallback, type ReactNode } from "react"
import { ChevronDown, Building2, Search, Check } from "lucide-react"

export interface DropdownAccount {
  id: string
  name: string
  currency: string
  syncedAt?: string | null
  statusColor?: string
  statusLabel?: string
  detail?: string // e.g. cleaned account id
}

export interface AccountGroup {
  key: string
  label: string
  accounts: DropdownAccount[]
}

interface AccountDropdownProps {
  accounts: DropdownAccount[]
  selectedId: string | null
  onSelect: (id: string) => void
  title: string
  placeholder?: string
  groups?: AccountGroup[]
  triggerBadge?: string | null
  emptyState?: ReactNode
}

export function AccountDropdown({
  accounts,
  selectedId,
  onSelect,
  title,
  placeholder = "Select account",
  groups,
  triggerBadge,
  emptyState,
}: AccountDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [switching, setSwitching] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = accounts.find((a) => a.id === selectedId)

  const handleSelect = useCallback((id: string) => {
    if (id !== selectedId) {
      setSwitching(true)
      setTimeout(() => setSwitching(false), 800)
    }
    onSelect(id)
    setOpen(false)
    setSearch("")
  }, [selectedId, onSelect])

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
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  // Filter
  const q = search.toLowerCase()
  const filteredAccounts = useMemo(
    () =>
      !q
        ? accounts
        : accounts.filter(
            (a) => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)
          ),
    [accounts, q]
  )

  const filteredGroups = useMemo(() => {
    if (!groups) return null
    if (!q) return groups
    return groups
      .map((g) => ({
        ...g,
        accounts: g.accounts.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.id.toLowerCase().includes(q) ||
            g.label.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.accounts.length > 0)
  }, [groups, q])

  const itemList = filteredGroups
    ? filteredGroups
    : [{ key: "__all__", label: "", accounts: filteredAccounts }]

  const flatAccounts = useMemo(() => itemList.flatMap((g) => g.accounts), [itemList])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightIdx((i) => Math.min(i + 1, flatAccounts.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && highlightIdx >= 0 && flatAccounts[highlightIdx]) {
      e.preventDefault()
      handleSelect(flatAccounts[highlightIdx].id)
    } else if (e.key === "Escape") {
      setOpen(false)
      setSearch("")
    }
  }, [flatAccounts, highlightIdx, handleSelect])

  if (accounts.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  const renderItem = (account: DropdownAccount, idx?: number) => {
    const isSelected = account.id === selectedId
    const isHighlighted = idx !== undefined && idx === highlightIdx
    return (
      <button
        key={account.id}
        onClick={() => handleSelect(account.id)}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors"
        style={{ background: isSelected ? "var(--acc-subtle)" : isHighlighted ? "var(--bg-subtle)" : "transparent" }}
        onMouseEnter={(e) => { setHighlightIdx(-1); if (!isSelected) e.currentTarget.style.background = "var(--bg-subtle)" }}
        onMouseLeave={(e) => { if (!isSelected && !isHighlighted) e.currentTarget.style.background = "transparent" }}
      >
        <div
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: account.statusColor || "rgb(34,197,94)" }}
          title={account.statusLabel || "Active"}
        />
        <div className="min-w-0 flex-1">
          <span className="truncate text-xs font-medium block" style={{ color: isSelected ? "var(--acc-text)" : "var(--text-primary)" }}>
            {account.name}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              {account.detail || account.id}
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{account.currency}</span>
            {account.syncedAt && (
              <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Synced</span>
            )}
          </div>
        </div>
        {isSelected && <Check size={13} style={{ color: "var(--acc-text)" }} className="shrink-0" />}
      </button>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false) }}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors"
        style={{
          background: open ? "var(--acc-subtle)" : "var(--bg-subtle)",
          border: `1px solid ${open ? "var(--acc)" : "var(--border-default)"}`,
          color: open ? "var(--acc-text)" : "var(--text-secondary)",
        }}
      >
        <Building2 size={12} className={switching ? "animate-pulse" : ""} />
        <span className="max-w-[160px] truncate">{switching ? "Switching..." : selected?.name || placeholder}</span>
        {triggerBadge && (
          <span className="rounded px-1 py-0.5 text-[9px] font-medium" style={{ background: "var(--bg-subtle)", color: "var(--text-tertiary)" }}>
            {triggerBadge.length > 12 ? triggerBadge.slice(0, 10) + "\u2026" : triggerBadge}
          </span>
        )}
        <ChevronDown size={11} className="transition-transform" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 w-[320px] rounded-xl py-1"
          style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)", boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}
        >
          <div className="flex items-center justify-between px-3 pt-1.5 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{title}</span>
            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              {accounts.length} account{accounts.length !== 1 ? "s" : ""}
            </span>
          </div>

          {accounts.length > 3 && (
            <div className="px-2 py-1.5">
              <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
                <Search size={12} style={{ color: "var(--text-tertiary)" }} />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setHighlightIdx(-1) }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search accounts..."
                  className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-text-tertiary"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
            </div>
          )}

          <div className="max-h-[340px] overflow-y-auto px-1">
            {itemList.every((g) => g.accounts.length === 0) && (
              <div className="px-3 py-4 text-center text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                No accounts match &quot;{search}&quot;
              </div>
            )}
            {(() => {
              let flatIdx = 0
              return itemList.map((group) => (
                <div key={group.key}>
                  {group.label && filteredGroups && filteredGroups.length > 1 && (
                    <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                        {group.label}
                      </span>
                      <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>({group.accounts.length})</span>
                    </div>
                  )}
                  {group.accounts.map((a) => renderItem(a, flatIdx++))}
                </div>
              ))
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
