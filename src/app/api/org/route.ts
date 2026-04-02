import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function POST(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const res = await fetch(`${BACKEND_URL}/api/v1/org`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function GET(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const res = await fetch(`${BACKEND_URL}/api/v1/org`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  })
  const data = await res.json()

  // If the backend issued a JWT for a Meta-authenticated user, set it as a cookie
  // so subsequent requests don't depend solely on the NextAuth session
  const orgToken = res.headers.get("x-org-token")
  const response = NextResponse.json(data, { status: res.status })
  if (orgToken) {
    response.cookies.set("org-token", orgToken, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days (matches JWT expiry)
      httpOnly: false, // client JS needs to read it for apiFetch
      secure: true,
      sameSite: "lax",
    })
  }
  return response
}
