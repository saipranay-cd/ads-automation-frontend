import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const adAccountId = searchParams.get("adAccountId")
  const days = searchParams.get("days") || "30"
  const since = searchParams.get("since")
  const until = searchParams.get("until")
  const level = searchParams.get("level")
  const parentId = searchParams.get("parentId")

  if (!adAccountId || !type) {
    return NextResponse.json({ error: "adAccountId and type required" }, { status: 400 })
  }

  const endpointMap: Record<string, string> = {
    metrics: "analytics/metrics",
    placements: "analytics/placements",
    "age-gender": "analytics/age-gender",
    cities: "analytics/cities",
    "entity-insights": "analytics/entity-insights",
  }

  const endpoint = endpointMap[type]
  if (!endpoint) {
    return NextResponse.json({ error: "Invalid analytics type" }, { status: 400 })
  }

  try {
    const params = new URLSearchParams({ adAccountId, days })
    if (since && until) {
      params.set("since", since)
      params.set("until", until)
    }
    if (level) params.set("level", level)
    if (parentId) params.set("parentId", parentId)
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/${endpoint}?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}
