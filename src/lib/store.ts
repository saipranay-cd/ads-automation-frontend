"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AppState {
  selectedAdAccountId: string | null
  setSelectedAdAccountId: (id: string | null) => void
  selectedGoogleAccountId: string | null
  setSelectedGoogleAccountId: (id: string | null) => void
  /** Track which user+org owns the persisted selections */
  _scopeKey: string | null
  setScopeKey: (key: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedAdAccountId: null,
      setSelectedAdAccountId: (id) => set({ selectedAdAccountId: id }),
      selectedGoogleAccountId: null,
      setSelectedGoogleAccountId: (id) => set({ selectedGoogleAccountId: id }),
      _scopeKey: null,
      setScopeKey: (key) => set({ _scopeKey: key }),
    }),
    { name: "adsflow-app" }
  )
)

/**
 * Call on auth/org change to clear stale selections from a different user/org session.
 * scopeKey should be `${userId}:${orgId}` or similar unique identifier.
 */
export function syncStoreScope(scopeKey: string) {
  const state = useAppStore.getState()
  if (state._scopeKey !== scopeKey) {
    useAppStore.setState({
      selectedAdAccountId: null,
      selectedGoogleAccountId: null,
      _scopeKey: scopeKey,
    })
  }
}
