import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.metaAccessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.metaAccessToken}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: data.error || "Chat request failed" },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[chat-proxy] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
