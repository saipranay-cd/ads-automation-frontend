"use client"

import { useGoogleWizardStore } from "@/lib/google-wizard-store"
import type { GoogleCampaignType, GoogleBiddingStrategy } from "@/lib/google-wizard-store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchIcon, MonitorIcon } from "lucide-react"

const BIDDING_STRATEGIES: { value: GoogleBiddingStrategy; label: string }[] = [
  { value: "MAXIMIZE_CLICKS", label: "Maximize Clicks" },
  { value: "MAXIMIZE_CONVERSIONS", label: "Maximize Conversions" },
  { value: "TARGET_CPA", label: "Target CPA" },
  { value: "MANUAL_CPC", label: "Manual CPC" },
]

export function GoogleStepCampaign() {
  const { draft, updateDraft } = useGoogleWizardStore()

  // Convert micros to dollars for display
  const budgetDollars = draft.dailyBudgetMicros
    ? (draft.dailyBudgetMicros / 1_000_000).toString()
    : ""

  const targetCpaDollars = draft.targetCpa
    ? (draft.targetCpa / 1_000_000).toString()
    : ""

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Campaign Name */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="campaignName">Campaign Name</Label>
        <Input
          id="campaignName"
          placeholder="e.g. Brand Search US Q2"
          value={draft.campaignName}
          onChange={(e) => updateDraft({ campaignName: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Tip: [Brand] [Type] [Region] [Quarter]
        </p>
      </div>

      {/* Campaign Type */}
      <div className="flex flex-col gap-2">
        <Label>Campaign Type</Label>
        <RadioGroup
          value={draft.campaignType}
          onValueChange={(v) => updateDraft({ campaignType: v as GoogleCampaignType })}
          className="grid grid-cols-2 gap-3"
        >
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-4 py-4 text-sm transition-colors has-data-checked:border-primary has-data-checked:bg-primary/5 dark:bg-input/30 dark:has-data-checked:bg-primary/10">
            <RadioGroupItem value="SEARCH" className="sr-only" />
            <SearchIcon className="size-5 text-muted-foreground" />
            <span className="font-medium">Search</span>
            <span className="text-center text-xs text-muted-foreground">
              Text ads on Google Search results
            </span>
          </label>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-input px-4 py-4 text-sm transition-colors has-data-checked:border-primary has-data-checked:bg-primary/5 dark:bg-input/30 dark:has-data-checked:bg-primary/10">
            <RadioGroupItem value="DISPLAY" className="sr-only" />
            <MonitorIcon className="size-5 text-muted-foreground" />
            <span className="font-medium">Display</span>
            <span className="text-center text-xs text-muted-foreground">
              Visual ads across the Google Display Network
            </span>
          </label>
        </RadioGroup>
      </div>

      {/* Daily Budget + Bidding Strategy */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="dailyBudget">Daily Budget (₹)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">
              ₹
            </span>
            <Input
              id="dailyBudget"
              type="number"
              min={0}
              step="0.01"
              className="pl-7 font-mono tabular-nums"
              placeholder="50.00"
              value={budgetDollars}
              onChange={(e) =>
                updateDraft({
                  dailyBudgetMicros: e.target.value
                    ? Math.round(Number(e.target.value) * 1_000_000)
                    : 0,
                })
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Bidding Strategy</Label>
          <p className="text-xs text-muted-foreground">
            Controls how Google optimizes your ad delivery and spending.
          </p>
          <Select
            value={draft.biddingStrategy}
            onValueChange={(v) =>
              updateDraft({
                biddingStrategy: v as GoogleBiddingStrategy,
                targetCpa: v !== "TARGET_CPA" ? null : draft.targetCpa,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BIDDING_STRATEGIES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Target CPA (conditional) */}
      {draft.biddingStrategy === "TARGET_CPA" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="targetCpa">Target CPA (₹)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">
              ₹
            </span>
            <Input
              id="targetCpa"
              type="number"
              min={0}
              step="0.01"
              className="pl-7 font-mono tabular-nums"
              placeholder="10.00"
              value={targetCpaDollars}
              onChange={(e) =>
                updateDraft({
                  targetCpa: e.target.value
                    ? Math.round(Number(e.target.value) * 1_000_000)
                    : null,
                })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The average amount you're willing to pay per conversion.
          </p>
        </div>
      )}
    </div>
  )
}
