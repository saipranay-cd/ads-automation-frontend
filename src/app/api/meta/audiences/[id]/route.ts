import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.metaAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/adsflow/audiences/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.metaAccessToken}` },
      }
    )
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: data.error || "Delete failed" },
        { status: res.status }
      )
    }
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json(
      { error: "Failed to delete audience" },
      { status: 500 }
    )
  }
}
