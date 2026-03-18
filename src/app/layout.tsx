import type { Metadata } from "next"
import { DM_Sans, DM_Mono } from "next/font/google"
import { Providers } from "@/lib/providers"
import "./globals.css"

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
})

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "Adsflow — Meta Ads Platform",
  description: "Manage Meta Ads with AI-powered insights",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('adsflow-theme')||'obsidian';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='obsidian';}})();`,
          }}
          suppressHydrationWarning
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
