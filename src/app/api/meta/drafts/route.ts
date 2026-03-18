import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email

  // If a specific draft ID is requested, proxy to GET /api/drafts/:id
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (id) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/drafts/${id}`)
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    } catch {
      return NextResponse.json({ error: "Failed to fetch draft" }, { status: 500 })
    }
  }

  if (!email) {
    return NextResponse.json({ data: [] })
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/drafts/user/${encodeURIComponent(email)}`
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ data: [] })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email || "default"

  try {
    const body = await req.json()
    // Inject userId server-side from session
    const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/drafts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, userId: email }),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Failed to create draft" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) {
      return NextResponse.json({ error: "Draft ID required" }, { status: 400 })
    }
    const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/drafts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const result = await res.json()
    return NextResponse.json(result, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Failed to update draft" }, { status: 500 })
  }
}
