import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ orgId: string; userId: string }> }
) {
  const { orgId, userId } = await params
  const auth = await getBackendAuth(_req)
  const authHeaders: Record<string, string> = auth ? { Authorization: `Bearer ${auth.token}` } : {}
  const res = await fetch(
    `${BACKEND_URL}/api/v1/org/${orgId}/members/${userId}`,
    {
      method: "DELETE",
      headers: { ...authHeaders },
    }
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
