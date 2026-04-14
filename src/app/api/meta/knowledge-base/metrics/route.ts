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
  const campaignId = searchParams.get("campaignId")
  if (!adAccountId || !campaignId) {
    return NextResponse.json({ error: "adAccountId and campaignId required" }, { status: 400 })
  }

  try {
    const qs = new URLSearchParams({ adAccountId, campaignId }).toString()
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/ai/knowledge-base/metrics?${qs}`,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}
