import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.metaAccessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const adAccountId = searchParams.get("adAccountId")
  const scanType = searchParams.get("scanType") || "quick"

  if (!adAccountId) {
    return NextResponse.json({ error: "adAccountId required" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/ai/scan?adAccountId=${adAccountId}&scanType=${scanType}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session.metaAccessToken}` },
      }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Scan failed" }, { status: 500 })
  }
}
