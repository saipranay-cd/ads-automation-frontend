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
    return NextResponse.json({ pending: 0, approved: 0, executed: 0, rejected: 0, failed: 0, applied: 0, estimatedSavings: 0, lastScan: null, lastScanDuration: null })
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/google/proposals/stats?adAccountId=${adAccountId}`,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}
