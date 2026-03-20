"use client"

import { useState } from "react"
import { useWizardStore } from "@/lib/wizard-store"
import { useLeadForms } from "@/hooks/use-campaigns"
import { useAppStore } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CheckIcon, PlusIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LeadFormMode, LeadFormType, LeadFormQuestion } from "@/types/adsflow"

const DEFAULT_QUESTIONS: LeadFormQuestion[] = [
  { type: "FULL_NAME", key: "full_name", label: "Full Name" },
  { type: "EMAIL", key: "email", label: "Email" },
  { type: "PHONE", key: "phone_number", label: "Phone Number" },
]

export function StepLeadForm() {
  const { draft, updateDraft } = useWizardStore()
  const adAccountId = useAppStore((s) => s.selectedAdAccountId)
  const { data: formsData, isLoading: formsLoading } = useLeadForms(adAccountId)
  const existingForms = formsData?.data || []

  const [newCustomLabel, setNewCustomLabel] = useState("")

  function toggleQuestion(q: LeadFormQuestion) {
    const current = draft.leadFormQuestions
    const exists = current.some((cq) => cq.key === q.key)
    if (exists) {
      updateDraft({ leadFormQuestions: current.filter((cq) => cq.key !== q.key) })
    } else {
      updateDraft({ leadFormQuestions: [...current, q] })
    }
  }

  function addCustomQuestion() {
    if (!newCustomLabel.trim()) return
    const key = newCustomLabel.toLowerCase().replace(/\s+/g, "_")
    updateDraft({
      leadFormCustomQuestions: [
        ...draft.leadFormCustomQuestions,
        { key, label: newCustomLabel.trim() },
      ],
    })
    setNewCustomLabel("")
  }

  function removeCustomQuestion(key: string) {
    updateDraft({
      leadFormCustomQuestions: draft.leadFormCustomQuestions.filter((q) => q.key !== key),
    })
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Mode Selector */}
      <div className="flex flex-col gap-2">
        <Label>Lead Form</Label>
        <RadioGroup
          value={draft.leadFormMode}
          onValueChange={(v) => updateDraft({ leadFormMode: v as LeadFormMode })}
          className="flex gap-2"
        >
          {([
            { value: "existing", label: "Use Existing" },
            { value: "new", label: "Create New" },
            { value: "skip", label: "Skip" },
          ] as const).map((opt) => (
            <label
              key={opt.value}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-input px-3 py-2 text-sm transition-colors has-data-checked:border-primary has-data-checked:bg-primary/5 dark:bg-input/30 dark:has-data-checked:bg-primary/10"
            >
              <RadioGroupItem value={opt.value} className="sr-only" />
              {opt.label}
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Existing Form Selection */}
      {draft.leadFormMode === "existing" && (
        <div className="flex flex-col gap-3">
          <Label>Select Form</Label>
          {formsLoading && (
            <p className="text-xs text-muted-foreground">Loading forms...</p>
          )}
          {existingForms.length === 0 && !formsLoading && (
            <p className="text-xs text-muted-foreground">
              No existing lead forms found. Try creating a new one.
            </p>
          )}
          <div className="flex flex-col gap-2">
            {existingForms.map((form) => (
              <label
                key={form.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
                  draft.leadFormId === form.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
                onClick={() =>
                  updateDraft({ leadFormId: form.id, leadFormName: form.name })
                }
              >
                <div
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border",
                    draft.leadFormId === form.id
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  )}
                >
                  {draft.leadFormId === form.id && (
                    <CheckIcon className="size-2.5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{form.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {form.leads_count} leads · {form.status}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* New Form */}
      {draft.leadFormMode === "new" && (
        <>
          {/* Form Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="leadFormName">Form Name</Label>
            <Input
              id="leadFormName"
              placeholder="e.g. Godrej Woods Lead Form"
              value={draft.leadFormName}
              onChange={(e) => updateDraft({ leadFormName: e.target.value })}
            />
          </div>

          {/* Form Type */}
          <div className="flex flex-col gap-2">
            <Label>Form Type</Label>
            <RadioGroup
              value={draft.leadFormType}
              onValueChange={(v) => updateDraft({ leadFormType: v as LeadFormType })}
              className="flex gap-2"
            >
              {([
                { value: "MORE_VOLUME", label: "More Volume", desc: "Faster form, more leads" },
                { value: "HIGHER_INTENT", label: "Higher Intent", desc: "Review step, better quality" },
              ] as const).map((opt) => (
                <label
                  key={opt.value}
                  className="flex flex-1 cursor-pointer flex-col gap-0.5 rounded-lg border border-input px-3 py-2 transition-colors has-data-checked:border-primary has-data-checked:bg-primary/5 dark:bg-input/30 dark:has-data-checked:bg-primary/10"
                >
                  <RadioGroupItem value={opt.value} className="sr-only" />
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Standard Questions */}
          <div className="flex flex-col gap-2">
            <Label>Questions</Label>
            <div className="flex flex-col gap-1.5">
              {DEFAULT_QUESTIONS.map((q) => {
                const active = draft.leadFormQuestions.some((lq) => lq.key === q.key)
                return (
                  <label
                    key={q.key}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition-colors",
                      active ? "border-primary/30 bg-primary/5" : "border-border"
                    )}
                    onClick={() => toggleQuestion(q)}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border",
                        active ? "border-primary bg-primary" : "border-muted-foreground"
                      )}
                    >
                      {active && <CheckIcon className="size-2.5 text-white" />}
                    </div>
                    {q.label}
                  </label>
                )
              })}
            </div>
          </div>

          {/* Custom Questions */}
          <div className="flex flex-col gap-2">
            <Label>Custom Questions</Label>
            {draft.leadFormCustomQuestions.map((q) => (
              <div
                key={q.key}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
              >
                <span className="flex-1 text-sm">{q.label}</span>
                <button
                  onClick={() => removeCustomQuestion(q.key)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Add a custom question..."
                value={newCustomLabel}
                onChange={(e) => setNewCustomLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomQuestion()}
              />
              <button
                onClick={addCustomQuestion}
                className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/50"
              >
                <PlusIcon className="size-3" />
                Add
              </button>
            </div>
          </div>

          {/* Privacy Policy URL */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="privacyPolicyUrl">Privacy Policy URL</Label>
            <Input
              id="privacyPolicyUrl"
              type="url"
              placeholder="https://yoursite.com/privacy"
              value={draft.privacyPolicyUrl}
              onChange={(e) => updateDraft({ privacyPolicyUrl: e.target.value })}
            />
          </div>

          {/* Thank You Screen */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="thankYouTitle">Thank You Title</Label>
              <Input
                id="thankYouTitle"
                placeholder="Thank You!"
                value={draft.thankYouTitle}
                onChange={(e) => updateDraft({ thankYouTitle: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="thankYouBody">Thank You Message</Label>
              <Input
                id="thankYouBody"
                placeholder="We will get back to you soon."
                value={draft.thankYouBody}
                onChange={(e) => updateDraft({ thankYouBody: e.target.value })}
              />
            </div>
          </div>
        </>
      )}

      {/* CRM Integration (show for both existing and new) */}
      {draft.leadFormMode !== "skip" && (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h3 className="text-sm font-medium">CRM Integration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="crmWebhookUrl">Webhook URL</Label>
              <Input
                id="crmWebhookUrl"
                type="url"
                placeholder="https://hooks.zapier.com/..."
                value={draft.crmWebhookUrl}
                onChange={(e) => updateDraft({ crmWebhookUrl: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="crmTag">CRM Tag</Label>
              <Input
                id="crmTag"
                placeholder="e.g. godrej-woods-blr"
                value={draft.crmTag}
                onChange={(e) => updateDraft({ crmTag: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Skip info */}
      {draft.leadFormMode === "skip" && (
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            No lead form will be attached to this campaign. You can add one later in Meta Ads Manager.
          </p>
        </div>
      )}
    </div>
  )
}
