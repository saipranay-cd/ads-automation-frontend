import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.metaAccessToken) {
    return NextResponse.json([])
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
    return NextResponse.json([])
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
    return NextResponse.json([])
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
        headers: { Authorization: `Bearer ${session.metaAccessToken}` },
      }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([])
  }
}
