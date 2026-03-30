import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.metaAccessToken) return NextResponse.json({ error: "Not authenticated with Meta" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const params = searchParams.toString()

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/creatives?${params}`, {
      headers: { Authorization: `Bearer ${session.metaAccessToken}` },
    })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}
