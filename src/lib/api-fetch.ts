import { AuthStore } from "@/lib/auth-store"

/**
 * Fetch wrapper that automatically attaches the org JWT token
 * and handles token expiry / 401 responses.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers)

  if (typeof window !== "undefined" && !headers.has("Authorization")) {
    const token = localStorage.getItem("org-token")
    if (token) {
      // Check if token is expired before sending
      if (isTokenExpired(token)) {
        AuthStore.clear()
        redirectToLogin("expired")
        return new Response(null, { status: 401 })
      }
      headers.set("Authorization", `Bearer ${token}`)
    }
  }

  const response = await fetch(input, { ...init, headers })

  // Handle 401 from backend — token was rejected
  if (response.status === 401 && typeof window !== "undefined") {
    const data = await response.clone().json().catch(() => ({}))
    if (data?.error?.code === "INVALID_TOKEN") {
      AuthStore.clear()
      redirectToLogin("expired")
    }
  }

  return response
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return false
    const payload = JSON.parse(atob(parts[1]))
    if (!payload.exp) return false
    // Treat as expired if within 60 seconds of expiry
    return payload.exp * 1000 < Date.now() + 60_000
  } catch {
    return false
  }
}

function redirectToLogin(reason: string) {
  if (typeof window === "undefined") return
  const path = window.location.pathname
  // Don't redirect if already on auth pages
  if (path === "/login" || path === "/accept-invite") return
  window.location.href = `/login?reason=${reason}`
}
