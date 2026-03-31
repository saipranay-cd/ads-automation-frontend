import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getBackendAuth(req)
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/alert-rules/${id}/executions`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}
