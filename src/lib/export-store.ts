"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface ExportPreset {
  id: string
  name: string
  groups: string[]
  dataPoints: string[]
  createdAt: number
}

interface ExportStore {
  presets: ExportPreset[]
  addPreset: (p: Omit<ExportPreset, "id" | "createdAt">) => void
  deletePreset: (id: string) => void
}

export const useExportStore = create<ExportStore>()(
  persist(
    (set) => ({
      presets: [],
      addPreset: (p) =>
        set((s) => ({
          presets: [
            { ...p, id: String(Date.now()), createdAt: Date.now() },
            ...s.presets,
          ],
        })),
      deletePreset: (id) =>
        set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),
    }),
    { name: "adsflow-exports" }
  )
)
