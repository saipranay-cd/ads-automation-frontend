import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const params = searchParams.toString()
  const type = searchParams.get("type")

  const endpoint = type === "trends" ? "insights/trends"
    : type === "entity" ? "insights/entity"
    : "insights"

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/crm/${endpoint}?${params}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}
