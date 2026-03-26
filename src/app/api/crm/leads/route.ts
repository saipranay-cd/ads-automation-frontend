import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.metaAccessToken) {
    return NextResponse.json({ data: [], total: 0 })
  }

  const { searchParams } = new URL(req.url)
  const params = searchParams.toString()

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/crm/leads?${params}`, {
      headers: { Authorization: `Bearer ${session.metaAccessToken}` },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ data: [], total: 0 })
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.metaAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { leadId, campaignId, adSetId, adId } = body

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/crm/leads/${leadId}/match`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.metaAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ campaignId, adSetId, adId }),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Match failed" }, { status: 500 })
  }
}
