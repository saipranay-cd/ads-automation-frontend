"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useWizardStore } from "@/lib/wizard-store"
import { StepIndicator } from "./StepIndicator"
import { StepCampaign } from "./StepCampaign"
import { StepAdSet } from "./StepAdSet"
import { StepCreative } from "./StepCreative"
import { StepReview } from "./StepReview"
import { Button } from "@/components/ui/button"
import { useSaveDraft, useDraft } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from "lucide-react"

// Strip large base64 data before sending to backend
function stripLocalOnlyFields(draft: Record<string, unknown>) {
  const cleaned = { ...draft }
  if (cleaned.creativeJson && typeof cleaned.creativeJson === "object") {
    const { imagePreview, ...rest } = cleaned.creativeJson as Record<string, unknown>
    cleaned.creativeJson = rest
  }
  return cleaned
}

const STEP_COMPONENTS = [StepCampaign, StepAdSet, StepCreative, StepReview]
const STEP_TITLES = ["Details", "Targeting", "Creative", "Review"]

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
          draft: stripLocalOnlyFields({ ...draft, currentStep }),
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

  const completedSteps = useMemo(() => {
    const completed: number[] = []
    if (draft.campaignName && (draft.dailyBudget ?? 0) > 0) completed.push(1)
    if ((draft.locations ?? []).length > 0 && (draft.interests ?? []).length > 0) completed.push(2)
    if (draft.primaryText && draft.headline && draft.landingPageUrl) completed.push(3)
    return completed
  }, [draft])

  const handleCancel = useCallback(() => {
    resetWizard()
    router.push("/")
  }, [resetWizard, router])

  // Clamp to valid range (handles stale persisted state from old 5-step wizard)
  const safeStep = Math.max(1, Math.min(4, currentStep))
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
            Step {currentStep} of 4
          </span>
        </div>
        <StepIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={goToStep}
        />
      </div>

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
            <Button variant="outline" size="sm" onClick={prevStep}>
              <ChevronLeftIcon className="size-4" data-icon="inline-start" />
              Previous
            </Button>
          )}

          {/* Right side */}
          {currentStep < 4 && (
            <Button size="sm" onClick={nextStep}>
              Next
              <ChevronRightIcon className="size-4" data-icon="inline-end" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
