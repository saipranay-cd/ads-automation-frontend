import { NextResponse } from "next/server";
import { getBackendAuth } from "@/app/api/_helpers/auth";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088";

export async function GET(req: Request) {
  const auth = await getBackendAuth(req);
  const baseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;

  if (!auth) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  // Fetch org-specific credentials from backend
  let metaAppId = process.env.META_APP_ID || "";
  try {
    const credsRes = await fetch(`${BACKEND_URL}/api/v1/org/credentials`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (credsRes.ok) {
      const credsData = await credsRes.json();
      if (credsData.data?.metaAppId) metaAppId = credsData.data.metaAppId;
    }
  } catch {
    // Fall back to env var
  }

  if (!metaAppId) {
    return NextResponse.redirect(
      new URL("/settings?meta=not_configured", baseUrl),
    );
  }

  const redirectUri = `${baseUrl}/api/meta/auth/callback`;
  const state = Buffer.from(
    JSON.stringify({ email: auth.email || "" }),
  ).toString("base64url");

  const params = new URLSearchParams({
    client_id: metaAppId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "ads_management,ads_read,pages_read_engagement",
    state,
  });

  const metaAuthUrl = `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
  return NextResponse.redirect(metaAuthUrl);
}
