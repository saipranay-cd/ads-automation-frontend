"use client"

import { useWizardStore } from "@/lib/wizard-store"
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
import type {
  Objective,
  SpecialAdCategory,
  BidStrategy,
  BudgetType,
} from "@/types/adsflow"

const OBJECTIVES: Objective[] = [
  "Lead Generation",
  "Traffic",
  "Brand Awareness",
  "Conversions",
  "Reach",
]

const AD_CATEGORIES: SpecialAdCategory[] = [
  "Housing",
  "Credit",
  "Employment",
  "None",
]

const BID_STRATEGIES: BidStrategy[] = [
  "Lowest Cost",
  "Cost Cap",
  "Bid Cap",
  "Target Cost",
]

export function StepCampaign() {
  const { draft, updateDraft } = useWizardStore()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Campaign Name — full width */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="campaignName">Campaign Name</Label>
        <Input
          id="campaignName"
          placeholder="e.g. Godrej Woods BLR LeadGen Q2"
          value={draft.campaignName}
          onChange={(e) => updateDraft({ campaignName: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Tip: [Project] [City] [Objective] [Quarter]
        </p>
      </div>

      {/* Objective + Special Ad Category — side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Objective</Label>
          <Select
            value={draft.objective}
            onValueChange={(v) => updateDraft({ objective: v as Objective })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OBJECTIVES.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Special Ad Category</Label>
          <p className="text-xs text-muted-foreground">
            Housing, credit, or employment ads require this per Meta policy.
          </p>
          <Select
            value={draft.specialAdCategory}
            onValueChange={(v) =>
              updateDraft({ specialAdCategory: v as SpecialAdCategory })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AD_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Budget Type + Budget — side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Budget Type</Label>
          <RadioGroup
            value={draft.budgetType}
            onValueChange={(v) => updateDraft({ budgetType: v as BudgetType })}
            className="flex gap-2"
          >
            {(["DAILY", "LIFETIME"] as const).map((bt) => (
              <label
                key={bt}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-input px-3 py-2 text-sm transition-colors has-data-checked:border-primary has-data-checked:bg-primary/5 dark:bg-input/30 dark:has-data-checked:bg-primary/10"
              >
                <RadioGroupItem value={bt} className="sr-only" />
                {bt === "DAILY" ? "Daily" : "Lifetime"}
              </label>
            ))}
          </RadioGroup>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="budget">Budget (₹)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">
              ₹
            </span>
            <Input
              id="budget"
              type="number"
              min={1}
              className="pl-7 font-mono tabular-nums"
              placeholder="1500"
              value={draft.dailyBudget || ""}
              onChange={(e) =>
                updateDraft({
                  dailyBudget: e.target.value ? Number(e.target.value) : 0,
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Bid Strategy — full width */}
      <div className="flex flex-col gap-2">
        <Label>Bid Strategy</Label>
        <p className="text-xs text-muted-foreground">
          Controls how Meta optimizes your ad delivery and spending.
        </p>
        <Select
          value={draft.bidStrategy}
          onValueChange={(v) => updateDraft({ bidStrategy: v as BidStrategy })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BID_STRATEGIES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
