"use client"

import { useState, useRef, useEffect } from "react"
import { useWizardStore } from "@/lib/wizard-store"
import { useTargetingSearch } from "@/hooks/use-campaigns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { CheckIcon, SearchIcon } from "lucide-react"
import type { GenderTarget, AudienceType } from "@/types/adsflow"

const GEO_PRESETS = [
  "Bangalore IT Corridor",
  "Bangalore Whitefield",
  "Mumbai Western Suburbs",
  "Mumbai Thane Corridor",
  "Hyderabad HITEC City",
  "Hyderabad Tech City",
  "Pune Hinjewadi IT",
  "Pune Hinjawadi",
  "Delhi Gurgaon",
  "Delhi Noida Extension",
  "Delhi-NCR",
  "Chennai OMR",
  "Goa Coastal",
  "Kolkata New Town",
]

const INTEREST_PRESETS = [
  "Real Estate",
  "Property Investment",
  "Home Buying",
  "Luxury Living",
  "Interior Design",
  "Architecture",
  "NRI Investment",
  "Tax Planning",
  "Mortgage",
  "Flat Purchase",
  "Villa",
  "Plot",
  "Commercial Property",
  "Gated Community",
]

function ChipToggle({
  label,
  selected,
  onToggle,
}: {
  label: string
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        selected
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted/50"
      )}
    >
      {selected && <CheckIcon className="size-3" />}
      {label}
    </button>
  )
}

function SearchDropdown({
  type,
  placeholder,
  onSelect,
}: {
  type: "interest" | "location"
  placeholder: string
  onSelect: (name: string) => void
}) {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setDebouncedQuery(query), 300)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const { data } = useTargetingSearch(type, debouncedQuery)
  const results = data?.data || []

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="pl-8 text-xs"
        />
      </div>
      {open && results.length > 0 && (
        <div
          className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border shadow-md"
          style={{ background: "var(--bg-base)", borderColor: "var(--border-default)" }}
        >
          {results.map((r) => (
            <button
              key={r.id || r.key || r.name}
              className="w-full px-3 py-2 text-left text-xs transition-colors hover:bg-muted/50"
              onClick={() => {
                onSelect(r.name)
                setQuery("")
                setOpen(false)
              }}
            >
              {r.name}
              {r.country_code && (
                <span className="ml-1 text-muted-foreground">({r.country_code})</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function StepAdSet() {
  const { draft, updateDraft } = useWizardStore()

  function toggleLocation(loc: string) {
    const current = draft.locations
    if (current.includes(loc)) {
      updateDraft({ locations: current.filter((l) => l !== loc) })
    } else {
      updateDraft({ locations: [...current, loc] })
    }
  }

  function toggleInterest(interest: string) {
    const current = draft.interests
    if (current.includes(interest)) {
      updateDraft({ interests: current.filter((i) => i !== interest) })
    } else {
      updateDraft({ interests: [...current, interest] })
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Locations */}
      <div className="flex flex-col gap-3">
        <Label>Locations</Label>
        <SearchDropdown
          type="location"
          placeholder="Search for a city..."
          onSelect={(name) => {
            if (!draft.locations.includes(name)) {
              updateDraft({ locations: [...draft.locations, name] })
            }
          }}
        />
        <div className="flex flex-wrap gap-2">
          {GEO_PRESETS.map((loc) => (
            <ChipToggle
              key={loc}
              label={loc}
              selected={draft.locations.includes(loc)}
              onToggle={() => toggleLocation(loc)}
            />
          ))}
        </div>
      </div>

      {/* Age Range */}
      <div className="flex flex-col gap-3">
        <Label>
          Age Range: {draft.ageMin} — {draft.ageMax}
        </Label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={18}
            max={65}
            value={draft.ageMin}
            onChange={(e) => {
              const val = Number(e.target.value)
              if (val < draft.ageMax) updateDraft({ ageMin: val })
            }}
            className="flex-1 accent-primary"
          />
          <input
            type="range"
            min={18}
            max={65}
            value={draft.ageMax}
            onChange={(e) => {
              const val = Number(e.target.value)
              if (val > draft.ageMin) updateDraft({ ageMax: val })
            }}
            className="flex-1 accent-primary"
          />
        </div>
      </div>

      {/* Gender */}
      <div className="flex flex-col gap-2">
        <Label>Gender</Label>
        <RadioGroup
          value={draft.gender}
          onValueChange={(v) => updateDraft({ gender: v as GenderTarget })}
          className="flex gap-2"
        >
          {(["all", "male", "female"] as const).map((g) => (
            <label
              key={g}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-input px-3 py-2 text-sm capitalize transition-colors has-data-checked:border-primary has-data-checked:bg-primary/5 dark:bg-input/30 dark:has-data-checked:bg-primary/10"
            >
              <RadioGroupItem value={g} className="sr-only" />
              {g === "all" ? "All" : g.charAt(0).toUpperCase() + g.slice(1)}
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Interests */}
      <div className="flex flex-col gap-3">
        <Label>Interests</Label>
        <SearchDropdown
          type="interest"
          placeholder="Search for an interest..."
          onSelect={(name) => {
            if (!draft.interests.includes(name)) {
              updateDraft({ interests: [...draft.interests, name] })
            }
          }}
        />
        <div className="flex flex-wrap gap-2">
          {INTEREST_PRESETS.map((interest) => (
            <ChipToggle
              key={interest}
              label={interest}
              selected={draft.interests.includes(interest)}
              onToggle={() => toggleInterest(interest)}
            />
          ))}
        </div>
      </div>

      {/* Audience Type */}
      <div className="flex flex-col gap-2">
        <Label>Audience Type</Label>
        <RadioGroup
          value={draft.audienceType}
          onValueChange={(v) => updateDraft({ audienceType: v as AudienceType })}
          className="flex gap-2"
        >
          {(["Interest", "Custom", "Lookalike"] as const).map((t) => (
            <label
              key={t}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-input px-3 py-2 text-sm transition-colors has-data-checked:border-primary has-data-checked:bg-primary/5 dark:bg-input/30 dark:has-data-checked:bg-primary/10"
            >
              <RadioGroupItem value={t} className="sr-only" />
              {t}
            </label>
          ))}
        </RadioGroup>
      </div>
    </div>
  )
}
