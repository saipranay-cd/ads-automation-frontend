"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Building2, Check } from "lucide-react"
import { useCurrentOrg, type OrgInfo } from "@/hooks/use-org"
import { useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-fetch"
import { AuthStore } from "@/lib/auth-store"

export function OrgSwitcher() {
  const { data } = useCurrentOrg()
  const queryClient = useQueryClient()
  const orgs = data?.data || []
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  // Only render if user has 2+ orgs
  if (orgs.length < 2) return null

  const currentOrg = orgs[0]

  async function handleSwitch(org: OrgInfo) {
    if (org.id === currentOrg.id) {
      setOpen(false)
      return
    }

    setSwitching(true)
    try {
      const res = await apiFetch("/api/org/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: org.id }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data?.data?.token) {
          AuthStore.setToken(data.data.token)
        }
        // Re-fetch all data with new org token
        await queryClient.invalidateQueries()
      }
    } catch {
      // Silent fail
    } finally {
      setSwitching(false)
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative px-2.5 pb-1">
      <button
        onClick={() => setOpen(!open)}
        disabled={switching}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all"
        style={{
          background: open ? "var(--bg-muted)" : "transparent",
          opacity: switching ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = "var(--bg-subtle)"
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = "transparent"
        }}
      >
        <div
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
          style={{ background: "var(--acc-subtle)", color: "var(--acc-text)" }}
        >
          <Building2 size={11} />
        </div>
        <div className="hidden min-w-0 flex-1 group-hover/sidebar:sm:block lg:block">
          <span
            className="block truncate text-[11px] font-medium leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {currentOrg.name}
          </span>
          <span
            className="block text-[9px] leading-tight"
            style={{ color: "var(--text-tertiary)" }}
          >
            {currentOrg.role === "ADMIN" ? "Admin" : currentOrg.role === "EDIT" ? "Editor" : "Viewer"}
          </span>
        </div>
        <ChevronDown
          size={11}
          className="hidden shrink-0 group-hover/sidebar:sm:block lg:block"
          style={{ color: "var(--text-tertiary)" }}
        />
      </button>

      {open && (
        <div
          className="absolute left-2.5 right-2.5 top-full z-30 mt-1 overflow-hidden rounded-lg shadow-lg"
          style={{
            background: "var(--bg-base)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="py-1">
            {orgs.map((org) => {
              const isCurrent = org.id === currentOrg.id
              return (
                <button
                  key={org.id}
                  onClick={() => handleSwitch(org)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors"
                  style={{
                    background: isCurrent ? "var(--acc-subtle)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = "var(--bg-subtle)"
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = "transparent"
                  }}
                >
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                    style={{
                      background: isCurrent ? "var(--acc)" : "var(--bg-muted)",
                      color: isCurrent ? "white" : "var(--text-tertiary)",
                    }}
                  >
                    <Building2 size={10} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[11px] font-medium"
                      style={{ color: isCurrent ? "var(--acc-text)" : "var(--text-primary)" }}
                    >
                      {org.name}
                    </span>
                  </div>
                  {isCurrent && (
                    <Check size={12} style={{ color: "var(--acc)" }} />
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
