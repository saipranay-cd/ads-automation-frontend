import type { NextAuthOptions } from "next-auth"
import FacebookProvider from "next-auth/providers/facebook"

declare module "next-auth" {
  interface Session {
    metaAccessToken?: string
    metaTokenExpired?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    metaAccessToken?: string
    metaTokenExpiry?: number
  }
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Exchange a short-lived token for a long-lived one (60-day expiry).
 * Called when token is within 7 days of expiry.
 */
async function refreshMetaToken(currentToken: string): Promise<{ token: string; expiresAt: number } | null> {
  try {
    const url = new URL("https://graph.facebook.com/oauth/access_token")
    url.searchParams.set("grant_type", "fb_exchange_token")
    url.searchParams.set("client_id", process.env.META_APP_ID!)
    url.searchParams.set("client_secret", process.env.META_APP_SECRET!)
    url.searchParams.set("fb_exchange_token", currentToken)

    const res = await fetch(url.toString())
    if (!res.ok) return null

    const data = await res.json()
    return {
      token: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in || 5184000), // default 60 days
    }
  } catch {
    return null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    FacebookProvider({
      clientId: process.env.META_APP_ID!,
      clientSecret: process.env.META_APP_SECRET!,
      authorization: {
        params: {
          scope:
            "ads_management,ads_read,read_insights,pages_read_engagement",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // On initial sign-in, store the access token
      if (account?.access_token) {
        token.metaAccessToken = account.access_token
        token.metaTokenExpiry = account.expires_at
      }

      // Token refresh: only if we have a clearly valid expiry (Unix seconds, after 2024)
      const expiry = token.metaTokenExpiry
      if (token.metaAccessToken && typeof expiry === "number" && expiry > 1704067200) {
        const expiresAtMs = expiry * 1000
        const now = Date.now()

        if (now > expiresAtMs) {
          // Expired — try to refresh before giving up
          const refreshed = await refreshMetaToken(token.metaAccessToken)
          if (refreshed) {
            token.metaAccessToken = refreshed.token
            token.metaTokenExpiry = refreshed.expiresAt
          } else {
            token.metaAccessToken = undefined
            token.metaTokenExpiry = undefined
          }
        } else if (expiresAtMs - now < SEVEN_DAYS_MS) {
          const refreshed = await refreshMetaToken(token.metaAccessToken)
          if (refreshed) {
            token.metaAccessToken = refreshed.token
            token.metaTokenExpiry = refreshed.expiresAt
          }
        }
      }
      // If expiry is missing/invalid, keep the token as-is (don't clear it)

      return token
    },
    async session({ session, token }) {
      session.metaAccessToken = token.metaAccessToken
      session.metaTokenExpired = !!token.metaTokenExpiry && !token.metaAccessToken
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
}
