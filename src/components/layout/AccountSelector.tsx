"use client"

import { useEffect, useMemo } from "react"
import { Building2 } from "lucide-react"
import { useAdAccounts, type AdAccount } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { AccountDropdown, type DropdownAccount, type AccountGroup } from "./AccountDropdown"

function statusDot(status: number) {
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

function toDropdownAccount(a: AdAccount): DropdownAccount {
  return {
    id: a.id,
    name: a.name,
    currency: a.currency,
    syncedAt: a.syncedAt,
    statusColor: statusDot(a.account_status),
    statusLabel: statusLabel(a.account_status),
    detail: a.id.replace("act_", ""),
  }
}

export function AccountSelector() {
  const { data: accountsData } = useAdAccounts()
  const selectedId = useAppStore((s) => s.selectedAdAccountId)
  const setSelectedId = useAppStore((s) => s.setSelectedAdAccountId)

  const accounts = useMemo(() => accountsData?.data || [], [accountsData?.data])
  const isRateLimited = (accountsData as { error?: string })?.error?.includes?.("rate limit") ?? false

  // Auto-select first account, or reset if selected account doesn't belong to current org
  useEffect(() => {
    if (accounts.length > 0 && !accounts.find((a) => a.id === selectedId)) {
      setSelectedId(accounts[0].id)
    }
  }, [accounts, selectedId, setSelectedId])

  const dropdownAccounts = useMemo(() => accounts.map(toDropdownAccount), [accounts])

  const groups = useMemo<AccountGroup[]>(() => {
    const map = new Map<string, AccountGroup>()
    for (const account of accounts) {
      const bizId = account.business?.id || "__personal__"
      const bizName = account.business?.name || "Personal Accounts"
      if (!map.has(bizId)) {
        map.set(bizId, { key: bizId, label: bizName, accounts: [] })
      }
      map.get(bizId)!.accounts.push(toDropdownAccount(account))
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.key === "__personal__" && b.key !== "__personal__") return 1
      if (a.key !== "__personal__" && b.key === "__personal__") return -1
      return a.label.localeCompare(b.label)
    })
  }, [accounts])

  const selected = accounts.find((a) => a.id === selectedId)
  const triggerBadge = selected?.business?.name || null

  return (
    <AccountDropdown
      accounts={dropdownAccounts}
      selectedId={selectedId}
      onSelect={setSelectedId}
      title="Ad Accounts"
      placeholder="Select account"
      groups={groups.length > 1 ? groups : undefined}
      triggerBadge={triggerBadge}
      emptyState={
        <div
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px]"
          style={{
            background: isRateLimited ? "var(--amber-bg)" : "var(--bg-subtle)",
            border: `1px solid ${isRateLimited ? "var(--amber-solid)" : "var(--border-default)"}`,
            color: isRateLimited ? "var(--amber-text)" : "var(--text-tertiary)",
          }}
        >
          <Building2 size={12} />
          {isRateLimited ? "Rate limited. Try again in a few minutes" : "Sync your account to load ad accounts"}
        </div>
      }
    />
  )
}
