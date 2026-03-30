"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { WizardDraft } from "@/types/adsflow"

const DEFAULT_DRAFT: WizardDraft = {
  status: "DRAFT",
  currentStep: 1,
  // Step 1 — Details
  campaignName: "",
  objective: "Lead Generation",
  specialAdCategory: "None",
  budgetType: "DAILY",
  dailyBudget: 1500,
  bidStrategy: "Lowest Cost",
  // Step 2 — Targeting
  locations: [],
  ageMin: 18,
  ageMax: 65,
  gender: "all",
  interests: [],
  audienceType: "Interest",
  // Step 3 — Creative
  primaryText: "",
  headline: "",
  description: "",
  callToAction: "Learn More",
  landingPageUrl: "",
  creativeJson: {},
  // Step 3 — UTM
  utmSource: "meta",
  utmMedium: "paid",
  utmCampaign: "",
  utmContent: "",
  utmTerm: "",
  // Step 4 — Lead Form
  leadFormMode: "skip",
  leadFormId: "",
  leadFormName: "",
  leadFormType: "MORE_VOLUME",
  leadFormQuestions: [
    { type: "FULL_NAME", key: "full_name", label: "Full Name" },
    { type: "EMAIL", key: "email", label: "Email" },
    { type: "PHONE", key: "phone_number", label: "Phone Number" },
  ],
  leadFormCustomQuestions: [],
  privacyPolicyUrl: "",
  thankYouTitle: "Thank You!",
  thankYouBody: "We will get back to you soon.",
  crmWebhookUrl: "",
  crmTag: "",
}

interface WizardState {
  draftId: string | null
  currentStep: number
  draft: WizardDraft
  updateDraft: (partial: Partial<WizardDraft>) => void
  goToStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  resetWizard: () => void
  setDraftId: (id: string | null) => void
  loadDraft: (draft: WizardDraft, id?: string) => void
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      draftId: null,
      currentStep: 1,
      draft: { ...DEFAULT_DRAFT },

      updateDraft: (partial) =>
        set((s) => ({ draft: { ...s.draft, ...partial } })),

      goToStep: (step) =>
        set((s) => ({
          currentStep: Math.max(1, Math.min(5, step)),
          draft: { ...s.draft, currentStep: Math.max(1, Math.min(5, step)) },
        })),

      nextStep: () =>
        set((s) => {
          const next = Math.min(5, s.currentStep + 1)
          return {
            currentStep: next,
            draft: { ...s.draft, currentStep: next },
          }
        }),

      prevStep: () =>
        set((s) => {
          const prev = Math.max(1, s.currentStep - 1)
          return {
            currentStep: prev,
            draft: { ...s.draft, currentStep: prev },
          }
        }),

      resetWizard: () =>
        set({
          draftId: null,
          currentStep: 1,
          draft: { ...DEFAULT_DRAFT },
        }),

      setDraftId: (id) => set({ draftId: id }),

      loadDraft: (draft, id) =>
        set({
          draftId: id ?? null,
          currentStep: draft.currentStep,
          draft,
        }),
    }),
    { name: "adsflow-wizard" }
  )
)

export { DEFAULT_DRAFT }
