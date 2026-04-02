import { NextRequest, NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(request: NextRequest) {
  const auth = await getBackendAuth(request)

  if (!auth) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL!))
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(new URL("/settings?google=error", process.env.NEXTAUTH_URL!))
  }

  // Get user identifier: email preferred, fallback to "default"
  const userEmail = auth.email || "default"

  try {
    // Exchange code for tokens
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/google/auth/callback`

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL("/settings?google=error", process.env.NEXTAUTH_URL!))
    }

    const tokenData = await tokenRes.json()
    const { access_token: accessToken, refresh_token: refreshToken, expires_in } = tokenData

    if (!accessToken || !refreshToken) {
      return NextResponse.redirect(new URL("/settings?google=error", process.env.NEXTAUTH_URL!))
    }

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + (expires_in || 3600) * 1000).toISOString()

    // Forward tokens to backend
    const backendRes = await fetch(`${BACKEND_URL}/api/v1/google/auth/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ accessToken, refreshToken, userEmail, tokenExpiry }),
    })

    if (!backendRes.ok) {
      return NextResponse.redirect(new URL("/settings?google=error", process.env.NEXTAUTH_URL!))
    }

    const backendData = await backendRes.json().catch(() => ({}))

    // Check if the connected Google Ads account conflicts with another org
    const googleAdAccountId = backendData?.data?.googleAdAccountId
    if (googleAdAccountId) {
      try {
        const conflictRes = await fetch(
          `${BACKEND_URL}/api/v1/org/check-account?googleAdAccountId=${encodeURIComponent(googleAdAccountId)}`
        )
        const conflictData = await conflictRes.json()
        if (conflictData?.conflict) {
          const orgName = encodeURIComponent(conflictData.orgName || "another workspace")
          return NextResponse.redirect(
            new URL(`/settings?google=conflict&orgName=${orgName}`, process.env.NEXTAUTH_URL!)
          )
        }
      } catch {
        // Non-fatal: skip conflict check if it fails
      }
    }

    return NextResponse.redirect(new URL("/settings?google=connected", process.env.NEXTAUTH_URL!))
  } catch {
    return NextResponse.redirect(new URL("/settings?google=error", process.env.NEXTAUTH_URL!))
  }
}
