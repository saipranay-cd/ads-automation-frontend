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
  const status = searchParams.get("status")
  const type = searchParams.get("type")

  if (!adAccountId) {
    return NextResponse.json({ error: "adAccountId required" }, { status: 400 })
  }

  // Impact stats endpoint
  if (type === "impact-stats") {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/v1/adsflow/ai/proposals/impact-stats?adAccountId=${adAccountId}`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      )
      const data = await res.json()
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }
  }

  try {
    const params = new URLSearchParams({ adAccountId })
    if (status) params.set("status", status)

    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/ai/proposals?${params}`,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}

export async function POST(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const adAccountId = searchParams.get("adAccountId")

  if (!adAccountId) {
    return NextResponse.json({ error: "adAccountId required" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/ai/proposals/measure?adAccountId=${adAccountId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
      }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Measurement failed" }, { status: 500 })
  }
}
