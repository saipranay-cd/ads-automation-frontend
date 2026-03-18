"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Building2 } from "lucide-react"
import { useAdAccounts } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"

export function AccountSelector() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { data: accountsData } = useAdAccounts()
  const selectedId = useAppStore((s) => s.selectedAdAccountId)
  const setSelectedId = useAppStore((s) => s.setSelectedAdAccountId)

  const accounts = accountsData?.data || []
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
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  if (accounts.length === 0) {
    return (
      <div
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px]"
        style={{
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-default)",
          color: "var(--text-tertiary)",
        }}
      >
        <Building2 size={12} />
        No account connected
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors"
        style={{
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-default)",
          color: "var(--text-secondary)",
        }}
      >
        <Building2 size={12} />
        {selected?.name || "Select account"}
        <ChevronDown size={11} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-lg py-1"
          style={{
            background: "var(--bg-base)",
            border: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => {
                setSelectedId(account.id)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors"
              style={{
                color:
                  account.id === selectedId
                    ? "var(--acc-text)"
                    : "var(--text-primary)",
                background:
                  account.id === selectedId
                    ? "var(--acc-subtle)"
                    : "transparent",
              }}
              onMouseEnter={(e) => {
                if (account.id !== selectedId) {
                  e.currentTarget.style.background = "var(--bg-subtle)"
                }
              }}
              onMouseLeave={(e) => {
                if (account.id !== selectedId) {
                  e.currentTarget.style.background = "transparent"
                }
              }}
            >
              <span className="font-medium">{account.name}</span>
              <span style={{ color: "var(--text-tertiary)" }}>
                #{account.id}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
