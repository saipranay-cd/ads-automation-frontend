"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Zap, AlertCircle, Loader2 } from "lucide-react"

export default function OrgLoginPage() {
  const router = useRouter()

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
        setError(data.error || data.message || "Invalid email or password.")
        return
      }

      const result = data.data || data
      if (result.token) {
        localStorage.setItem("org-token", result.token)
      }
      // Store user info for display
      if (result.user) {
        localStorage.setItem("org-user", JSON.stringify({
          name: result.user.name || result.user.email,
          email: result.user.email,
        }))
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
            Sign in with your organization email and password.
          </p>
        </div>

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
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-md px-3 py-2 text-sm outline-none transition-colors"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--acc)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border-default)")
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full rounded-md px-3 py-2 text-sm outline-none transition-colors"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--acc)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border-default)")
              }
            />
          </div>

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
          href="/login"
          className="text-center text-xs transition-colors hover:underline"
          style={{ color: "var(--text-tertiary)" }}
        >
          Sign in with Meta instead
        </Link>
      </div>
    </div>
  )
}
