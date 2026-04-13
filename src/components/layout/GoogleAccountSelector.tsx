"use client"

import { useEffect, useMemo } from "react"
import { Building2 } from "lucide-react"
import { useGoogleAccounts, useGoogleSync } from "@/hooks/use-google"
import { useAppStore } from "@/lib/store"
import { AccountDropdown, type DropdownAccount } from "./AccountDropdown"

export function GoogleAccountSelector() {
  const { data: accountsData } = useGoogleAccounts()
  const syncMutation = useGoogleSync()
  const selectedId = useAppStore((s) => s.selectedGoogleAccountId)
  const setSelectedId = useAppStore((s) => s.setSelectedGoogleAccountId)

  const accounts = useMemo(() => accountsData?.data || [], [accountsData?.data])

  // Auto-select first account
  useEffect(() => {
    if (!selectedId && accounts.length > 0) {
      setSelectedId(accounts[0].id)
    }
  }, [accounts, selectedId, setSelectedId])

  const dropdownAccounts = useMemo<DropdownAccount[]>(
    () =>
      accounts.map((a) => ({
        id: a.id,
        name: a.name,
        currency: a.currency,
        syncedAt: a.syncedAt,
      })),
    [accounts]
  )

  return (
    <AccountDropdown
      accounts={dropdownAccounts}
      selectedId={selectedId}
      onSelect={setSelectedId}
      title="Google Ad Accounts"
      placeholder="Select Google account"
      emptyState={
        <button
          onClick={() => syncMutation.mutate(undefined)}
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
      }
    />
  )
}
