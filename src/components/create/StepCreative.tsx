"use client"

import { useState, useMemo } from "react"
import { useWizardStore } from "@/lib/wizard-store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UploadIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import type { CallToAction } from "@/types/adsflow"

const CTA_OPTIONS: CallToAction[] = [
  "Learn More",
  "Sign Up",
  "Get Offer",
  "Book Now",
  "Contact Us",
  "Apply Now",
  "Download",
  "WhatsApp",
]

export function StepCreative() {
  const { draft, updateDraft } = useWizardStore()
  const [utmOpen, setUtmOpen] = useState(false)

  const creative = draft.creativeJson as { imagePreview?: string }

  const utmPreviewUrl = useMemo(() => {
    if (!draft.landingPageUrl) return ""
    try {
      const url = new URL(draft.landingPageUrl)
      if (draft.utmSource) url.searchParams.set("utm_source", draft.utmSource)
      if (draft.utmMedium) url.searchParams.set("utm_medium", draft.utmMedium)
      if (draft.utmCampaign) url.searchParams.set("utm_campaign", draft.utmCampaign)
      if (draft.utmContent) url.searchParams.set("utm_content", draft.utmContent)
      if (draft.utmTerm) url.searchParams.set("utm_term", draft.utmTerm)
      return url.toString()
    } catch {
      return draft.landingPageUrl
    }
  }, [draft.landingPageUrl, draft.utmSource, draft.utmMedium, draft.utmCampaign, draft.utmContent, draft.utmTerm])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      updateDraft({
        creativeJson: { ...draft.creativeJson, imagePreview: reader.result as string },
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Upload Creative — full width */}
      <div className="flex flex-col gap-2">
        <Label>Upload Creative</Label>
        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-input px-6 py-8 transition-colors hover:border-primary/50 hover:bg-primary/5">
          {creative.imagePreview ? (
            <img
              src={creative.imagePreview}
              alt="Preview"
              className="max-h-48 rounded-lg object-contain"
            />
          ) : (
            <>
              <UploadIcon className="size-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  Drag & drop image or video here
                </p>
                <p className="text-xs text-muted-foreground">
                  Recommended: 1080x1080 or 1080x1920
                </p>
              </div>
            </>
          )}
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
      </div>

      {/* Primary Text — full width */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="primaryText">Primary Text</Label>
        <Textarea
          id="primaryText"
          rows={3}
          placeholder="Discover premium 2 & 3 BHK apartments starting at ₹85L. World-class amenities, prime location near IT parks."
          value={draft.primaryText}
          onChange={(e) => updateDraft({ primaryText: e.target.value })}
        />
      </div>

      {/* Headline + Description — side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            placeholder="Book Your Dream Home Today"
            value={draft.headline}
            onChange={(e) => updateDraft({ headline: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Premium living in Bangalore's most sought-after neighborhood"
            value={draft.description}
            onChange={(e) => updateDraft({ description: e.target.value })}
          />
        </div>
      </div>

      {/* CTA + Landing Page URL — side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Call-to-Action</Label>
          <Select
            value={draft.callToAction}
            onValueChange={(v) =>
              updateDraft({ callToAction: v as CallToAction })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CTA_OPTIONS.map((cta) => (
                <SelectItem key={cta} value={cta}>
                  {cta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="landingPageUrl">Landing Page URL</Label>
          <Input
            id="landingPageUrl"
            type="url"
            placeholder="https://brickso.ai/godrej-woods"
            value={draft.landingPageUrl}
            onChange={(e) => updateDraft({ landingPageUrl: e.target.value })}
          />
        </div>
      </div>

      {/* UTM Parameters — collapsible */}
      <div className="rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setUtmOpen(!utmOpen)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/30"
        >
          UTM Parameters
          {utmOpen ? (
            <ChevronUpIcon className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          )}
        </button>
        {utmOpen && (
          <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">utm_source</Label>
                <Input
                  placeholder="meta"
                  value={draft.utmSource}
                  onChange={(e) => updateDraft({ utmSource: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">utm_medium</Label>
                <Input
                  placeholder="paid"
                  value={draft.utmMedium}
                  onChange={(e) => updateDraft({ utmMedium: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">utm_campaign</Label>
                <Input
                  placeholder={draft.campaignName || "campaign-name"}
                  value={draft.utmCampaign}
                  onChange={(e) => updateDraft({ utmCampaign: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">utm_content</Label>
                <Input
                  placeholder="optional"
                  value={draft.utmContent}
                  onChange={(e) => updateDraft({ utmContent: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">utm_term</Label>
                <Input
                  placeholder="optional"
                  value={draft.utmTerm}
                  onChange={(e) => updateDraft({ utmTerm: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>
            {utmPreviewUrl && (
              <div className="rounded-md bg-muted/30 p-3">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  URL Preview
                </p>
                <p className="break-all font-mono text-xs text-muted-foreground">
                  {utmPreviewUrl}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
