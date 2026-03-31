import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth || !auth.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const adAccountId = searchParams.get("adAccountId") || ""

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/alert-rules?userId=${auth.email!}&adAccountId=${adAccountId}`,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    )
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}

export async function POST(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth || !auth.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await req.json()

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/alert-rules?userId=${auth.email!}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(body),
      }
    )
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
