import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

/** GET — fetch decrypted credentials for OAuth flows (server-to-server) */
export async function GET(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/org/credentials`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 })
  }
}
