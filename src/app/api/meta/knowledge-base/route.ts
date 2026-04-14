import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const adAccountId = searchParams.get("adAccountId")
  if (!adAccountId) {
    return NextResponse.json({ error: "adAccountId required" }, { status: 400 })
  }

  // Forward all query params to backend
  const qs = new URLSearchParams({ adAccountId })
  const platform = searchParams.get("platform")
  const campaignId = searchParams.get("campaignId")
  if (platform) qs.set("platform", platform)
  if (campaignId) qs.set("campaignId", campaignId)

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/ai/knowledge-base?${qs}`,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}

export async function PUT(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/ai/knowledge-base`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Failed to update knowledge base" }, { status: 500 })
  }
}
