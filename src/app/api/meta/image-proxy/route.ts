import { NextResponse } from "next/server"
import { getBackendAuth } from "@/app/api/_helpers/auth"

/**
 * Image proxy for Meta ad thumbnails.
 * Meta's thumbnail_url contains expiring signatures that break when
 * loaded directly from the browser (referrer mismatch / expiry).
 * This route fetches server-side and streams the bytes back.
 */
export async function GET(req: Request) {
  const auth = await getBackendAuth(req)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const url = searchParams.get("url")

  if (!url) {
    return new NextResponse("Missing url param", { status: 400 })
  }

  // Only allow Meta/Facebook CDN domains
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new NextResponse("Invalid URL", { status: 400 })
  }

  const allowedDomains = [
    "fbcdn.net",
    "facebook.com",
    "fb.com",
    "fbsbx.com",
    "fbpicdn.net",
  ]
  const isAllowed = allowedDomains.some(
    (domain) =>
      parsed.hostname === domain || parsed.hostname.endsWith("." + domain)
  )
  if (!isAllowed) {
    return new NextResponse("Domain not allowed", { status: 403 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    })

    if (!res.ok) {
      return new NextResponse("Failed to fetch image", { status: res.status })
    }

    const contentType = res.headers.get("content-type") || "image/jpeg"
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch {
    return new NextResponse("Proxy error", { status: 502 })
  }
}
