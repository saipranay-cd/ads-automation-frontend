"use client"

import { useState } from "react"
import { useGoogleWizardStore } from "@/lib/google-wizard-store"
import type { KeywordMatchType } from "@/lib/google-wizard-store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusIcon, XIcon, ListIcon } from "lucide-react"

const MATCH_TYPE_LABELS: Record<KeywordMatchType, string> = {
  EXACT: "Exact",
  PHRASE: "Phrase",
  BROAD: "Broad",
}

const MATCH_TYPE_VARIANTS: Record<KeywordMatchType, "default" | "secondary" | "outline"> = {
  EXACT: "default",
  PHRASE: "secondary",
  BROAD: "outline",
}

const MATCH_TYPE_FORMAT: Record<KeywordMatchType, (text: string) => string> = {
  EXACT: (t) => `[${t}]`,
  PHRASE: (t) => `"${t}"`,
  BROAD: (t) => t,
}

export function GoogleStepKeywords() {
  const { draft, addKeyword, removeKeyword } = useGoogleWizardStore()
  const [singleKeyword, setSingleKeyword] = useState("")
  const [matchType, setMatchType] = useState<KeywordMatchType>("BROAD")
  const [bulkText, setBulkText] = useState("")
  const [bulkMatchType, setBulkMatchType] = useState<KeywordMatchType>("BROAD")
  const [showBulk, setShowBulk] = useState(false)

  function handleAddSingle() {
    const text = singleKeyword.trim()
    if (!text) return
    addKeyword({ text, matchType })
    setSingleKeyword("")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddSingle()
    }
  }

  function handleBulkAdd() {
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    for (const line of lines) {
      addKeyword({ text: line, matchType: bulkMatchType })
    }
    setBulkText("")
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Single keyword add */}
      <div className="flex flex-col gap-2">
        <Label>Add Keyword</Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. running shoes"
            value={singleKeyword}
            onChange={(e) => setSingleKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Select
            value={matchType}
            onValueChange={(v) => setMatchType(v as KeywordMatchType)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXACT">Exact</SelectItem>
              <SelectItem value="PHRASE">Phrase</SelectItem>
              <SelectItem value="BROAD">Broad</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAddSingle} disabled={!singleKeyword.trim()}>
            <PlusIcon className="size-4" data-icon="inline-start" />
            Add
          </Button>
        </div>
      </div>

      {/* Bulk add toggle */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBulk(!showBulk)}
        >
          <ListIcon className="size-4" data-icon="inline-start" />
          {showBulk ? "Hide Bulk Add" : "Bulk Add Keywords"}
        </Button>
      </div>

      {showBulk && (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
          <Label>Paste keywords (one per line)</Label>
          <Textarea
            rows={5}
            placeholder={"running shoes\nbest running shoes\nbuy running shoes online"}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Match type for all:</span>
            <Select
              value={bulkMatchType}
              onValueChange={(v) => setBulkMatchType(v as KeywordMatchType)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXACT">Exact</SelectItem>
                <SelectItem value="PHRASE">Phrase</SelectItem>
                <SelectItem value="BROAD">Broad</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleBulkAdd}
              disabled={!bulkText.trim()}
            >
              Add All
            </Button>
          </div>
        </div>
      )}

      {/* Keyword list */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Keywords</Label>
          <span className="text-xs font-mono text-muted-foreground">
            {draft.keywords.length} keyword{draft.keywords.length !== 1 ? "s" : ""} added
          </span>
        </div>

        {draft.keywords.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No keywords added yet. Add at least 1 keyword to proceed.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
            {draft.keywords.map((kw, idx) => (
              <div
                key={`${kw.text}-${kw.matchType}-${idx}`}
                className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <Badge variant={MATCH_TYPE_VARIANTS[kw.matchType]}>
                    {MATCH_TYPE_LABELS[kw.matchType]}
                  </Badge>
                  <span className="font-mono text-xs">
                    {MATCH_TYPE_FORMAT[kw.matchType](kw.text)}
                  </span>
                </div>
                <button
                  onClick={() => removeKeyword(idx)}
                  className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove keyword ${kw.text}`}
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
