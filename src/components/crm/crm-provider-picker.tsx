"use client"

import { useState } from "react"
import { Loader2, Check, ExternalLink } from "lucide-react"
import { CRM_PROVIDERS, type CrmProviderId } from "@/lib/crm-providers"
import { useNangoConnect } from "@/hooks/use-nango-connect"
import type { CrmConnection } from "@/hooks/use-crm"

interface CrmProviderPickerProps {
  adAccountId: string
  connections: CrmConnection[]
  isAdmin: boolean
  onConnected: () => void
  /** When true, skip the "Connected to X" banner and always show the provider grid */
  addMode?: boolean
}

export function CrmProviderPicker({
  adAccountId,
  connections,
  isAdmin,
  onConnected,
  addMode = false,
}: CrmProviderPickerProps) {
  const { connect, isConnecting, error, clearError } = useNangoConnect()
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null)

  const activeConnection = addMode ? undefined : connections.find(c => c.isActive)

  const availableProviders = CRM_PROVIDERS

  const handleConnect = async (providerId: CrmProviderId) => {
    if (!isAdmin || isConnecting) return
    clearError()
    setConnectingProvider(providerId)
    const success = await connect(providerId, adAccountId)
    setConnectingProvider(null)
    if (success) {
      // Give webhook a moment to process, then refetch
      setTimeout(onConnected, 1500)
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {activeConnection ? (
        <div
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs"
          style={{ background: "rgba(74, 222, 128, 0.06)", border: "1px solid rgba(74, 222, 128, 0.15)" }}
        >
          <Check size={14} style={{ color: "#4ade80" }} />
          <span style={{ color: "var(--text-secondary)" }}>
            Connected to{" "}
            <span className="font-medium capitalize" style={{ color: "var(--text-primary)" }}>
              {CRM_PROVIDERS.find(p => p.id === activeConnection.provider)?.name || activeConnection.provider}
            </span>
          </span>
        </div>
      ) : (
        <>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Choose a CRM to connect
          </p>
          <div className="grid grid-cols-2 gap-2">
            {availableProviders.map(provider => {
              const isThisConnecting = connectingProvider === provider.id
              return (
                <button
                  key={provider.id}
                  onClick={() => handleConnect(provider.id)}
                  disabled={!isAdmin || isConnecting}
                  className="group flex flex-col items-start gap-1.5 rounded-lg p-3 text-left transition-all"
                  style={{
                    border: "1px solid var(--border-default)",
                    background: "var(--bg-base)",
                    opacity: !isAdmin || (isConnecting && !isThisConnecting) ? 0.5 : 1,
                    cursor: !isAdmin || isConnecting ? "not-allowed" : "pointer",
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold"
                      style={{
                        background: `${provider.accentColor}18`,
                        color: provider.accentColor,
                      }}
                    >
                      {provider.name[0]}
                    </div>
                    {isThisConnecting && (
                      <Loader2 size={12} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {provider.name}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      {provider.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {error && (
            <div
              className="rounded-md px-3 py-2 text-xs"
              style={{ background: "rgba(248, 113, 113, 0.08)", color: "#f87171" }}
            >
              {error}
            </div>
          )}
        </>
      )}
    </div>
  )
}
