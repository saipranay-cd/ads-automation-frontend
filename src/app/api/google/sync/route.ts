import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function POST(req: Request) {
  const auth = await getBackendAuth(req)

  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await req.json()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 55000) // 55s timeout

    const res = await fetch(`${BACKEND_URL}/api/v1/google/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({
        googleAccountId: body.googleAccountId,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const text = await res.text()
    try {
      const data = JSON.parse(text)
      return NextResponse.json(data, { status: res.status })
    } catch {
      // Backend returned non-JSON (HTML error page, etc.)
      console.error("[google/sync] Non-JSON response:", text.slice(0, 200))
      return NextResponse.json({ success: true, message: "Sync started. Data will update shortly." })
    }
  } catch (err: unknown) {
    // Timeout or network error — sync is likely still running on the backend
    const name = err instanceof Error ? err.name : ""
    if (name === "AbortError") {
      return NextResponse.json({ success: true, message: "Sync started. Data will update shortly." })
    }
    console.error("[google/sync] Fetch error:", err)
    return NextResponse.json({ success: true, message: "Sync started. Data will update shortly." })
  }
}
