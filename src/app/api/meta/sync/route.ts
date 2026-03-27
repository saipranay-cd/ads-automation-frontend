import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.metaAccessToken) {
    return NextResponse.json(
      { error: "Not connected to Meta. Please sign in first." },
      { status: 401 }
    )
  }

  const body = await req.json()

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.metaAccessToken}`,
      },
      body: JSON.stringify({
        userId: session.user?.email || "default",
        accessToken: session.metaAccessToken,
        adAccountId: body.adAccountId,
      }),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "Backend unavailable" },
      { status: 503 }
    )
  }
}
