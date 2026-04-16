"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useState, useEffect } from "react"
import { Zap, AlertCircle, Loader2, CheckCircle } from "lucide-react"
import { AuthStore, primeOnboardingCookie } from "@/lib/auth-store"
import { AuthInput } from "@/components/auth/AuthInput"

interface InviteInfo {
  email: string
  name: string | null
  hasPassword: boolean
  orgName: string | null
}

function AcceptInviteForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") || ""

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [checking, setChecking] = useState(true)
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Check invite token on mount
  useEffect(() => {
    if (!token) {
      setChecking(false)
      setError("Missing invite token. Please use the link from your invitation email.")
      return
    }
    fetch(`/api/org/check-invite?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setInviteInfo(data.data)
          if (data.data.name) setName(data.data.name)
        } else {
          setError(data.error || "Invalid or expired invite token.")
        }
      })
      .catch(() => setError("Network error. Please try again."))
      .finally(() => setChecking(false))
  }, [token])

  const isExistingUser = inviteInfo?.hasPassword === true

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isExistingUser) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.")
        return
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.")
        return
      }
    }

    setLoading(true)
    try {
      const body: Record<string, string> = { inviteToken: token }
      if (!isExistingUser && password) body.password = password
      if (name) body.name = name

      const res = await fetch("/api/org/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        const err = data.error
        setError(typeof err === "string" ? err : err?.message || data.message || "Failed to accept invite.")
        return
      }

      const result = data.data || data
      if (result.token) {
        const user = result.user
          ? { name: result.user.name || name || result.user.email, email: result.user.email }
          : undefined
        AuthStore.setToken(result.token, user)
        await primeOnboardingCookie(result.token)
      }
      router.push("/")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page">
      <div
        className="flex w-full max-w-sm flex-col items-center gap-8 rounded-xl p-8"
        style={{
          background: "var(--bg-base)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: "var(--acc)", boxShadow: "var(--shadow-glow)" }}
          >
            <Zap size={20} color="white" />
          </div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {isExistingUser ? "Join Organization" : "Accept Invitation"}
          </h1>
          {inviteInfo?.orgName && (
            <p className="text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
              You&apos;ve been invited to join <strong style={{ color: "var(--text-primary)" }}>{inviteInfo.orgName}</strong>
            </p>
          )}
          {isExistingUser && inviteInfo?.email && (
            <p className="text-center text-xs" style={{ color: "var(--text-disabled)" }}>
              Signed in as {inviteInfo.email}
            </p>
          )}
        </div>

        {checking && (
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
        )}

        {error && (
          <div
            className="flex w-full items-start gap-2 rounded-lg px-3 py-2.5"
            style={{ background: "var(--red-bg)", border: "1px solid var(--red-solid)" }}
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--red-text)" }} />
            <span className="text-xs" style={{ color: "var(--red-text)" }}>{error}</span>
          </div>
        )}

        {inviteInfo && !checking && (
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
            {/* Existing user: just show a confirm button */}
            {isExistingUser ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <CheckCircle size={16} style={{ color: "#4ade80" }} />
                  Your account is ready
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-white transition-all disabled:opacity-60"
                  style={{ background: "var(--acc)", boxShadow: "var(--shadow-glow)" }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "var(--acc-hover)")}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "var(--acc)")}
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Joining...</> : "Join Organization"}
                </button>
              </div>
            ) : (
              <>
                {/* New user: show name + password fields */}
                <AuthInput id="name" label="Name" required value={name} onChange={setName} placeholder="Your full name" />
                <AuthInput id="password" label="Password" type="password" required value={password} onChange={setPassword} placeholder="At least 8 characters" />
                <AuthInput id="confirm-password" label="Confirm Password" type="password" required value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter your password" />

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-white transition-all disabled:opacity-60"
                  style={{ background: "var(--acc)", boxShadow: "var(--shadow-glow)" }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "var(--acc-hover)")}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.background = "var(--acc)")}
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Setting up...</> : "Create Account & Join"}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteForm />
    </Suspense>
  )
}
