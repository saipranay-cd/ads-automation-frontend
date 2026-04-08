import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

export async function GET(req: Request) {
  const auth = await getBackendAuth(req)
  const baseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin

  if (!auth) {
    return NextResponse.redirect(new URL("/login", baseUrl))
  }

  const clientId = process.env.META_APP_ID
  if (!clientId) {
    return NextResponse.redirect(new URL("/settings?meta=not_configured", baseUrl))
  }

  const redirectUri = `${baseUrl}/api/meta/auth/callback`
  const state = Buffer.from(
    JSON.stringify({ email: auth.email || "" })
  ).toString("base64url")

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "ads_management,ads_read,read_insights,pages_read_engagement",
    state,
  })

  const metaAuthUrl = `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`
  return NextResponse.redirect(metaAuthUrl)
}
