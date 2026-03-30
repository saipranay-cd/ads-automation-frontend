import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

function authHeaders(token?: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.metaAccessToken) {
    return NextResponse.json({ error: "Not authenticated with Meta" }, { status: 401 })
  }

  const email = session.user?.email
  const token = session.metaAccessToken

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

  if (!email) {
    return NextResponse.json({ error: "Not authenticated with Meta" }, { status: 401 })
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/drafts/user/${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.metaAccessToken || !session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated with Meta" }, { status: 401 })
  }
  const email = session.user.email!

  try {
    const body = await req.json()
    const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/drafts`, {
      method: "POST",
      headers: authHeaders(session?.metaAccessToken),
      body: JSON.stringify({ ...body, userId: email }),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Failed to create draft" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.metaAccessToken) {
    return NextResponse.json({ error: "Not authenticated with Meta" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) {
      return NextResponse.json({ error: "Draft ID required" }, { status: 400 })
    }
    const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/drafts/${id}`, {
      method: "PUT",
      headers: authHeaders(session?.metaAccessToken),
      body: JSON.stringify(data),
    })
    const result = await res.json()
    return NextResponse.json(result, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Failed to update draft" }, { status: 500 })
  }
}
