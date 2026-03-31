"use client"

import { useGoogleWizardStore } from "@/lib/google-wizard-store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PlusIcon, XIcon } from "lucide-react"

export function GoogleStepAd() {
  const { draft, updateDraft, addHeadline, removeHeadline, addDescription, removeDescription } =
    useGoogleWizardStore()

  function handleHeadlineChange(index: number, value: string) {
    const updated = [...draft.headlines]
    updated[index] = value
    updateDraft({ headlines: updated })
  }

  function handleDescriptionChange(index: number, value: string) {
    const updated = [...draft.descriptions]
    updated[index] = value
    updateDraft({ descriptions: updated })
  }

  // Pick first 3 non-empty headlines and 2 non-empty descriptions for preview
  const previewHeadlines = draft.headlines.filter((h) => h.trim()).slice(0, 3)
  const previewDescriptions = draft.descriptions.filter((d) => d.trim()).slice(0, 2)
  const previewUrl = draft.finalUrl || "https://example.com"
  let displayUrl: string
  try {
    const url = new URL(previewUrl)
    displayUrl =
      url.hostname +
      (draft.path1 ? `/${draft.path1}` : "") +
      (draft.path2 ? `/${draft.path2}` : "")
  } catch {
    displayUrl =
      "example.com" +
      (draft.path1 ? `/${draft.path1}` : "") +
      (draft.path2 ? `/${draft.path2}` : "")
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Headlines */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Headlines (min 3, max 15)</Label>
          <span className="text-xs font-mono text-muted-foreground">
            {draft.headlines.length}/15
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {draft.headlines.map((headline, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-6 text-right text-xs font-mono text-muted-foreground">
                {idx + 1}.
              </span>
              <Input
                placeholder={`Headline ${idx + 1} (max 30 chars)`}
                maxLength={30}
                value={headline}
                onChange={(e) => handleHeadlineChange(idx, e.target.value)}
                className="flex-1"
              />
              <span className="w-8 text-right text-[10px] font-mono text-muted-foreground">
                {headline.length}/30
              </span>
              <button
                onClick={() => removeHeadline(idx)}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remove headline ${idx + 1}`}
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        {draft.headlines.length < 15 && (
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => addHeadline("")}
          >
            <PlusIcon className="size-4" data-icon="inline-start" />
            Add Headline
          </Button>
        )}
        {draft.headlines.length < 3 && (
          <p className="text-xs text-destructive">
            At least 3 headlines are required.
          </p>
        )}
      </div>

      {/* Descriptions */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Descriptions (min 2, max 4)</Label>
          <span className="text-xs font-mono text-muted-foreground">
            {draft.descriptions.length}/4
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {draft.descriptions.map((desc, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-6 text-right text-xs font-mono text-muted-foreground">
                {idx + 1}.
              </span>
              <Input
                placeholder={`Description ${idx + 1} (max 90 chars)`}
                maxLength={90}
                value={desc}
                onChange={(e) => handleDescriptionChange(idx, e.target.value)}
                className="flex-1"
              />
              <span className="w-8 text-right text-[10px] font-mono text-muted-foreground">
                {desc.length}/90
              </span>
              <button
                onClick={() => removeDescription(idx)}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remove description ${idx + 1}`}
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        {draft.descriptions.length < 4 && (
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => addDescription("")}
          >
            <PlusIcon className="size-4" data-icon="inline-start" />
            Add Description
          </Button>
        )}
        {draft.descriptions.length < 2 && (
          <p className="text-xs text-destructive">
            At least 2 descriptions are required.
          </p>
        )}
      </div>

      {/* Final URL */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="finalUrl">Final URL</Label>
        <Input
          id="finalUrl"
          type="url"
          placeholder="https://example.com/landing-page"
          value={draft.finalUrl}
          onChange={(e) => updateDraft({ finalUrl: e.target.value })}
        />
      </div>

      {/* Display Paths */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="path1">Display Path 1 (optional)</Label>
          <Input
            id="path1"
            placeholder="e.g. shoes"
            maxLength={15}
            value={draft.path1}
            onChange={(e) => updateDraft({ path1: e.target.value })}
          />
          <span className="text-[10px] font-mono text-muted-foreground">
            {draft.path1.length}/15
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="path2">Display Path 2 (optional)</Label>
          <Input
            id="path2"
            placeholder="e.g. running"
            maxLength={15}
            value={draft.path2}
            onChange={(e) => updateDraft({ path2: e.target.value })}
          />
          <span className="text-[10px] font-mono text-muted-foreground">
            {draft.path2.length}/15
          </span>
        </div>
      </div>

      {/* Live Preview */}
      <div className="flex flex-col gap-2">
        <Label>Ad Preview</Label>
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex flex-col gap-1">
            {/* URL line */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Ad</span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {" "}
                · {displayUrl}
              </span>
            </div>
            {/* Headline */}
            <p className="text-lg font-medium leading-snug" style={{ color: "hsl(217, 89%, 55%)" }}>
              {previewHeadlines.length > 0
                ? previewHeadlines.join(" | ")
                : "Headline 1 | Headline 2 | Headline 3"}
            </p>
            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {previewDescriptions.length > 0
                ? previewDescriptions.join(" ")
                : "Your ad description will appear here. Add at least 2 descriptions."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
