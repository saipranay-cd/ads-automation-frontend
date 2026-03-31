"use client"

import { useGoogleWizardStore } from "@/lib/google-wizard-store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function GoogleStepAdGroup() {
  const { draft, updateDraft } = useGoogleWizardStore()

  // Convert micros to dollars for display
  const cpcBidDollars = draft.defaultCpcBidMicros
    ? (draft.defaultCpcBidMicros / 1_000_000).toString()
    : ""

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Ad Group Name */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="adGroupName">Ad Group Name</Label>
        <Input
          id="adGroupName"
          placeholder="e.g. Brand Terms"
          value={draft.adGroupName}
          onChange={(e) => updateDraft({ adGroupName: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Group related keywords and ads together under a descriptive name.
        </p>
      </div>

      {/* Default CPC Bid */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="defaultCpcBid">Default CPC Bid (₹)</Label>
        <div className="relative max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">
            ₹
          </span>
          <Input
            id="defaultCpcBid"
            type="number"
            min={0}
            step="0.01"
            className="pl-7 font-mono tabular-nums"
            placeholder="2.00"
            value={cpcBidDollars}
            onChange={(e) =>
              updateDraft({
                defaultCpcBidMicros: e.target.value
                  ? Math.round(Number(e.target.value) * 1_000_000)
                  : 0,
              })
            }
          />
        </div>
        <p className="text-xs text-muted-foreground">
          The maximum amount you are willing to pay per click. This can be overridden at the keyword level.
        </p>
      </div>
    </div>
  )
}
