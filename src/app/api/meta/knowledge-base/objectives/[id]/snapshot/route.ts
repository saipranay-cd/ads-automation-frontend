import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { id } = await params
  try {
    const body = await req.json()
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/ai/knowledge-base/objectives/${id}/snapshot`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Failed to add snapshot" }, { status: 500 })
  }
}
