import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const auth = await getBackendAuth(req)
  const baseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin

  if (!auth) {
    return NextResponse.redirect(new URL("/login", baseUrl))
  }

  // Fetch org-specific credentials from backend
  let clientId = process.env.GOOGLE_CLIENT_ID || ""
  try {
    const credsRes = await fetch(`${BACKEND_URL}/api/v1/org/credentials`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    if (credsRes.ok) {
      const credsData = await credsRes.json()
      if (credsData.data?.googleClientId) clientId = credsData.data.googleClientId
    }
  } catch {
    // Fall back to env var
  }

  if (!clientId) {
    return NextResponse.redirect(new URL("/settings?google=not_configured", baseUrl))
  }

  const redirectUri = `${baseUrl}/api/google/auth/callback`

  const state = Buffer.from(
    JSON.stringify({ email: auth.email || "" })
  ).toString("base64url")

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/adwords",
    access_type: "offline",
    prompt: "consent",
    state,
  })

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  return NextResponse.redirect(googleAuthUrl)
}
