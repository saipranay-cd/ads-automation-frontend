import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.metaAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const adAccountId = searchParams.get("adAccountId")

  if (!adAccountId) {
    return NextResponse.json({ error: "adAccountId required" }, { status: 400 })
  }

  try {
    if (!session.user?.email) {
      return NextResponse.json({ error: "Not authenticated with Meta" }, { status: 401 })
    }

    // userId is resolved on the backend from the access token
    const res = await fetch(
      `${BACKEND_URL}/api/v1/crm/zoho/auth?adAccountId=${adAccountId}&userId=${session.user.email!}`,
      { headers: { Authorization: `Bearer ${session.metaAccessToken}` } }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to get auth URL" }, { status: 500 })
  }
}
