"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type GoogleCampaignType = "SEARCH" | "DISPLAY"
export type GoogleBiddingStrategy =
  | "MAXIMIZE_CLICKS"
  | "MAXIMIZE_CONVERSIONS"
  | "TARGET_CPA"
  | "MANUAL_CPC"
export type KeywordMatchType = "EXACT" | "PHRASE" | "BROAD"

export interface GoogleKeywordEntry {
  text: string
  matchType: KeywordMatchType
}

export interface GoogleWizardDraft {
  // Step 1 — Campaign
  campaignName: string
  campaignType: GoogleCampaignType
  dailyBudgetMicros: number
  biddingStrategy: GoogleBiddingStrategy
  targetCpa: number | null
  // Step 2 — Ad Group
  adGroupName: string
  defaultCpcBidMicros: number
  // Step 3 — Keywords
  keywords: GoogleKeywordEntry[]
  // Step 4 — Ad
  headlines: string[]
  descriptions: string[]
  finalUrl: string
  path1: string
  path2: string
}

const DEFAULT_DRAFT: GoogleWizardDraft = {
  // Step 1
  campaignName: "",
  campaignType: "SEARCH",
  dailyBudgetMicros: 0,
  biddingStrategy: "MAXIMIZE_CLICKS",
  targetCpa: null,
  // Step 2
  adGroupName: "",
  defaultCpcBidMicros: 0,
  // Step 3
  keywords: [],
  // Step 4
  headlines: [],
  descriptions: [],
  finalUrl: "",
  path1: "",
  path2: "",
}

interface GoogleWizardState {
  currentStep: number
  draft: GoogleWizardDraft

  updateDraft: (partial: Partial<GoogleWizardDraft>) => void
  goToStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  resetWizard: () => void

  // Keywords
  addKeyword: (keyword: GoogleKeywordEntry) => void
  removeKeyword: (index: number) => void

  // Headlines
  addHeadline: (headline: string) => void
  removeHeadline: (index: number) => void

  // Descriptions
  addDescription: (description: string) => void
  removeDescription: (index: number) => void
}

export const useGoogleWizardStore = create<GoogleWizardState>()(
  persist(
    (set) => ({
      currentStep: 1,
      draft: { ...DEFAULT_DRAFT },

      updateDraft: (partial) =>
        set((s) => ({ draft: { ...s.draft, ...partial } })),

      goToStep: (step) =>
        set(() => ({ currentStep: Math.max(1, Math.min(5, step)) })),

      nextStep: () =>
        set((s) => ({ currentStep: Math.min(5, s.currentStep + 1) })),

      prevStep: () =>
        set((s) => ({ currentStep: Math.max(1, s.currentStep - 1) })),

      resetWizard: () =>
        set({ currentStep: 1, draft: { ...DEFAULT_DRAFT } }),

      addKeyword: (keyword) =>
        set((s) => ({
          draft: { ...s.draft, keywords: [...s.draft.keywords, keyword] },
        })),

      removeKeyword: (index) =>
        set((s) => ({
          draft: {
            ...s.draft,
            keywords: s.draft.keywords.filter((_, i) => i !== index),
          },
        })),

      addHeadline: (headline) =>
        set((s) => ({
          draft: {
            ...s.draft,
            headlines:
              s.draft.headlines.length < 15
                ? [...s.draft.headlines, headline]
                : s.draft.headlines,
          },
        })),

      removeHeadline: (index) =>
        set((s) => ({
          draft: {
            ...s.draft,
            headlines: s.draft.headlines.filter((_, i) => i !== index),
          },
        })),

      addDescription: (description) =>
        set((s) => ({
          draft: {
            ...s.draft,
            descriptions:
              s.draft.descriptions.length < 4
                ? [...s.draft.descriptions, description]
                : s.draft.descriptions,
          },
        })),

      removeDescription: (index) =>
        set((s) => ({
          draft: {
            ...s.draft,
            descriptions: s.draft.descriptions.filter((_, i) => i !== index),
          },
        })),
    }),
    { name: "adsflow-google-wizard" }
  )
)

export { DEFAULT_DRAFT as GOOGLE_DEFAULT_DRAFT }
