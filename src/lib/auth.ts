import type { NextAuthOptions } from "next-auth"
import FacebookProvider from "next-auth/providers/facebook"

declare module "next-auth" {
  interface Session {
    metaAccessToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    metaAccessToken?: string
    metaTokenExpiry?: number
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
            "ads_management,ads_read,business_management,read_insights",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.metaAccessToken = account.access_token
        token.metaTokenExpiry = account.expires_at
      }
      return token
    },
    async session({ session, token }) {
      session.metaAccessToken = token.metaAccessToken
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
