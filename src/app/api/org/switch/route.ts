import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function POST(req: Request) {
  const auth = await getBackendAuth(req)
  const headers: Record<string, string> = { "Content-Type": "application/json" }

  if (auth) {
    headers.Authorization = `Bearer ${auth.token}`
  }

  const body = await req.json()

  const res = await fetch(`${BACKEND_URL}/api/v1/org/switch`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
