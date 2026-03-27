import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.metaAccessToken || !session?.user?.email) {
    return NextResponse.json({ data: [] })
  }

  const { searchParams } = new URL(req.url)
  const adAccountId = searchParams.get("adAccountId") || ""

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/alert-rules?userId=${session.user.email}&adAccountId=${adAccountId}`,
      { headers: { Authorization: `Bearer ${session.metaAccessToken}` } }
    )
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ data: [] })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.metaAccessToken || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/alert-rules?userId=${session.user.email}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.metaAccessToken}`,
        },
        body: JSON.stringify(body),
      }
    )
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
