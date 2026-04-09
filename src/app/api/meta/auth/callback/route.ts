import { NextRequest, NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(request: NextRequest) {
  const auth = await getBackendAuth(request)
  const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin

  if (!auth) {
    return NextResponse.redirect(new URL("/login", baseUrl))
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(new URL("/settings?meta=error", baseUrl))
  }

  // Fetch org-specific credentials from backend
  let metaAppId = process.env.META_APP_ID || ""
  let metaAppSecret = process.env.META_APP_SECRET || ""
  try {
    const credsRes = await fetch(`${BACKEND_URL}/api/v1/org/credentials`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    if (credsRes.ok) {
      const credsData = await credsRes.json()
      if (credsData.data?.metaAppId) metaAppId = credsData.data.metaAppId
      if (credsData.data?.metaAppSecret) metaAppSecret = credsData.data.metaAppSecret
    }
  } catch {
    // Fall back to env vars
  }

  if (!metaAppId || !metaAppSecret) {
    return NextResponse.redirect(new URL("/settings?meta=not_configured", baseUrl))
  }

  try {
    const redirectUri = `${baseUrl}/api/meta/auth/callback`

    // Exchange code for short-lived token
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token")
    tokenUrl.searchParams.set("client_id", metaAppId)
    tokenUrl.searchParams.set("client_secret", metaAppSecret)
    tokenUrl.searchParams.set("redirect_uri", redirectUri)
    tokenUrl.searchParams.set("code", code)

    const tokenRes = await fetch(tokenUrl.toString())
    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL("/settings?meta=error", baseUrl))
    }

    const tokenData = await tokenRes.json()
    const shortLivedToken = tokenData.access_token
    if (!shortLivedToken) {
      return NextResponse.redirect(new URL("/settings?meta=error", baseUrl))
    }

    // Exchange for long-lived token (60 days)
    const exchangeUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token")
    exchangeUrl.searchParams.set("grant_type", "fb_exchange_token")
    exchangeUrl.searchParams.set("client_id", metaAppId)
    exchangeUrl.searchParams.set("client_secret", metaAppSecret)
    exchangeUrl.searchParams.set("fb_exchange_token", shortLivedToken)

    const exchangeRes = await fetch(exchangeUrl.toString())
    let accessToken = shortLivedToken
    let expiresIn = 3600

    if (exchangeRes.ok) {
      const exchangeData = await exchangeRes.json()
      accessToken = exchangeData.access_token || shortLivedToken
      expiresIn = exchangeData.expires_in || 5184000
    }

    const userEmail = auth.email || ""

    // Forward to backend to store token and link ad accounts
    const backendRes = await fetch(`${BACKEND_URL}/api/v1/adsflow/auth/meta-connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ accessToken, userEmail, expiresIn }),
    })

    if (!backendRes.ok) {
      return NextResponse.redirect(new URL("/settings?meta=error", baseUrl))
    }

    return NextResponse.redirect(new URL("/settings?meta=connected", baseUrl))
  } catch {
    return NextResponse.redirect(new URL("/settings?meta=error", baseUrl))
  }
}
