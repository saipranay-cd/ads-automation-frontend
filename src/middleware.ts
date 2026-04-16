import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/** Paths users are allowed to reach even before onboarding is complete. */
const ONBOARDING_EXEMPT = new Set(["/onboarding", "/setup"])

export async function middleware(req: NextRequest) {
  const orgToken = req.cookies.get("org-token")?.value
  const onboarded = req.cookies.get("org-onboarded")?.value === "1"
  const path = req.nextUrl.pathname

  if (!orgToken) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", path)
    return NextResponse.redirect(loginUrl)
  }

  // Check JWT expiry
  try {
    const parts = orgToken.split(".")
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]))
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        const loginUrl = new URL("/login", req.url)
        loginUrl.searchParams.set("reason", "expired")
        const response = NextResponse.redirect(loginUrl)
        response.cookies.delete("org-token")
        response.cookies.delete("org-onboarded")
        return response
      }
    }
  } catch {
    // Malformed token — let the backend reject it
  }

  // Gate: unbonboarded users can only reach /onboarding (and /setup).
  if (!onboarded && !ONBOARDING_EXEMPT.has(path)) {
    return NextResponse.redirect(new URL("/onboarding", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Protect all routes except:
     * - /login, /signup, /onboarding, /setup, /accept-invite  (auth-adjacent pages)
     * - /api/*                  (API routes)
     * - /_next/*                (Next.js internals)
     * - /favicon.ico, /privacy  (static assets & public)
     */
    "/((?!login|signup|onboarding|setup|accept-invite|privacy|api|_next|favicon\\.ico).*)",
  ],
}
