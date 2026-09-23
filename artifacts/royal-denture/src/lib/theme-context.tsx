import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface ThemeContextType {
  darkMode: boolean
  toggleDark: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
const KEY = "rd_dark"

function readInitial(): boolean {
  try { return localStorage.getItem(KEY) === "1" } catch { return false }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(readInitial)

  useEffect(() => {
    try { localStorage.setItem(KEY, darkMode ? "1" : "0") } catch { /* ignore */ }
    document.documentElement.classList.toggle("dark", darkMode)
  }, [darkMode])

  const toggleDark = () => setDarkMode(p => !p)

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
