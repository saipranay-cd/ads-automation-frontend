"use client"

import { useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api-fetch"
import { CRM_PROVIDERS, type CrmProviderId } from "@/lib/crm-providers"

/**
 * Hook for connecting a CRM via Nango.
 * Uses the Nango frontend SDK headlessly (no pre-built UI).
 * NANGO_CLOUD_ONLY: Connect Sessions require Nango Cloud.
 */
export function useNangoConnect() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const connect = useCallback(
    async (provider: CrmProviderId, adAccountId: string) => {
      setIsConnecting(true)
      setError(null)

      try {
        // 1. Get a Connect Session token from our backend
        const sessionRes = await apiFetch("/api/crm/nango-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adAccountId, provider }),
        })

        if (!sessionRes.ok) {
          const errData = await sessionRes.json().catch(() => ({}))
          throw new Error(errData.error || "Failed to create Nango session")
        }

        const { sessionToken } = await sessionRes.json()

        // 2. Dynamic import — Nango SDK is client-only
        const { default: Nango } = await import("@nangohq/frontend")
        const nango = new Nango({ connectSessionToken: sessionToken })

        // 3. Trigger headless auth (opens OAuth popup)
        const providerConfig = CRM_PROVIDERS.find(p => p.id === provider)
        const integrationId = providerConfig?.nangoIntegrationId ?? provider
        const result = await nango.auth(integrationId, {
          detectClosedAuthWindow: true,
        })

        // 4. Register the connection in our database directly
        // (Webhooks may not reach localhost in dev — this is the primary path)
        const registerRes = await apiFetch("/api/crm/nango-register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adAccountId,
            provider,
            connectionId: result.connectionId,
            providerConfigKey: result.providerConfigKey,
          }),
        })
        if (!registerRes.ok) {
          const errData = await registerRes.json().catch(() => ({}))
          throw new Error(errData.error || "CRM authorized but failed to save connection. Try again.")
        }

        // 5. Invalidate queries to pick up the new connection
        queryClient.invalidateQueries({ queryKey: ["crm-connection"] })

        return true
      } catch (err: any) {
        const message = err?.type === "blocked_by_browser"
          ? "Popup was blocked by your browser. Please allow popups for this site."
          : err?.type === "window_closed"
          ? "Authorization window was closed before completing."
          : err?.message || "Failed to connect CRM"
        setError(message)
        return false
      } finally {
        setIsConnecting(false)
      }
    },
    [queryClient],
  )

  return { connect, isConnecting, error, clearError: () => setError(null) }
}
