import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.metaAccessToken) {
    console.log("[audiences-proxy] No metaAccessToken in session")
    return NextResponse.json({ data: [] })
  }

  const { searchParams } = new URL(req.url)
  const adAccountId = searchParams.get("adAccountId")

  if (!adAccountId) {
    console.log("[audiences-proxy] No adAccountId param")
    return NextResponse.json({ data: [] })
  }

  try {
    const url = `${BACKEND_URL}/api/v1/adsflow/audiences?adAccountId=${adAccountId}`
    console.log("[audiences-proxy] Fetching:", url)
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${session.metaAccessToken}` },
    })
    const data = await res.json()
    console.log("[audiences-proxy] Response status:", res.status, "data count:", data?.data?.length ?? "no data key")
    return NextResponse.json(data)
  } catch (err) {
    console.error("[audiences-proxy] Error:", err)
    return NextResponse.json({ data: [] })
  }
}
