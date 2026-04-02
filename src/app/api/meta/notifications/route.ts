import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get("unreadOnly") || "false"
  const limit = searchParams.get("limit") || "50"

  const params = new URLSearchParams({ unreadOnly, limit })
  if (auth.email) params.set("userId", auth.email)

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/notifications?${params.toString()}`,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}

export async function PUT(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const params = new URLSearchParams()
  if (auth.email) params.set("userId", auth.email)

  try {
    // Mark all as read
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/notifications/read-all?${params.toString()}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${auth.token}` },
      }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
