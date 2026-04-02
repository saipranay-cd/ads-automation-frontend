import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  // Check for NextAuth session (uses NEXTAUTH_SECRET env var automatically)
  const token = await getToken({ req })

  // Check for org-token cookie (frontend sets this so middleware can see it)
  const orgToken = req.cookies.get("org-token")?.value

  if (!token && !orgToken) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Protect all routes except:
     * - /login, /org-login, /accept-invite  (auth pages)
     * - /api/*                               (API routes)
     * - /_next/*                             (Next.js internals)
     * - /favicon.ico                         (static asset)
     */
    "/((?!login|org-login|accept-invite|api|_next|favicon\\.ico).*)",
  ],
}
