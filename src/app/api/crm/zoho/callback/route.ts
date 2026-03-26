import { redirect } from "next/navigation"

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:8088"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const location = searchParams.get("location") || "us"

  if (!code || !state) {
    redirect("/settings?crm=error&reason=missing_params")
  }

  let redirectTarget = "/settings?crm=error&reason=callback_failed"

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/crm/zoho/callback?code=${code}&state=${state}&location=${location}`,
      { redirect: "manual" }
    )

    if (res.status >= 300 && res.status < 400) {
      // Backend redirected — success
      redirectTarget = res.headers.get("location") || "/settings?crm=connected"
    } else if (res.ok) {
      redirectTarget = "/settings?crm=connected"
    } else {
      // Backend returned an error
      const data = await res.json().catch(() => ({}))
      const reason = encodeURIComponent(data.error || "unknown")
      redirectTarget = `/settings?crm=error&reason=${reason}`
    }
  } catch (err) {
    const msg = encodeURIComponent((err as Error).message || "callback_failed")
    redirectTarget = `/settings?crm=error&reason=${msg}`
  }

  redirect(redirectTarget)
}
