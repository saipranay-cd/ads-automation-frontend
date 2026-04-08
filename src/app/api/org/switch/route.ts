import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function POST(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()

    const res = await fetch(`${BACKEND_URL}/api/v1/org/switch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    const response = NextResponse.json(data, { status: res.status })

    // Set the new token as a cookie so middleware sees it immediately
    if (data?.data?.token) {
      response.cookies.set("org-token", data.data.token, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
    }

    return response
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 })
  }
}
