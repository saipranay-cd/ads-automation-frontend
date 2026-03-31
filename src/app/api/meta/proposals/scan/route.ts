import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export const maxDuration = 120 // Allow up to 120s for Vercel serverless function

export async function POST(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const adAccountId = searchParams.get("adAccountId")
  const scanType = searchParams.get("scanType") || "quick"

  if (!adAccountId) {
    return NextResponse.json({ error: "adAccountId required" }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 110_000) // 110s fetch timeout

    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/ai/scan?adAccountId=${adAccountId}&scanType=${scanType}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        signal: controller.signal,
      }
    )
    clearTimeout(timeout)

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Scan failed"
    const isTimeout = msg.includes("abort")
    return NextResponse.json(
      { error: isTimeout ? "Scan is taking longer than expected. Results will appear shortly." : "Scan failed" },
      { status: isTimeout ? 202 : 500 }
    )
  }
}
