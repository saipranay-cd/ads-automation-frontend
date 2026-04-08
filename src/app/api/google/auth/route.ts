import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

export async function GET(req: Request) {
  const auth = await getBackendAuth(req)
  const baseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin

  // Must be logged in to connect Google
  if (!auth) {
    return NextResponse.redirect(new URL("/login", baseUrl))
  }

  const userEmail = auth.email || ""

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/settings?google=not_configured", baseUrl)
    )
  }

  const redirectUri = `${baseUrl}/api/google/auth/callback`

  const state = Buffer.from(
    JSON.stringify({ email: userEmail })
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
