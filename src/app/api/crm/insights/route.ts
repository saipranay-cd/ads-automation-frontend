import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.metaAccessToken) {
    return NextResponse.json({ data: null })
  }

  const { searchParams } = new URL(req.url)
  const params = searchParams.toString()
  const type = searchParams.get("type")

  const endpoint = type === "trends" ? "insights/trends"
    : type === "entity" ? "insights/entity"
    : "insights"

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/crm/${endpoint}?${params}`, {
      headers: { Authorization: `Bearer ${session.metaAccessToken}` },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ data: null })
  }
}
