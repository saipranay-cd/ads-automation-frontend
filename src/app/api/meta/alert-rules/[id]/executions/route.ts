import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.metaAccessToken) return NextResponse.json({ data: [] })

  const { id } = await params

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/alert-rules/${id}/executions`, {
      headers: { Authorization: `Bearer ${session.metaAccessToken}` },
    })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ data: [] })
  }
}
