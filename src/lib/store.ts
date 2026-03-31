"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AppState {
  selectedAdAccountId: string | null
  setSelectedAdAccountId: (id: string | null) => void
  selectedGoogleAccountId: string | null
  setSelectedGoogleAccountId: (id: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedAdAccountId: null,
      setSelectedAdAccountId: (id) => set({ selectedAdAccountId: id }),
      selectedGoogleAccountId: null,
      setSelectedGoogleAccountId: (id) => set({ selectedGoogleAccountId: id }),
    }),
    { name: "adsflow-app" }
  )
)
