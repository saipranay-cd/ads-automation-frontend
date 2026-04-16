"use client"

import { useState, useCallback, useEffect } from "react"
import { Save, Plus, X, Loader2 } from "lucide-react"
import { useAccountKB, useUpsertAccountKB } from "@/hooks/use-knowledge-base"
import { useIsAdmin } from "@/hooks/use-role"
import { showSuccess } from "@/components/layout/ErrorToast"
import type { KBLink } from "@/types/adsflow"

export function AccountKBEditor({ adAccountId }: { adAccountId: string }) {
  const { data: accountKb, isLoading } = useAccountKB(adAccountId)
  const upsertAccount = useUpsertAccountKB()
  const isAdmin = useIsAdmin()

  const [productDescription, setProductDescription] = useState("")
  const [idealCustomer, setIdealCustomer] = useState("")
  const [pricingContext, setPricingContext] = useState("")
  const [competitorContext, setCompetitorContext] = useState("")
  const [customNotes, setCustomNotes] = useState("")
  const [links, setLinks] = useState<KBLink[]>([])
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setProductDescription(accountKb?.productDescription || "")
    setIdealCustomer(accountKb?.idealCustomer || "")
    setPricingContext(accountKb?.pricingContext || "")
    setCompetitorContext(accountKb?.competitorContext || "")
    setCustomNotes(accountKb?.customNotes || "")
    setLinks(accountKb?.links || [])
    setDirty(false)
  }, [accountKb])

  const d = useCallback(<T,>(setter: (v: T) => void) => (v: T) => { setter(v); setDirty(true) }, [])

  const handleSave = () => {
    const validLinks = links.filter((l) => l.url.trim() && l.description.trim())
    upsertAccount.mutate({ adAccountId, productDescription, idealCustomer, pricingContext, competitorContext, customNotes, links: validLinks },
      { onSuccess: () => { setDirty(false); showSuccess("Knowledge base saved") } })
  }

  const updateLink = (idx: number, field: keyof KBLink, value: string) => {
    const updated = [...links]
    updated[idx] = { ...updated[idx], [field]: value }
    setLinks(updated)
    setDirty(true)
  }

  const removeLink = (idx: number) => { setLinks(links.filter((_, i) => i !== idx)); setDirty(true) }
  const addLink = () => { setLinks([...links, { url: "", description: "" }]); setDirty(true) }

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 size={16} className="animate-spin" style={{ color: "var(--text-tertiary)" }} /></div>
  }

  const readOnly = !isAdmin

  return (
    <div className="space-y-3">
      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        Shared business context used by the AI across all campaigns.
      </p>

      <Field label="Product / Service" placeholder="What you sell and who it's for — include category, tier, and key features."
        value={productDescription} onChange={d(setProductDescription)} readOnly={readOnly} />
      <Field label="Ideal Customer" placeholder="Age range, role, income, location, and any qualifying criteria."
        value={idealCustomer} onChange={d(setIdealCustomer)} readOnly={readOnly} />
      <Field label="Pricing" placeholder="Price range or payment terms. E.g., starting price, package tiers, financing options."
        value={pricingContext} onChange={d(setPricingContext)} readOnly={readOnly} rows={2} />
      <Field label="Competitors" placeholder="Name your top 2–4 competitors. Helps the AI avoid their angles and highlight your edge."
        value={competitorContext} onChange={d(setCompetitorContext)} readOnly={readOnly} rows={2} />
      <Field label="Additional Notes" placeholder="Market conditions, seasonal patterns, etc."
        value={customNotes} onChange={d(setCustomNotes)} readOnly={readOnly} rows={2} />

      <div>
        <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Reference Links</label>
        <div className="space-y-2">
          {links.map((link, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="flex-1 space-y-1">
                <input type="url" placeholder="https://example.com" value={link.url}
                  onChange={(e) => updateLink(idx, "url", e.target.value)} readOnly={readOnly}
                  className="w-full rounded-md px-2.5 py-1.5 text-[12px] outline-none"
                  style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
                <input type="text" placeholder="Description" value={link.description}
                  onChange={(e) => updateLink(idx, "description", e.target.value)} readOnly={readOnly}
                  className="w-full rounded-md px-2.5 py-1.5 text-[12px] outline-none"
                  style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
              </div>
              {!readOnly && <button onClick={() => removeLink(idx)} className="mt-1 rounded p-1 hover:opacity-80" style={{ color: "var(--text-tertiary)" }}><X size={13} /></button>}
            </div>
          ))}
          {!readOnly && (
            <button onClick={addLink}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium hover:opacity-80"
              style={{ color: "var(--acc-text)", background: "var(--acc-subtle)" }}><Plus size={11} /> Add Link</button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end pt-1">
          <button onClick={handleSave} disabled={!dirty || upsertAccount.isPending}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--acc-solid)", color: "white" }}>
            {upsertAccount.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
          </button>
        </div>
      )}
    </div>
  )
}

function Field({ label, placeholder, value, onChange, readOnly, rows = 2 }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; readOnly?: boolean; rows?: number
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>{label}</label>
      <textarea rows={rows} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} readOnly={readOnly}
        className="w-full resize-y rounded-md px-2.5 py-1.5 text-[12px] outline-none"
        style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)", color: "var(--text-primary)", opacity: readOnly ? 0.6 : 1 }} />
    </div>
  )
}
