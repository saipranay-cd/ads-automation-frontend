import { NextResponse } from "next/server"

/**
 * Image proxy for Meta ad thumbnails.
 * Meta's thumbnail_url contains expiring signatures that break when
 * loaded directly from the browser (referrer mismatch / expiry).
 * This route fetches server-side and streams the bytes back.
 */
export async function GET(req: Request) {
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

  const allowed = [
    "scontent.xx.fbcdn.net",
    "external.xx.fbcdn.net",
    ".fbcdn.net",
    ".facebook.com",
    "scontent",
  ]
  const isAllowed = allowed.some(
    (d) => parsed.hostname.endsWith(d) || parsed.hostname.includes("fbcdn") || parsed.hostname.includes("facebook")
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
