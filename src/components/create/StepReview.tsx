"use client"

import { useState } from "react"
import { useWizardStore } from "@/lib/wizard-store"
import { usePublish } from "@/hooks/use-campaigns"
import { Button } from "@/components/ui/button"
import {
  ChevronRightIcon,
  PauseIcon,
  RocketIcon,
  LoaderIcon,
} from "lucide-react"
import { SuccessBanner } from "@/components/ui/success-banner"
import { ErrorBanner } from "@/components/ui/error-banner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

type PublishState = "idle" | "publishing" | "success" | "error"

function CollapsibleSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
      >
        {title}
        <ChevronRightIcon className={`size-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  )
}

export function StepReview() {
  const { draft, draftId } = useWizardStore()
  const publish = usePublish()
  const [publishState, setPublishState] = useState<PublishState>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [showLaunchConfirm, setShowLaunchConfirm] = useState(false)

  async function handleLaunch(status: "Active" | "Paused") {
    if (!draftId) return
    setPublishState("publishing")
    setErrorMsg("")
    try {
      const imageBase64 = (draft.creativeJson as Record<string, unknown>)?.imagePreview as string | undefined
      const result = await publish.mutateAsync({ draftId, status, imageBase64 })
      if (result.success) {
        setPublishState("success")
      } else {
        setPublishState("error")
        setErrorMsg(result.error || "Campaign creation failed. Check your ad account permissions and try again.")
      }
    } catch (err) {
      setPublishState("error")
      setErrorMsg(err instanceof Error ? err.message : "Failed to connect to Meta. Check your internet connection and try again.")
    }
  }

  const campaignSetup = [
    ["Campaign Name", draft.campaignName || "—"],
    ["Objective", draft.objective],
    ["Budget", `₹${draft.dailyBudget.toLocaleString("en-IN")} / ${draft.budgetType.toLowerCase()}`],
    ["Bid Strategy", draft.bidStrategy],
    ["Special Ad Category", draft.specialAdCategory],
  ]

  const targeting = [
    ["Locations", (draft.locations ?? []).join(", ") || "—"],
    ["Age Range", `${draft.ageMin ?? 18} – ${draft.ageMax ?? 65}`],
    ["Gender", (draft.gender ?? "all") === "all" ? "All" : (draft.gender ?? "all").charAt(0).toUpperCase() + (draft.gender ?? "all").slice(1)],
    ["Audience Type", draft.audienceType ?? "Interest"],
    ["Interests", (draft.interests ?? []).join(", ") || "—"],
  ]

  const summaryBottom = [
    ["Headline", draft.headline || "—"],
    ["Primary Text", draft.primaryText || "—"],
    ["CTA", draft.callToAction],
    ["Landing Page", draft.landingPageUrl || "—"],
  ]

  // UTM info
  const hasUtm = draft.utmSource || draft.utmMedium || draft.utmCampaign
  const utmPreview = hasUtm
    ? (() => {
        try {
          const url = new URL(draft.landingPageUrl || "https://example.com")
          if (draft.utmSource) url.searchParams.set("utm_source", draft.utmSource)
          if (draft.utmMedium) url.searchParams.set("utm_medium", draft.utmMedium)
          if (draft.utmCampaign) url.searchParams.set("utm_campaign", draft.utmCampaign)
          if (draft.utmContent) url.searchParams.set("utm_content", draft.utmContent)
          if (draft.utmTerm) url.searchParams.set("utm_term", draft.utmTerm)
          return url.toString()
        } catch { return "" }
      })()
    : ""

  // Lead form info
  const leadFormInfo =
    draft.leadFormMode === "new"
      ? `New: ${draft.leadFormName || "Untitled"} (${draft.leadFormType})`
      : draft.leadFormMode === "existing"
        ? `Existing: ${draft.leadFormName || draft.leadFormId || "—"}`
        : "Skipped"

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Campaign Setup */}
      <CollapsibleSection title="Campaign Setup" defaultOpen>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {campaignSetup.map(([label, value]) => (
            <div key={label}>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="text-sm">{value}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Targeting */}
      <CollapsibleSection title="Targeting">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {targeting.map(([label, value]) => (
            <div key={label}>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="text-sm">{value}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Creative */}
      <CollapsibleSection title="Creative">
        <div className="flex flex-col gap-4">
          {summaryBottom.map(([label, value]) => (
            <div key={label}>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="text-sm">{value}</p>
            </div>
          ))}
          {hasUtm && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                UTM Tracking URL
              </p>
              <p className="text-[10px] text-muted-foreground mb-1">
                Tags added to your landing page URL for tracking campaign performance in analytics tools.
              </p>
              <p className="break-all font-mono text-xs text-muted-foreground">
                {utmPreview}
              </p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Lead Form & CRM */}
      <CollapsibleSection title="Lead Form & CRM">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Lead Form
            </p>
            <p className="text-sm">{leadFormInfo}</p>
          </div>
          {draft.crmWebhookUrl && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                CRM Webhook
              </p>
              <p className="text-sm truncate">{draft.crmWebhookUrl}</p>
            </div>
          )}
          {draft.crmTag && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                CRM Tag
              </p>
              <p className="text-sm">{draft.crmTag}</p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Launch section */}
      <div className="flex flex-col items-center gap-4 pt-4">
        {publishState === "idle" && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLaunch("Paused")}
              disabled={!draftId || publish.isPending}
            >
              <PauseIcon className="size-3.5" data-icon="inline-start" />
              Create as Paused
            </Button>
            <Button
              size="sm"
              onClick={() => setShowLaunchConfirm(true)}
              disabled={!draftId || publish.isPending}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              <RocketIcon className="size-3.5" data-icon="inline-start" />
              Launch Active
            </Button>
          </div>
        )}

        <ConfirmDialog
          open={showLaunchConfirm}
          onCancel={() => setShowLaunchConfirm(false)}
          title={`Launch "${draft.campaignName || "Untitled"}" as active?`}
          description={`This campaign will go live immediately with a daily budget of ₹${draft.dailyBudget.toLocaleString("en-IN")}.`}
          confirmLabel="Launch Active"
          variant="default"
          onConfirm={() => handleLaunch("Active")}
        />

        {publishState === "publishing" && (
          <div className="flex flex-col items-center gap-3">
            <LoaderIcon className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Creating campaign on Meta...
            </p>
          </div>
        )}

        {publishState === "success" && (
          <SuccessBanner message="Campaign is live!" autoDismiss={false} className="w-full max-w-md" />
        )}

        {publishState === "error" && (
          <ErrorBanner
            message={errorMsg || "Campaign creation failed. Check your ad account permissions and try again."}
            onRetry={() => handleLaunch("Active")}
            className="w-full max-w-md"
          />
        )}

        {!draftId && publishState === "idle" && (
          <p className="text-xs text-muted-foreground">
            Save your draft first to enable launching
          </p>
        )}
      </div>
    </div>
  )
}
