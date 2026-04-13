"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api-fetch"
import { useGoogleWizardStore } from "@/lib/google-wizard-store"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { SuccessBanner } from "@/components/ui/success-banner"
import { ErrorBanner } from "@/components/ui/error-banner"
import {
  PauseIcon,
  RocketIcon,
  LoaderIcon,
  PencilIcon,
} from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

const BIDDING_LABELS: Record<string, string> = {
  MAXIMIZE_CLICKS: "Maximize Clicks",
  MAXIMIZE_CONVERSIONS: "Maximize Conversions",
  TARGET_CPA: "Target CPA",
  MANUAL_CPC: "Manual CPC",
}

const MATCH_TYPE_FORMAT: Record<string, (text: string) => string> = {
  EXACT: (t) => `[${t}]`,
  PHRASE: (t) => `"${t}"`,
  BROAD: (t) => t,
}

type PublishState = "idle" | "publishing" | "success" | "error"

export function GoogleStepReview() {
  const router = useRouter()
  const { draft, goToStep } = useGoogleWizardStore()
  const [publishState, setPublishState] = useState<PublishState>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [showLaunchConfirm, setShowLaunchConfirm] = useState(false)

  const fmtINR = (micros: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(micros / 1_000_000)

  const budgetDisplay = draft.dailyBudgetMicros ? fmtINR(draft.dailyBudgetMicros) : "₹0.00"
  const cpcBidDisplay = draft.defaultCpcBidMicros ? fmtINR(draft.defaultCpcBidMicros) : "₹0.00"
  const targetCpaDisplay = draft.targetCpa ? fmtINR(draft.targetCpa) : "—"

  async function handleLaunch(status: "ENABLED" | "PAUSED") {
    setPublishState("publishing")
    setErrorMsg("")
    try {
      const res = await apiFetch("/api/google/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, initialStatus: status }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setPublishState("success")
      } else {
        setPublishState("error")
        setErrorMsg(data.error || "Campaign creation failed. Check your Google Ads account permissions and try again.")
      }
    } catch (err) {
      setPublishState("error")
      setErrorMsg(err instanceof Error ? err.message : "Failed to connect to Google Ads. Check your internet connection and try again.")
    }
  }

  const campaignSummary = [
    ["Campaign Name", draft.campaignName || "—"],
    ["Campaign Type", draft.campaignType],
    ["Daily Budget", budgetDisplay],
    ["Bidding Strategy", BIDDING_LABELS[draft.biddingStrategy] || draft.biddingStrategy],
    ...(draft.biddingStrategy === "TARGET_CPA"
      ? [["Target CPA", targetCpaDisplay]]
      : []),
  ]

  const adGroupSummary = [
    ["Ad Group Name", draft.adGroupName || "—"],
    ["Default CPC Bid", cpcBidDisplay],
  ]

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Step 1: Campaign */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Campaign
          </h3>
          <button
            onClick={() => goToStep(1)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <PencilIcon className="size-3" />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {campaignSummary.map(([label, value]) => (
            <div key={label}>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Step 2: Ad Group */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ad Group
          </h3>
          <button
            onClick={() => goToStep(2)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <PencilIcon className="size-3" />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {adGroupSummary.map(([label, value]) => (
            <div key={label}>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Step 3: Keywords */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Keywords ({draft.keywords.length})
          </h3>
          <button
            onClick={() => goToStep(3)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <PencilIcon className="size-3" />
            Edit
          </button>
        </div>
        {draft.keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {draft.keywords.map((kw, idx) => (
              <Badge key={idx} variant="outline" className="font-mono text-xs">
                {MATCH_TYPE_FORMAT[kw.matchType]
                  ? MATCH_TYPE_FORMAT[kw.matchType](kw.text)
                  : kw.text}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No keywords added yet. Go back to add keywords.</p>
        )}
      </div>

      <Separator />

      {/* Step 4: Ad */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ad Creative
          </h3>
          <button
            onClick={() => goToStep(4)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <PencilIcon className="size-3" />
            Edit
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Headlines ({draft.headlines.filter((h) => h.trim()).length})
            </p>
            <p className="text-sm">
              {draft.headlines.filter((h) => h.trim()).join(" | ") || "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Descriptions ({draft.descriptions.filter((d) => d.trim()).length})
            </p>
            {draft.descriptions.filter((d) => d.trim()).length > 0 ? (
              draft.descriptions
                .filter((d) => d.trim())
                .map((d, i) => (
                  <p key={i} className="text-sm">
                    {d}
                  </p>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-6">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Final URL
              </p>
              <p className="truncate text-sm">{draft.finalUrl || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Display Path
              </p>
              <p className="text-sm">
                {draft.path1 || draft.path2
                  ? `/${draft.path1}${draft.path2 ? `/${draft.path2}` : ""}`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Launch section */}
      <div className="flex flex-col items-center gap-4 pt-4">
        {publishState === "idle" && (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
            >
              Save & Exit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLaunch("PAUSED")}
            >
              <PauseIcon className="size-3.5" data-icon="inline-start" />
              Create as Paused
            </Button>
            <Button
              size="sm"
              onClick={() => setShowLaunchConfirm(true)}
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
          description={`This campaign will go live immediately with a daily budget of ${budgetDisplay}.`}
          confirmLabel="Launch Active"
          variant="default"
          onConfirm={() => handleLaunch("ENABLED")}
        />

        {publishState === "publishing" && (
          <div className="flex flex-col items-center gap-3">
            <LoaderIcon className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Creating campaign on Google Ads...
            </p>
          </div>
        )}

        {publishState === "success" && (
          <SuccessBanner
            message="Google Ads campaign is live!"
            autoDismiss={false}
            className="w-full max-w-md"
          />
        )}

        {publishState === "error" && (
          <ErrorBanner
            message={errorMsg || "Campaign creation failed. Check your Google Ads account permissions and try again."}
            onRetry={() => handleLaunch("ENABLED")}
            className="w-full max-w-md"
          />
        )}
      </div>
    </div>
  )
}
