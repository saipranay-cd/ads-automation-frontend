import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

function authHeaders(token?: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

export async function GET(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const email = auth.email
  const token = auth.token

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/drafts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }
  }

  try {
    const url = email
      ? `${BACKEND_URL}/api/v1/adsflow/drafts/user/${encodeURIComponent(email)}`
      : `${BACKEND_URL}/api/v1/adsflow/drafts`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}

export async function POST(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/drafts`, {
      method: "POST",
      headers: authHeaders(auth.token),
      body: JSON.stringify({
        ...body,
        ...(auth.email && { userId: auth.email }),
      }),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Failed to create draft" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) {
      return NextResponse.json({ error: "Draft ID required" }, { status: 400 })
    }
    const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/drafts/${id}`, {
      method: "PUT",
      headers: authHeaders(auth.token),
      body: JSON.stringify(data),
    })
    const result = await res.json()
    return NextResponse.json(result, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Failed to update draft" }, { status: 500 })
  }
}
