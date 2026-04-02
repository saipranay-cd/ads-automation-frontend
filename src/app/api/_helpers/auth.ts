import { getServerSession } from "next-auth"
import { cookies } from "next/headers"
import { authOptions } from "@/lib/auth"

/**
 * Gets the auth token for backend API calls.
 * Supports (in priority order):
 * 1. NextAuth Meta session (preferred — backend uses this token directly for Meta API calls)
 * 2. JWT from Authorization header (email/password users via apiFetch)
 * 3. JWT from org-token cookie (set by backend for Meta users as a fallback)
 *
 * IMPORTANT: Meta session is checked FIRST because the backend controllers
 * use the token directly as a Meta access token for calling Facebook's API.
 * If we send a JWT when a Meta session exists, Meta API calls will fail.
 *
 * Returns { token, source, email } or null if not authenticated.
 */
export async function getBackendAuth(
  req: Request
): Promise<{ token: string; source: "jwt" | "meta"; email?: string } | null> {
  // 1. Check NextAuth Meta session FIRST — backend needs actual Meta token for FB API
  const session = await getServerSession(authOptions)
  if (session?.metaAccessToken) {
    return { token: session.metaAccessToken, source: "meta", email: session.user?.email ?? undefined }
  }

  // 2. Fall back to JWT from Authorization header (apiFetch sends org-token from localStorage)
  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "")
    // JWT tokens contain dots (header.payload.signature)
    if (token.includes(".")) {
      const email = decodeJwtEmail(token)
      return { token, source: "jwt", email }
    }
  }

  // 3. Fall back to org-token cookie (set by /api/org for Meta-authenticated users)
  const cookieStore = await cookies()
  const orgTokenCookie = cookieStore.get("org-token")?.value
  if (orgTokenCookie?.includes(".")) {
    const email = decodeJwtEmail(orgTokenCookie)
    return { token: orgTokenCookie, source: "jwt", email }
  }

  return null
}

/**
 * Decode JWT payload to extract email without verification.
 * The backend will verify the token — we just need the email for routing.
 */
function decodeJwtEmail(token: string): string | undefined {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return undefined
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString())
    return payload.email || undefined
  } catch {
    return undefined
  }
}
