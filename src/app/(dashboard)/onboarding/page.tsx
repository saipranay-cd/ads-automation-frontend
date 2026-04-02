"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "@/lib/api-fetch"
import { useSession, signIn } from "next-auth/react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import {
  CheckCircle, ArrowRight, ArrowLeft, SkipForward,
  Loader2, Facebook, Database, Link2, LayoutDashboard,
} from "lucide-react"
import { useAdAccounts, type AdAccount } from "@/hooks/use-campaigns"
import { useCrmConnection } from "@/hooks/use-crm"
import { useAppStore } from "@/lib/store"

// ── Step definitions ─────────────────────────────────────

const STEPS = [
  { id: "meta", label: "Connect Meta", icon: Facebook, skippable: false },
  { id: "account", label: "Select Ad Account", icon: Database, skippable: false },
  { id: "crm", label: "Connect CRM", icon: Link2, skippable: true },
  { id: "done", label: "See Dashboard", icon: LayoutDashboard, skippable: false },
] as const

// ── Main ─────────────────────────────────────────────────

export default function OnboardingPage() {
  const { status: sessionStatus } = useSession()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const isConnected = isAuthenticated
  const { data: accountsData, isLoading: accountsLoading } = useAdAccounts()
  const selectedAdAccountId = useAppStore((s) => s.selectedAdAccountId)
  const setSelectedAdAccountId = useAppStore((s) => s.setSelectedAdAccountId)
  const { data: crmData } = useCrmConnection(selectedAdAccountId)

  const accounts = accountsData?.data || []
  const crmConnections = crmData?.data || []
  const hasCrm = crmConnections.some((c) => c.isActive)

  // Determine current step based on state
  const [manualStep, setManualStep] = useState<number | null>(null)

  const autoStep = !isConnected
    ? 0
    : !selectedAdAccountId
      ? 1
      : 2 // CRM step (user can skip to done)

  const currentStep = manualStep ?? autoStep

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setManualStep(currentStep + 1)
    }
  }

  const goBack = () => {
    if (currentStep > 0) {
      setManualStep(currentStep - 1)
    }
  }

  const skipToDashboard = () => {
    setManualStep(STEPS.length - 1)
  }

  return (
    <div className="mx-auto max-w-xl py-8">
      {/* Welcome header */}
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Welcome to Adsflow
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Let&apos;s get your Meta ads dashboard set up. It takes about 2 minutes.
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((step, i) => {
          const isComplete = i < currentStep || (i === 3 && currentStep === 3)
          const isCurrent = i === currentStep
          return (
            <div key={step.id} className="flex flex-1 items-center gap-2">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  background: isComplete
                    ? "var(--accent-primary)"
                    : isCurrent
                      ? "var(--bg-elevated)"
                      : "var(--bg-muted)",
                  color: isComplete ? "white" : "var(--text-secondary)",
                  border: isCurrent ? "2px solid var(--accent-primary)" : "none",
                }}
              >
                {isComplete ? <CheckCircle size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="h-0.5 flex-1 rounded-full"
                  style={{
                    background: i < currentStep ? "var(--accent-primary)" : "var(--border-subtle)",
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "var(--bg-base)",
          border: "1px solid var(--border-default)",
        }}
      >
        {currentStep === 0 && (
          <StepMeta isConnected={isConnected} loading={sessionStatus === "loading"} onNext={goNext} />
        )}
        {currentStep === 1 && (
          <StepAccount
            accounts={accounts}
            loading={accountsLoading}
            selectedId={selectedAdAccountId}
            onSelect={(id) => { setSelectedAdAccountId(id); goNext(); }}
            onBack={goBack}
          />
        )}
        {currentStep === 2 && (
          <StepCrm
            hasCrm={hasCrm}
            adAccountId={selectedAdAccountId}
            onNext={goNext}
            onSkip={skipToDashboard}
            onBack={goBack}
          />
        )}
        {currentStep === 3 && (
          <StepDone onGo={() => router.push("/")} />
        )}
      </div>
    </div>
  )
}

// ── Step Components ──────────────────────────────────────

function StepMeta({ isConnected, loading, onNext }: { isConnected: boolean; loading: boolean; onNext: () => void }) {
  useEffect(() => {
    if (isConnected) onNext()
  }, [isConnected, onNext])

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <Facebook size={40} style={{ color: "#1877F2" }} />
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        Connect your Meta account
      </h2>
      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Sign in with Facebook to grant Adsflow access to your ad accounts. We need this to sync campaign data and show your CPQL.
      </p>
      {loading ? (
        <Loader2 className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
      ) : isConnected ? (
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "#4ade80" }}>
          <CheckCircle size={16} /> Connected
        </div>
      ) : (
        <button
          onClick={() => signIn("facebook")}
          className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: "#1877F2" }}
        >
          <Facebook size={16} />
          Sign in with Facebook
        </button>
      )}
    </div>
  )
}

function StepAccount({
  accounts,
  loading,
  selectedId,
  onSelect,
  onBack,
}: {
  accounts: AdAccount[]
  loading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onBack: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        Select an ad account
      </h2>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Choose which Meta ad account you want to manage. You can switch later in settings.
      </p>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-lg py-8 text-center" style={{ background: "var(--bg-subtle)" }}>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            No ad accounts found. Make sure your Meta account has at least one ad account.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => onSelect(acc.id)}
              className="flex items-center justify-between rounded-lg px-4 py-3 text-left transition-all"
              style={{
                background: selectedId === acc.id ? "var(--acc-subtle)" : "var(--bg-subtle)",
                border: selectedId === acc.id
                  ? "1px solid var(--accent-primary)"
                  : "1px solid var(--border-subtle)",
              }}
            >
              <div>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {acc.name}
                </span>
                <span className="ml-2 text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                  {acc.account_id}
                </span>
              </div>
              {selectedId === acc.id && <CheckCircle size={16} style={{ color: "var(--accent-primary)" }} />}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onBack}
        className="flex items-center gap-1 self-start text-xs font-medium"
        style={{ color: "var(--text-tertiary)" }}
      >
        <ArrowLeft size={12} /> Back
      </button>
    </div>
  )
}

function StepCrm({
  hasCrm,
  adAccountId,
  onNext,
  onSkip,
  onBack,
}: {
  hasCrm: boolean
  adAccountId: string | null
  onNext: () => void
  onSkip: () => void
  onBack: () => void
}) {
  const connectZoho = async () => {
    if (!adAccountId) return
    const res = await apiFetch(`/api/crm/zoho/auth?adAccountId=${adAccountId}`)
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        Connect your CRM
      </h2>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Connect Zoho CRM to see your real cost per quality lead (CPQL). This is what makes Adsflow different: we show you which campaigns actually produce good leads, not just any leads.
      </p>

      {hasCrm ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "#4ade80" }}>
            <CheckCircle size={16} /> CRM Connected
          </div>
          <button
            onClick={onNext}
            className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white"
            style={{ background: "var(--accent-primary)" }}
          >
            Continue <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            onClick={connectZoho}
            className="flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "var(--accent-primary)" }}
          >
            <Link2 size={16} />
            Connect Zoho CRM
          </button>
          <button
            onClick={onSkip}
            className="flex items-center justify-center gap-1 text-xs font-medium"
            style={{ color: "var(--text-tertiary)" }}
          >
            <SkipForward size={12} /> Skip for now
          </button>
        </div>
      )}

      <button
        onClick={onBack}
        className="flex items-center gap-1 self-start text-xs font-medium"
        style={{ color: "var(--text-tertiary)" }}
      >
        <ArrowLeft size={12} /> Back
      </button>
    </div>
  )
}

function StepDone({ onGo }: { onGo: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "rgba(74, 222, 128, 0.1)" }}
      >
        <CheckCircle size={32} style={{ color: "#4ade80" }} />
      </div>
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        You&apos;re all set!
      </h2>
      <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Your data is syncing in the background. Head to the dashboard to see your campaigns, insights, and CPQL metrics.
      </p>
      <button
        onClick={onGo}
        className="flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{
          background: "var(--accent-primary)",
          boxShadow: "var(--shadow-glow)",
        }}
      >
        <LayoutDashboard size={16} />
        Go to Dashboard
      </button>
    </div>
  )
}
