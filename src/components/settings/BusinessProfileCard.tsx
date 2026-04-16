"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Check, Loader2, Pencil, X } from "lucide-react"
import { useCurrentOrg, useOrgProfile, useUpdateOrgProfile } from "@/hooks/use-org"
import { INDUSTRIES, getIndustry } from "@/config/industries"
import {
  TEAM_SIZES,
  BUSINESS_TYPES,
  PRIMARY_GOALS,
  CURRENCIES,
  LOCALES,
} from "@/config/onboarding-options"
import { IndustryCard } from "@/components/auth/IndustryCard"
import { PillGroup } from "@/components/auth/PillGroup"
import { AuthInput } from "@/components/auth/AuthInput"

function labelForId<T extends { id: string; label: string }>(list: readonly T[], id: string | null | undefined): string {
  if (!id) return "—"
  return list.find((i) => i.id === id)?.label || id
}

function labelForCode<T extends { code: string; label: string }>(list: readonly T[], code: string | null | undefined): string {
  if (!code) return "—"
  return list.find((i) => i.code === code)?.label || code
}

export function BusinessProfileCard() {
  const { data: orgData } = useCurrentOrg()
  const orgId = orgData?.data?.[0]?.id
  const { data: profileData } = useOrgProfile(orgId)
  const profile = profileData?.data

  const update = useUpdateOrgProfile(orgId)

  const [editing, setEditing] = useState(false)
  const [industry, setIndustry] = useState("")
  const [industryOther, setIndustryOther] = useState("")
  const [teamSize, setTeamSize] = useState("")
  const [businessType, setBusinessType] = useState("")
  const [primaryGoal, setPrimaryGoal] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [locale, setLocale] = useState("en-US")

  useEffect(() => {
    if (!profile) return
    setIndustry(profile.industry || "")
    setIndustryOther(profile.industryOther || "")
    setTeamSize(profile.teamSize || "")
    setBusinessType(profile.businessType || "")
    setPrimaryGoal(profile.primaryGoal || "")
    setCurrency(profile.currency || "USD")
    setLocale(profile.locale || "en-US")
  }, [profile])

  async function handleSave() {
    await update.mutateAsync({
      industry,
      industryOther: industry === "other" ? industryOther.trim() : null,
      teamSize,
      businessType,
      primaryGoal,
      currency,
      locale,
    })
    setEditing(false)
  }

  const industryMeta = getIndustry(profile?.industry)
  const IndustryIcon = industryMeta.icon
  const displayIndustryLabel =
    profile?.industry === "other" && profile.industryOther
      ? profile.industryOther
      : industryMeta.label
  const displayIndustry = (
    <span className="flex items-center gap-1.5">
      <IndustryIcon size={13} strokeWidth={1.75} style={{ color: "var(--text-tertiary)" }} />
      {displayIndustryLabel}
    </span>
  )

  return (
    <div
      className="rounded-lg"
      style={{
        background: "var(--bg-base)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
          Business Profile
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium"
            style={{ color: "var(--text-secondary)", background: "var(--bg-subtle)" }}
          >
            <Pencil size={11} /> Edit
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            <X size={11} /> Cancel
          </button>
        )}
      </div>

      <div
        className="border-t px-4 pb-4 pt-3"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        {!editing ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
            <ReadRow label="Industry" value={displayIndustry} />
            <ReadRow label="Team size" value={labelForId(TEAM_SIZES, profile?.teamSize)} />
            <ReadRow label="Business model" value={labelForId(BUSINESS_TYPES, profile?.businessType)} />
            <ReadRow label="Primary goal" value={labelForId(PRIMARY_GOALS, profile?.primaryGoal)} />
            <ReadRow label="Currency" value={labelForCode(CURRENCIES, profile?.currency)} />
            <ReadRow label="Locale" value={labelForCode(LOCALES, profile?.locale)} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>Industry</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {INDUSTRIES.map((ind) => (
                  <IndustryCard
                    key={ind.id}
                    industry={ind}
                    selected={industry === ind.id}
                    onClick={() => setIndustry(ind.id)}
                  />
                ))}
              </div>
              {industry === "other" && (
                <AuthInput
                  id="industryOther"
                  label="Describe your industry"
                  value={industryOther}
                  onChange={setIndustryOther}
                  placeholder="e.g. Pet grooming salon"
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>Team size</label>
              <PillGroup options={TEAM_SIZES} value={teamSize} onChange={setTeamSize} columns={3} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>Business model</label>
              <PillGroup options={BUSINESS_TYPES} value={businessType} onChange={setBusinessType} columns={4} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>Primary goal</label>
              <PillGroup options={PRIMARY_GOALS} value={primaryGoal} onChange={setPrimaryGoal} columns={3} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="settings-currency" className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>Currency</label>
                <select
                  id="settings-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-md px-2 py-1.5 text-[12px]"
                  style={{ background: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="settings-locale" className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>Locale</label>
                <select
                  id="settings-locale"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="rounded-md px-2 py-1.5 text-[12px]"
                  style={{ background: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
                >
                  {LOCALES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={update.isPending || !industry || !teamSize || !businessType || !primaryGoal}
                className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-medium text-white transition-all disabled:opacity-60"
                style={{ background: "var(--acc)" }}
              >
                {update.isPending ? (
                  <><Loader2 size={11} className="animate-spin" /> Saving</>
                ) : (
                  <><Check size={11} /> Save changes</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ReadRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10.5px] uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  )
}
