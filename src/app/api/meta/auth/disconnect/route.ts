import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function POST(req: Request) {
  const auth = await getBackendAuth(req)

  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/auth/meta`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.token}` },
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: data.error || "Failed to disconnect Meta Ads" },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to disconnect Meta Ads" }, { status: 500 })
  }
}
