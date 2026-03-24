import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.metaAccessToken) {
    return NextResponse.json({ prompt: "" })
  }

  const { searchParams } = new URL(req.url)
  const adAccountId = searchParams.get("adAccountId")
  if (!adAccountId) {
    return NextResponse.json({ prompt: "" })
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/ai/skill-prompt?adAccountId=${adAccountId}`,
      { headers: { Authorization: `Bearer ${session.metaAccessToken}` } }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ prompt: "" })
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.metaAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/ai/skill-prompt`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.metaAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to update skill prompt" }, { status: 500 })
  }
}
