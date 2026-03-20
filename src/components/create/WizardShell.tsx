"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useWizardStore } from "@/lib/wizard-store"
import { StepIndicator } from "./StepIndicator"
import { StepCampaign } from "./StepCampaign"
import { StepAdSet } from "./StepAdSet"
import { StepCreative } from "./StepCreative"
import { StepLeadForm } from "./StepLeadForm"
import { StepReview } from "./StepReview"
import { Button } from "@/components/ui/button"
import { useSaveDraft, useDraft } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from "lucide-react"
import type { WizardDraft } from "@/types/adsflow"

// Map wizard draft to database-compatible fields
function mapDraftToDb(draft: WizardDraft & { currentStep: number }): Record<string, unknown> {
  const rawCreative = (draft.creativeJson || {}) as Record<string, unknown>
  const { imagePreview, ...cleanCreative } = rawCreative

  // Build targeting JSON from wizard fields
  const targetingJson: Record<string, unknown> = {
    locations: draft.locations,
    ageMin: draft.ageMin,
    ageMax: draft.ageMax,
    gender: draft.gender,
    interests: draft.interests,
  }

  // Build lead form JSON from wizard fields
  const leadFormJson: Record<string, unknown> = {
    mode: draft.leadFormMode || "skip",
    leadFormId: draft.leadFormId,
    formName: draft.leadFormName,
    formType: draft.leadFormType,
    questions: draft.leadFormQuestions,
    customQuestions: draft.leadFormCustomQuestions,
    privacyPolicyUrl: draft.privacyPolicyUrl,
    thankYouTitle: draft.thankYouTitle,
    thankYouBody: draft.thankYouBody,
  }

  return {
    campaignName: draft.campaignName,
    objective: draft.objective,
    dailyBudget: draft.dailyBudget,
    budgetType: draft.budgetType,
    adCategory: draft.specialAdCategory,
    campaignType: draft.bidStrategy,
    destinationUrl: draft.landingPageUrl,
    targetingJson,
    creativeJson: {
      ...cleanCreative,
      primaryText: draft.primaryText,
      headline: draft.headline,
      description: draft.description,
      callToAction: draft.callToAction,
    },
    utmSource: draft.utmSource,
    utmMedium: draft.utmMedium,
    utmCampaign: draft.utmCampaign,
    utmContent: draft.utmContent,
    utmTerm: draft.utmTerm,
    leadFormId: draft.leadFormId || null,
    leadFormJson,
    crmWebhookUrl: draft.crmWebhookUrl || null,
    crmTag: draft.crmTag || null,
    currentStep: draft.currentStep,
    status: draft.status,
  }
}

function validateStep(step: number, draft: WizardDraft): string[] {
  const errors: string[] = []
  switch (step) {
    case 1:
      if (!draft.campaignName.trim()) errors.push("Campaign name is required")
      if ((draft.dailyBudget ?? 0) <= 0) errors.push("Budget must be greater than 0")
      break
    case 2:
      if ((draft.locations ?? []).length === 0) errors.push("Select at least one location")
      if ((draft.interests ?? []).length === 0) errors.push("Select at least one interest")
      if ((draft.ageMin ?? 18) >= (draft.ageMax ?? 65)) errors.push("Invalid age range")
      break
    case 3:
      if (!draft.primaryText.trim()) errors.push("Primary text is required")
      if (!draft.headline.trim()) errors.push("Headline is required")
      if (!draft.landingPageUrl.trim()) errors.push("Landing page URL is required")
      else {
        try { new URL(draft.landingPageUrl) } catch { errors.push("Landing page URL must be valid") }
      }
      break
    case 4:
      if (draft.leadFormMode === "new") {
        if (!draft.leadFormName.trim()) errors.push("Form name is required")
        if (!draft.privacyPolicyUrl.trim()) errors.push("Privacy policy URL is required")
      }
      break
  }
  return errors
}

const STEP_COMPONENTS = [StepCampaign, StepAdSet, StepCreative, StepLeadForm, StepReview]
const STEP_TITLES = ["Details", "Targeting", "Creative", "Lead Form", "Review"]

export function WizardShell() {
  const router = useRouter()
  const { currentStep, draft, draftId, goToStep, nextStep, prevStep, setDraftId, loadDraft, resetWizard } =
    useWizardStore()
  const saveDraft = useSaveDraft()
  const adAccountId = useAppStore((s) => s.selectedAdAccountId)
  const searchParams = useSearchParams()
  const resumeDraftId = searchParams.get("draft")
  const { data: remoteDraft } = useDraft(resumeDraftId)

  // Draft resume from URL param
  const hasLoaded = useRef(false)
  useEffect(() => {
    if (remoteDraft && !hasLoaded.current) {
      hasLoaded.current = true
      loadDraft(remoteDraft, remoteDraft.id)
    }
  }, [remoteDraft, loadDraft])

  // Auto-save: debounce 500ms after draft changes
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!adAccountId || !draft.campaignName) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const result = await saveDraft.mutateAsync({
          id: draftId,
          userId: "",
          adAccountId,
          draft: mapDraftToDb({ ...draft, currentStep }) as Partial<WizardDraft>,
        })
        if (result?.id && !draftId) {
          setDraftId(result.id)
        }
      } catch {
        // silent auto-save failure
      }
    }, 500)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, currentStep])

  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const completedSteps = useMemo(() => {
    const completed: number[] = []
    if (draft.campaignName && (draft.dailyBudget ?? 0) > 0) completed.push(1)
    if ((draft.locations ?? []).length > 0 && (draft.interests ?? []).length > 0) completed.push(2)
    if (draft.primaryText && draft.headline && draft.landingPageUrl) completed.push(3)
    if (draft.leadFormMode === "skip" || draft.leadFormId || draft.leadFormName) completed.push(4)
    return completed
  }, [draft])

  const handleCancel = useCallback(() => {
    resetWizard()
    router.push("/")
  }, [resetWizard, router])

  const handleNext = useCallback(() => {
    const errors = validateStep(currentStep, draft)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }
    setValidationErrors([])
    nextStep()
  }, [currentStep, draft, nextStep])

  const safeStep = Math.max(1, Math.min(5, currentStep))
  const StepComponent = STEP_COMPONENTS[safeStep - 1]

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-medium">
            {STEP_TITLES[currentStep - 1]}
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            Step {currentStep} of 5
          </span>
        </div>
        <StepIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={goToStep}
        />
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          {validationErrors.map((err) => (
            <p key={err} className="text-xs text-destructive">{err}</p>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <StepComponent />
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background/80 backdrop-blur-sm sm:left-[var(--sidebar-width,240px)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          {/* Left side */}
          {currentStep === 1 ? (
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <XIcon className="size-4" data-icon="inline-start" />
              Cancel
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => { setValidationErrors([]); prevStep() }}>
              <ChevronLeftIcon className="size-4" data-icon="inline-start" />
              Previous
            </Button>
          )}

          {/* Right side */}
          {currentStep < 5 && (
            <Button size="sm" onClick={handleNext}>
              Next
              <ChevronRightIcon className="size-4" data-icon="inline-end" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
