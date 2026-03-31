import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params
  const auth = await getBackendAuth(req)
  const authHeaders: Record<string, string> = auth ? { Authorization: `Bearer ${auth.token}` } : {}
  const res = await fetch(`${BACKEND_URL}/api/v1/org/${orgId}/sync-status`, {
    headers: { ...authHeaders },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
