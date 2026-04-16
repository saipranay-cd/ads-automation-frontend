"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import Link from "next/link"
import { Zap, AlertCircle, Loader2 } from "lucide-react"
import { AuthStore, primeOnboardingCookie } from "@/lib/auth-store"
import { AuthInput } from "@/components/auth/AuthInput"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reason = searchParams.get("reason")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/org/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        const err = data.error
        const msg = typeof err === "string" ? err : err?.message || data.message
        if (res.status === 429) setError("Too many attempts. Please wait a minute and try again.")
        else if (res.status === 401) setError(msg || "Invalid email or password. Please check your credentials.")
        else setError(msg || "Something went wrong. Please try again.")
        return
      }

      const result = data.data || data
      if (result.token) {
        const user = result.user
          ? { name: result.user.name || result.user.email, email: result.user.email }
          : undefined
        AuthStore.setToken(result.token, user)
        // Prime the onboarding cookie from the server state so existing
        // onboarded users don't get bounced to /onboarding.
        await primeOnboardingCookie(result.token)
      }

      const callbackUrl = searchParams.get("callbackUrl") || "/"
      router.push(callbackUrl)
    } catch {
      setError("Could not reach the server. Check your connection and try again.")
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
            style={{
              background: "var(--acc)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <Zap size={20} color="white" />
          </div>
          <h1
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Sign in to Adsflow
          </h1>
          <p
            className="text-center text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            Enter your credentials to continue.
          </p>
        </div>

        {reason === "expired" && !error && (
          <div
            className="flex w-full items-start gap-2 rounded-lg px-3 py-2.5"
            style={{
              background: "var(--amber-bg)",
              border: "1px solid var(--amber-solid)",
            }}
          >
            <AlertCircle
              size={14}
              className="mt-0.5 shrink-0"
              style={{ color: "var(--amber-text)" }}
            />
            <span className="text-xs" style={{ color: "var(--amber-text)" }}>
              Your session has expired. Please sign in again.
            </span>
          </div>
        )}

        {error && (
          <div
            className="flex w-full items-start gap-2 rounded-lg px-3 py-2.5"
            style={{
              background: "var(--red-bg)",
              border: "1px solid var(--red-solid)",
            }}
          >
            <AlertCircle
              size={14}
              className="mt-0.5 shrink-0"
              style={{ color: "var(--red-text)" }}
            />
            <span className="text-xs" style={{ color: "var(--red-text)" }}>
              {error}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <AuthInput id="email" label="Email" type="email" required value={email} onChange={setEmail} placeholder="you@company.com" />
          <AuthInput id="password" label="Password" type="password" required value={password} onChange={setPassword} placeholder="Your password" />

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-white transition-all disabled:opacity-60"
            style={{
              background: "var(--acc)",
              boxShadow: "var(--shadow-glow)",
            }}
            onMouseEnter={(e) =>
              !loading && (e.currentTarget.style.background = "var(--acc-hover)")
            }
            onMouseLeave={(e) =>
              !loading && (e.currentTarget.style.background = "var(--acc)")
            }
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <Link
          href="/signup"
          className="text-center text-xs transition-colors hover:underline"
          style={{ color: "var(--text-tertiary)" }}
        >
          Don&apos;t have an account? Create a workspace
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
