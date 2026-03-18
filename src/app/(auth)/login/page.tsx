"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Zap, AlertCircle } from "lucide-react"

const errorMessages: Record<string, string> = {
  OAuthSignin: "Could not start Meta sign-in. Check your META_APP_ID and META_APP_SECRET in .env",
  OAuthCallback: "Meta returned an error during sign-in.",
  OAuthCreateAccount: "Could not create your account.",
  Callback: "Sign-in callback error.",
  Default: "Something went wrong. Please try again.",
}

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const errorMessage = error
    ? errorMessages[error] || errorMessages.Default
    : null

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
            Adsflow
          </h1>
          <p
            className="text-center text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            Connect your Meta Business Suite to manage ads with AI-powered
            insights.
          </p>
        </div>

        {errorMessage && (
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
              {errorMessage}
            </span>
          </div>
        )}

        <button
          onClick={() => signIn("facebook", { callbackUrl: "/" })}
          className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-white transition-all"
          style={{
            background: "var(--acc)",
            boxShadow: "var(--shadow-glow)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--acc-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--acc)")
          }
        >
          Continue with Meta
        </button>

        <p
          className="text-center text-xs"
          style={{ color: "var(--text-disabled)" }}
        >
          By continuing, you agree to connect your Meta ad accounts.
        </p>
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
