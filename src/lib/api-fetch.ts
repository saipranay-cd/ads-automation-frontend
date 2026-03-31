/**
 * Fetch wrapper that automatically attaches the org JWT token
 * from localStorage to all API requests.
 *
 * Use this instead of plain `fetch()` in hooks and components
 * so JWT-authenticated users (email/password) have their token
 * sent to the backend proxy routes.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers)

  // Attach org-token from localStorage if available and no auth header set
  if (typeof window !== "undefined" && !headers.has("Authorization")) {
    const token = localStorage.getItem("org-token")
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
  }

  return fetch(input, { ...init, headers })
}
