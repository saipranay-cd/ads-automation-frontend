"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Zap, ChevronRight, ChevronLeft, Check, ExternalLink, Loader2 } from "lucide-react"
import { apiFetch } from "@/lib/api-fetch"
import { useCurrentOrg } from "@/hooks/use-org"

const STEPS = ["Meta Ads", "Google Ads"] as const

export default function SetupPage() {
  const router = useRouter()
  const { data: orgData } = useCurrentOrg()
  const orgId = orgData?.data?.[0]?.id

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [metaAppId, setMetaAppId] = useState("")
  const [metaAppSecret, setMetaAppSecret] = useState("")
  const [googleClientId, setGoogleClientId] = useState("")
  const [googleClientSecret, setGoogleClientSecret] = useState("")
  const [googleDevToken, setGoogleDevToken] = useState("")

  async function handleSave() {
    if (!orgId) return
    setSaving(true)
    setError(null)
    try {
      const res = await apiFetch(`/api/org/${orgId}/credentials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metaAppId: metaAppId || undefined,
          metaAppSecret: metaAppSecret || undefined,
          googleClientId: googleClientId || undefined,
          googleClientSecret: googleClientSecret || undefined,
          googleDevToken: googleDevToken || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error?.message || "Failed to save credentials")
        return
      }
      router.push("/settings")
    } catch {
      setError("Network error")
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    background: "var(--bg-subtle)",
    border: "1px solid var(--border-default)",
    color: "var(--text-primary)",
  }

  function InputField({ id, label, value, onChange, placeholder, type = "text" }: {
    id: string; label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string
  }) {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</label>
        <input
          id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md px-3 py-2 text-sm outline-none transition-colors font-mono"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--acc)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page">
      <div
        className="flex w-full max-w-lg flex-col gap-6 rounded-xl p-8"
        style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-card)" }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--acc)", boxShadow: "var(--shadow-glow)" }}>
            <Zap size={20} color="white" />
          </div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Setup Developer Credentials</h1>
          <p className="text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Enter your platform API credentials. You can skip and configure later in Settings.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-all"
              style={{
                background: i === step ? "var(--acc-subtle)" : "transparent",
                color: i === step ? "var(--acc-text)" : "var(--text-tertiary)",
                border: i === step ? "1px solid var(--acc-border)" : "1px solid transparent",
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
              <div className="rounded-lg p-3 text-xs" style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                Create a Meta Developer App at{" "}
                <a href="https://developers.facebook.com" target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-medium" style={{ color: "var(--acc-text)" }}>
                  developers.facebook.com <ExternalLink size={10} />
                </a>
                . Add <code className="rounded px-1 py-0.5 text-[10px]" style={{ background: "var(--bg-muted)" }}>your-domain.com/api/meta/auth/callback</code> as Valid OAuth Redirect URI.
              </div>
              <InputField id="metaAppId" label="Meta App ID" value={metaAppId} onChange={setMetaAppId} placeholder="e.g. 1839885030074651" />
              <InputField id="metaAppSecret" label="Meta App Secret" value={metaAppSecret} onChange={setMetaAppSecret} placeholder="e.g. a1317a048b6a550971c5fe..." type="password" />
            </>
          )}

          {step === 1 && (
            <>
              <div className="rounded-lg p-3 text-xs" style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                Create OAuth credentials at{" "}
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-medium" style={{ color: "var(--acc-text)" }}>
                  Google Cloud Console <ExternalLink size={10} />
                </a>
                . Get the developer token from{" "}
                <a href="https://ads.google.com/home/tools/manager-accounts/" target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-medium" style={{ color: "var(--acc-text)" }}>
                  Google Ads API Center <ExternalLink size={10} />
                </a>.
              </div>
              <InputField id="googleClientId" label="Google Client ID" value={googleClientId} onChange={setGoogleClientId} placeholder="e.g. 976969857948-...apps.googleusercontent.com" />
              <InputField id="googleClientSecret" label="Google Client Secret" value={googleClientSecret} onChange={setGoogleClientSecret} placeholder="e.g. GOCSPX-..." type="password" />
              <InputField id="googleDevToken" label="Google Ads Developer Token" value={googleDevToken} onChange={setGoogleDevToken} placeholder="e.g. h5Fr8-aNwmDYKjXGpXFDog" type="password" />
            </>
          )}

        </div>

        {error && (
          <p className="text-xs font-medium" style={{ color: "var(--red-text)" }}>{error}</p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : router.push("/settings")}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
            style={{ color: "var(--text-secondary)" }}
          >
            <ChevronLeft size={12} />
            {step > 0 ? "Back" : "Skip Setup"}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1 rounded-md px-4 py-2 text-xs font-medium text-white transition-all"
              style={{ background: "var(--acc)" }}
            >
              Next <ChevronRight size={12} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 rounded-md px-4 py-2 text-xs font-medium text-white transition-all disabled:opacity-60"
              style={{ background: "var(--acc)" }}
            >
              {saving ? <><Loader2 size={12} className="animate-spin" /> Saving...</> : <><Check size={12} /> Save & Continue</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
