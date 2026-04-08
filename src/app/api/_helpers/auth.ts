import { cookies } from "next/headers"

/**
 * Gets the auth token for backend API calls.
 * Checks (in priority order):
 * 1. JWT from Authorization header (apiFetch sends org-token from localStorage)
 * 2. JWT from org-token cookie (middleware checks this)
 *
 * Returns { token, email } or null if not authenticated.
 */
export async function getBackendAuth(
  req: Request
): Promise<{ token: string; email?: string } | null> {
  // 1. JWT from Authorization header
  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "")
    if (token.includes(".")) {
      return { token, email: decodeJwtEmail(token) }
    }
  }

  // 2. Fall back to org-token cookie
  const cookieStore = await cookies()
  const orgTokenCookie = cookieStore.get("org-token")?.value
  if (orgTokenCookie?.includes(".")) {
    return { token: orgTokenCookie, email: decodeJwtEmail(orgTokenCookie) }
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
