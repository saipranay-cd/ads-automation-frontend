import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const orgToken = req.cookies.get("org-token")?.value

  if (!orgToken) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
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
        return response
      }
    }
  } catch {
    // Malformed token — let the backend reject it
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Protect all routes except:
     * - /login, /accept-invite  (auth pages)
     * - /api/*                  (API routes)
     * - /_next/*                (Next.js internals)
     * - /favicon.ico            (static asset)
     */
    "/((?!login|signup|setup|accept-invite|privacy|api|_next|favicon\\.ico).*)",
  ],
}
