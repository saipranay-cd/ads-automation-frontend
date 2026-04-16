/**
 * Centralized auth token store.
 *
 * Single source of truth for the org JWT token. Writes to BOTH
 * localStorage and cookie atomically so middleware (cookie) and
 * apiFetch (localStorage) always stay in sync.
 */

type Listener = () => void

const TOKEN_KEY = "org-token"
const USER_KEY = "org-user"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days (matches JWT expiry)

let listeners: Listener[] = []

function notify() {
  for (const l of listeners) l()
}

function isSecure(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "https:"
}

function setCookie(name: string, value: string, maxAge: number) {
  const parts = [`${name}=${value}`, "path=/", `max-age=${maxAge}`, "samesite=lax"]
  if (isSecure()) parts.push("secure")
  document.cookie = parts.join("; ")
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`
}

export const AuthStore = {
  getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(TOKEN_KEY)
  },

  getUser(): { name: string; email: string } | null {
    if (typeof window === "undefined") return null
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  setToken(token: string, user?: { name: string; email: string }) {
    if (typeof window === "undefined") return
    localStorage.setItem(TOKEN_KEY, token)
    setCookie(TOKEN_KEY, token, COOKIE_MAX_AGE)
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
    notify()
  },

  clear() {
    if (typeof window === "undefined") return
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    deleteCookie(TOKEN_KEY)
    deleteCookie("org-onboarded")
    notify()
  },

  subscribe(listener: Listener): () => void {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  },

  getSnapshot(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(TOKEN_KEY)
  },

  getServerSnapshot(): string | null {
    return null
  },
}

/**
 * Prime the onboarding-gate cookie from the server state.
 * Call after successful login / accept-invite so users logging in from a
 * new browser don't get stuck in the onboarding redirect loop.
 */
export async function primeOnboardingCookie(token: string): Promise<void> {
  if (typeof window === "undefined") return
  try {
    const res = await fetch("/api/org", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const json = await res.json().catch(() => ({}))
    const orgs = Array.isArray(json.data) ? json.data : []
    const onboarded = !!orgs[0]?.onboardedAt
    if (onboarded) {
      setCookie("org-onboarded", "1", COOKIE_MAX_AGE)
    } else {
      deleteCookie("org-onboarded")
    }
  } catch {
    // Silent failure — middleware will redirect to /onboarding which is safe
  }
}
