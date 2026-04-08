import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const res = await fetch(`${BACKEND_URL}/api/v1/org`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { error: "Backend unavailable. Please try again." },
      { status: 502 },
    )
  }
}
