import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Ad id required" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/ads/${encodeURIComponent(id)}`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
      }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}
