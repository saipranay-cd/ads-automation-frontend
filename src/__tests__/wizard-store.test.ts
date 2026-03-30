import { describe, it, expect, beforeEach } from "vitest"
import { useWizardStore, DEFAULT_DRAFT } from "@/lib/wizard-store"

describe("WizardStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useWizardStore.setState({
      draftId: null,
      currentStep: 1,
      draft: { ...DEFAULT_DRAFT },
    })
  })

  describe("defaults", () => {
    it("starts at step 1", () => {
      expect(useWizardStore.getState().currentStep).toBe(1)
    })

    it("has no draft ID initially", () => {
      expect(useWizardStore.getState().draftId).toBeNull()
    })

    it("defaults specialAdCategory to None (compliance safe)", () => {
      expect(useWizardStore.getState().draft.specialAdCategory).toBe("None")
    })

    it("defaults locations to empty array (no vertical bias)", () => {
      expect(useWizardStore.getState().draft.locations).toEqual([])
    })

    it("defaults interests to empty array (no vertical bias)", () => {
      expect(useWizardStore.getState().draft.interests).toEqual([])
    })

    it("defaults age range to 18-65 (broad)", () => {
      expect(useWizardStore.getState().draft.ageMin).toBe(18)
      expect(useWizardStore.getState().draft.ageMax).toBe(65)
    })

    it("defaults objective to Lead Generation", () => {
      expect(useWizardStore.getState().draft.objective).toBe("Lead Generation")
    })

    it("defaults budgetType to DAILY", () => {
      expect(useWizardStore.getState().draft.budgetType).toBe("DAILY")
    })

    it("defaults status to DRAFT", () => {
      expect(useWizardStore.getState().draft.status).toBe("DRAFT")
    })
  })

  describe("step navigation", () => {
    it("nextStep advances from 1 to 2", () => {
      useWizardStore.getState().nextStep()
      expect(useWizardStore.getState().currentStep).toBe(2)
    })

    it("nextStep caps at step 5", () => {
      useWizardStore.setState({ currentStep: 5 })
      useWizardStore.getState().nextStep()
      expect(useWizardStore.getState().currentStep).toBe(5)
    })

    it("prevStep goes back from 3 to 2", () => {
      useWizardStore.setState({ currentStep: 3 })
      useWizardStore.getState().prevStep()
      expect(useWizardStore.getState().currentStep).toBe(2)
    })

    it("prevStep caps at step 1", () => {
      useWizardStore.setState({ currentStep: 1 })
      useWizardStore.getState().prevStep()
      expect(useWizardStore.getState().currentStep).toBe(1)
    })

    it("goToStep navigates to specific step", () => {
      useWizardStore.getState().goToStep(4)
      expect(useWizardStore.getState().currentStep).toBe(4)
    })

    it("goToStep clamps below 1", () => {
      useWizardStore.getState().goToStep(0)
      expect(useWizardStore.getState().currentStep).toBe(1)
    })

    it("goToStep clamps above 5", () => {
      useWizardStore.getState().goToStep(10)
      expect(useWizardStore.getState().currentStep).toBe(5)
    })

    it("keeps draft.currentStep in sync with currentStep", () => {
      useWizardStore.getState().nextStep()
      const state = useWizardStore.getState()
      expect(state.currentStep).toBe(state.draft.currentStep)
    })
  })

  describe("updateDraft", () => {
    it("merges partial updates into draft", () => {
      useWizardStore.getState().updateDraft({ campaignName: "Test Campaign" })
      expect(useWizardStore.getState().draft.campaignName).toBe("Test Campaign")
    })

    it("preserves existing fields when updating", () => {
      useWizardStore.getState().updateDraft({ campaignName: "Test" })
      useWizardStore.getState().updateDraft({ dailyBudget: 5000 })
      const draft = useWizardStore.getState().draft
      expect(draft.campaignName).toBe("Test")
      expect(draft.dailyBudget).toBe(5000)
    })

    it("can update nested fields", () => {
      useWizardStore.getState().updateDraft({
        locations: ["Mumbai", "Delhi"],
        interests: ["Technology"],
      })
      expect(useWizardStore.getState().draft.locations).toEqual(["Mumbai", "Delhi"])
      expect(useWizardStore.getState().draft.interests).toEqual(["Technology"])
    })
  })

  describe("resetWizard", () => {
    it("resets all state to defaults", () => {
      useWizardStore.getState().updateDraft({ campaignName: "Test" })
      useWizardStore.getState().nextStep()
      useWizardStore.getState().setDraftId("draft_123")

      useWizardStore.getState().resetWizard()

      const state = useWizardStore.getState()
      expect(state.draftId).toBeNull()
      expect(state.currentStep).toBe(1)
      expect(state.draft.campaignName).toBe("")
    })
  })

  describe("loadDraft", () => {
    it("loads draft data and sets step", () => {
      const draft = {
        ...DEFAULT_DRAFT,
        campaignName: "Loaded Campaign",
        currentStep: 3,
      }
      useWizardStore.getState().loadDraft(draft, "draft_456")

      const state = useWizardStore.getState()
      expect(state.draftId).toBe("draft_456")
      expect(state.currentStep).toBe(3)
      expect(state.draft.campaignName).toBe("Loaded Campaign")
    })

    it("works without explicit ID", () => {
      useWizardStore.getState().loadDraft({ ...DEFAULT_DRAFT, currentStep: 2 })
      expect(useWizardStore.getState().draftId).toBeNull()
      expect(useWizardStore.getState().currentStep).toBe(2)
    })
  })
})
