"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Zap, ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react"
import { apiFetch } from "@/lib/api-fetch"
import { useCurrentOrg } from "@/hooks/use-org"
import { AuthInput } from "@/components/auth/AuthInput"
import { PillGroup } from "@/components/auth/PillGroup"
import { IndustryCard } from "@/components/auth/IndustryCard"
import { INDUSTRIES } from "@/config/industries"
import {
  TEAM_SIZES,
  BUSINESS_TYPES,
  PRIMARY_GOALS,
  CURRENCIES,
  LOCALES,
  LOCALE_TO_CURRENCY,
} from "@/config/onboarding-options"

const STEPS = ["Industry", "Business", "Goal", "Region"] as const

export default function OnboardingPage() {
  const router = useRouter()
  const { data: orgData, refetch } = useCurrentOrg()
  const org = orgData?.data?.[0]
  const orgId = org?.id

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Industry
  const [industry, setIndustry] = useState<string>("")
  const [industryOther, setIndustryOther] = useState("")

  // Step 2: Business details
  const [teamSize, setTeamSize] = useState<string>("")
  const [businessType, setBusinessType] = useState<string>("")

  // Step 3: Primary goal
  const [primaryGoal, setPrimaryGoal] = useState<string>("")

  // Step 4: Currency + locale
  const [currency, setCurrency] = useState("USD")
  const [locale, setLocale] = useState("en-US")

  // Skip onboarding if the org is already onboarded (e.g. user hit the URL directly)
  useEffect(() => {
    if (org?.onboardedAt) {
      document.cookie = "org-onboarded=1; path=/; max-age=31536000; samesite=lax"
      router.replace("/")
    }
  }, [org?.onboardedAt, router])

  // Auto-detect locale / currency on mount
  useEffect(() => {
    try {
      const nav = typeof navigator !== "undefined" ? navigator.language : "en-US"
      if (nav && LOCALES.some((l) => l.code === nav)) {
        setLocale(nav)
      }
      if (nav && LOCALE_TO_CURRENCY[nav]) {
        setCurrency(LOCALE_TO_CURRENCY[nav])
      }
    } catch {
      // ignore — defaults are fine
    }
  }, [])

  // When industry is picked, pre-fill primary goal from the industry's default
  useEffect(() => {
    if (!industry || primaryGoal) return
    const picked = INDUSTRIES.find((i) => i.id === industry)
    if (picked) setPrimaryGoal(picked.defaultPrimaryGoal)
  }, [industry, primaryGoal])

  const canAdvance = useMemo(() => {
    if (step === 0) {
      if (!industry) return false
      if (industry === "other" && industryOther.trim().length < 2) return false
      return true
    }
    if (step === 1) return !!teamSize && !!businessType
    if (step === 2) return !!primaryGoal
    if (step === 3) return !!currency && !!locale
    return false
  }, [step, industry, industryOther, teamSize, businessType, primaryGoal, currency, locale])

  async function handleFinish() {
    if (!orgId) {
      setError("Could not find your organization. Please log in again.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await apiFetch(`/api/org/${orgId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry,
          industryOther: industry === "other" ? industryOther.trim() : null,
          teamSize,
          businessType,
          primaryGoal,
          currency,
          locale,
          markOnboarded: true,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error?.message || "Could not save. Please try again.")
        return
      }
      document.cookie = "org-onboarded=1; path=/; max-age=31536000; samesite=lax"
      await refetch()
      router.push("/setup")
    } catch {
      setError("Network error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page p-4">
      <div
        className="flex w-full max-w-xl flex-col gap-6 rounded-xl p-8"
        style={{
          background: "var(--bg-base)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: "var(--acc)", boxShadow: "var(--shadow-glow)" }}
          >
            <Zap size={20} color="white" />
          </div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Tell us about your business
          </h1>
          <p className="text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            We&apos;ll tailor insights, prompts, and reports to your industry.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => i < step && setStep(i)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-all"
              style={{
                background: i === step ? "var(--acc-subtle)" : "transparent",
                color: i === step ? "var(--acc-text)" : "var(--text-tertiary)",
                border: i === step ? "1px solid var(--acc-border)" : "1px solid transparent",
                cursor: i < step ? "pointer" : "default",
              }}
            >
              {i < step ? <Check size={10} /> : null}
              {s}
            </button>
          ))}
        </div>

        {/* Step content */}
        <div className="flex flex-col gap-4">
          {step === 0 && (
            <>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Pick the closest match. We use this to tailor AI insights and recommendations.
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
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
                  placeholder="e.g. Pet grooming, Yoga studio, Catering…"
                />
              )}
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Team size
                </label>
                <PillGroup
                  options={TEAM_SIZES}
                  value={teamSize}
                  onChange={setTeamSize}
                  columns={3}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Business model
                </label>
                <PillGroup
                  options={BUSINESS_TYPES}
                  value={businessType}
                  onChange={setBusinessType}
                  columns={4}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                What matters most for your ad campaigns? This shapes which metrics we
                prioritize in recommendations.
              </p>
              <PillGroup
                options={PRIMARY_GOALS}
                value={primaryGoal}
                onChange={setPrimaryGoal}
                columns={3}
              />
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                We&apos;ll show amounts and format reports using these.
              </p>
              <div className="flex flex-col gap-2">
                <label htmlFor="currency" className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-md px-3 py-2 text-sm"
                  style={{
                    background: "var(--bg-subtle)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="locale" className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Locale
                </label>
                <select
                  id="locale"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="rounded-md px-3 py-2 text-sm"
                  style={{
                    background: "var(--bg-subtle)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  {LOCALES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {error && (
          <p className="text-xs font-medium" style={{ color: "var(--red-text)" }}>
            {error}
          </p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => (step > 0 ? setStep(step - 1) : undefined)}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-30"
            style={{ color: "var(--text-secondary)" }}
          >
            <ChevronLeft size={12} />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => canAdvance && setStep(step + 1)}
              disabled={!canAdvance}
              className="flex items-center gap-1 rounded-md px-4 py-2 text-xs font-medium text-white transition-all disabled:opacity-60"
              style={{ background: "var(--acc)" }}
            >
              Next <ChevronRight size={12} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={!canAdvance || saving}
              className="flex items-center gap-1 rounded-md px-4 py-2 text-xs font-medium text-white transition-all disabled:opacity-60"
              style={{ background: "var(--acc)" }}
            >
              {saving ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check size={12} /> Finish
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
