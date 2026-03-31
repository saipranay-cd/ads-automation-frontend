import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getBackendAuth(req)
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/alert-rules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify(body),
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getBackendAuth(req)
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/alert-rules/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
