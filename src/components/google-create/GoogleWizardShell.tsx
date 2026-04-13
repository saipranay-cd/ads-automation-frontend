"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useGoogleWizardStore } from "@/lib/google-wizard-store"
import type { GoogleWizardDraft } from "@/lib/google-wizard-store"
import { GoogleStepIndicator } from "./GoogleStepIndicator"
import { GoogleStepCampaign } from "./GoogleStepCampaign"
import { GoogleStepAdGroup } from "./GoogleStepAdGroup"
import { GoogleStepKeywords } from "./GoogleStepKeywords"
import { GoogleStepAd } from "./GoogleStepAd"
import { GoogleStepReview } from "./GoogleStepReview"
import { Button } from "@/components/ui/button"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from "lucide-react"

function validateStep(step: number, draft: GoogleWizardDraft): string[] {
  const errors: string[] = []
  switch (step) {
    case 1:
      if (!draft.campaignName.trim()) errors.push("Campaign name is required")
      if (draft.dailyBudgetMicros <= 0) errors.push("Daily budget must be at least ₹1")
      if (draft.biddingStrategy === "TARGET_CPA" && !draft.targetCpa) {
        errors.push("Target CPA is required when using Target CPA bidding")
      }
      break
    case 2:
      if (!draft.adGroupName.trim()) errors.push("Ad group name is required")
      if (draft.defaultCpcBidMicros <= 0) errors.push("Default CPC bid must be at least ₹0.01")
      break
    case 3:
      if (draft.keywords.length === 0) errors.push("Add at least 1 keyword")
      break
    case 4: {
      const filledHeadlines = draft.headlines.filter((h) => h.trim())
      const filledDescriptions = draft.descriptions.filter((d) => d.trim())
      if (filledHeadlines.length < 3) errors.push("At least 3 headlines are required")
      if (filledDescriptions.length < 2) errors.push("At least 2 descriptions are required")
      if (!draft.finalUrl.trim()) errors.push("Final URL is required")
      else {
        try {
          new URL(draft.finalUrl)
        } catch {
          errors.push("Enter a valid URL starting with https://")
        }
      }
      if (draft.path1.length > 15) errors.push("Display path 1 must be 15 characters or less")
      if (draft.path2.length > 15) errors.push("Display path 2 must be 15 characters or less")
      break
    }
  }
  return errors
}

const STEP_COMPONENTS = [
  GoogleStepCampaign,
  GoogleStepAdGroup,
  GoogleStepKeywords,
  GoogleStepAd,
  GoogleStepReview,
]

const STEP_TITLES = ["Campaign", "Ad Group", "Keywords", "Ad", "Review"]

export function GoogleWizardShell() {
  const router = useRouter()
  const { currentStep, draft, goToStep, nextStep, prevStep, resetWizard } =
    useGoogleWizardStore()

  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const hasWork = !!draft.campaignName
    const handler = (e: BeforeUnloadEvent) => {
      if (hasWork) { e.preventDefault(); e.returnValue = "" }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [draft.campaignName])

  const completedSteps = useMemo(() => {
    const completed: number[] = []
    if (draft.campaignName && draft.dailyBudgetMicros > 0) completed.push(1)
    if (draft.adGroupName && draft.defaultCpcBidMicros > 0) completed.push(2)
    if (draft.keywords.length > 0) completed.push(3)
    if (
      draft.headlines.filter((h) => h.trim()).length >= 3 &&
      draft.descriptions.filter((d) => d.trim()).length >= 2 &&
      draft.finalUrl
    ) {
      completed.push(4)
    }
    return completed
  }, [draft])

  // Clear validation errors when user edits the draft
  useEffect(() => {
    if (validationErrors.length > 0) setValidationErrors([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            {currentStep}/5
          </span>
        </div>
        <GoogleStepIndicator
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
