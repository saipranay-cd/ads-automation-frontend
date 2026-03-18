"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/lib/theme"

export function ThemeToggle() {
  const { isDark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
      style={{
        border: "1px solid var(--border-default)",
        color: "var(--text-secondary)",
      }}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
