import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }
    const res = await fetch(`${BACKEND_URL}/api/v1/org/check-invite?token=${encodeURIComponent(token)}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 })
  }
}
