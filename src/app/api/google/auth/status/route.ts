import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const auth = await getBackendAuth(req)

  if (!auth) {
    return NextResponse.json({ connected: false })
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/google/auth/status`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ connected: false })
  }
}
