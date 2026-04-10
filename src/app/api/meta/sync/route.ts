import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function POST(req: Request) {
  const auth = await getBackendAuth(req)

  if (!auth) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    )
  }

  const body = await req.json()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 55000)

    const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({
        ...(auth.email && { userId: auth.email }),
        adAccountId: body.adAccountId || undefined,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json({ success: true, message: "Sync started. Data will update shortly." })
    }
    return NextResponse.json(
      { error: "Backend unavailable" },
      { status: 503 }
    )
  }
}
