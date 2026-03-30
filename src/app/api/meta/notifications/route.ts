import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.metaAccessToken || !session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated with Meta" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get("unreadOnly") || "false"
  const limit = searchParams.get("limit") || "50"

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/notifications?userId=${session.user.email!}&unreadOnly=${unreadOnly}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${session.metaAccessToken}` } }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.metaAccessToken || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Mark all as read
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/notifications/read-all?userId=${session.user.email}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${session.metaAccessToken}` },
      }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
