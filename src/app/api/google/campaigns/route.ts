import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const auth = await getBackendAuth(req)

  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get("accountId")

  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 })
  }

  try {
    const params = new URLSearchParams({ accountId })
    const days = searchParams.get("days")
    const since = searchParams.get("since")
    const until = searchParams.get("until")
    if (days) params.set("days", days)
    if (since) params.set("since", since)
    if (until) params.set("until", until)
    const res = await fetch(
      `${BACKEND_URL}/api/v1/google/campaigns?${params.toString()}`,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}
