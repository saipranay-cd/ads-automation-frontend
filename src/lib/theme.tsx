"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

type Theme = "violet" | "obsidian"

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "obsidian",
  toggle: () => {},
  isDark: true,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("obsidian")

  useEffect(() => {
    const stored = localStorage.getItem("adsflow-theme") as Theme | null
    const initial = stored ?? "obsidian"
    setTheme(initial)
    document.documentElement.dataset.theme = initial
  }, [])

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "obsidian" ? "violet" : "obsidian"
      document.documentElement.dataset.theme = next
      localStorage.setItem("adsflow-theme", next)
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggle, isDark: theme === "obsidian" }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
