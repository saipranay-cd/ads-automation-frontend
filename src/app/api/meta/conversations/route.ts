import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const params = new URLSearchParams()
  if (searchParams.get("platform")) params.set("platform", searchParams.get("platform")!)
  if (searchParams.get("adAccountId")) params.set("adAccountId", searchParams.get("adAccountId")!)

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/ai/conversations?${params}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}
