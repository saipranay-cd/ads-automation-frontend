import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")

  // GET field map
  if (action === "get-field-map") {
    const connectionId = searchParams.get("connectionId")
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 })
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/v1/crm/connections/${connectionId}/field-map`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      )
      const data = await res.json()
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }
  }

  // GET Zoho fields list
  if (action === "get-zoho-fields") {
    const connectionId = searchParams.get("connectionId")
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 })
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/v1/crm/connections/${connectionId}/zoho-fields`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      )
      const data = await res.json()
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }
  }

  // GET source map for a specific connection
  if (action === "get-source-map") {
    const connectionId = searchParams.get("connectionId")
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 })
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/v1/crm/connections/${connectionId}/source-map`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      )
      const data = await res.json()
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }
  }

  // GET quality map for a specific connection
  if (action === "get-quality-map") {
    const connectionId = searchParams.get("connectionId")
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 })
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/v1/crm/connections/${connectionId}/quality-map`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      )
      const data = await res.json()
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }
  }

  // Default: list connections for ad account
  const adAccountId = searchParams.get("adAccountId")

  if (!adAccountId) {
    return NextResponse.json({ error: "adAccountId required" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/crm/connections?adAccountId=${adAccountId}`,
      { headers: { Authorization: `Bearer ${auth.token}` } }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
}

export async function DELETE(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const connectionId = searchParams.get("id")

  if (!connectionId) {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/crm/connections/${connectionId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await req.json()
  const { connectionId, action } = body

  if (action === "sync" && connectionId) {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/v1/crm/connections/${connectionId}/sync`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
        }
      )
      const data = await res.json()
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: "Sync failed" }, { status: 500 })
    }
  }

  if (action === "discover-stages" && connectionId) {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/v1/crm/connections/${connectionId}/quality-map/discover`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      )
      const data = await res.json()
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: "Discovery failed" }, { status: 500 })
    }
  }

  if (action === "update-quality-map" && connectionId) {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/v1/crm/connections/${connectionId}/quality-map`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mappings: body.mappings }),
        }
      )
      const data = await res.json()
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }
  }

  if (action === "update-field-map" && connectionId) {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/v1/crm/connections/${connectionId}/field-map`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mappings: body.mappings }),
        }
      )
      const data = await res.json()
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: "Field map update failed" }, { status: 500 })
    }
  }

  if (action === "discover-sources" && connectionId) {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/v1/crm/connections/${connectionId}/source-map/discover`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      )
      const data = await res.json()
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: "Source discovery failed" }, { status: 500 })
    }
  }

  if (action === "update-source-map" && connectionId) {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/v1/crm/connections/${connectionId}/source-map`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mappings: body.mappings }),
        }
      )
      const data = await res.json()
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: "Source update failed" }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
