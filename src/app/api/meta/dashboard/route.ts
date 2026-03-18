import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.metaAccessToken) {
    return NextResponse.json(null)
  }

  const userId = session.user?.email || "default"

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/adsflow/dashboard/${userId}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(null)
  }
}
