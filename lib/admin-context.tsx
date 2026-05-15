"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

interface SessionData {
  token: string
  name: string
  username: string
  device: string
  created_at: string
}

interface AdminContextType {
  isAdmin: boolean
  currentAdmin: { name: string; username: string } | null
  isMainAdmin: boolean
  showLoginModal: boolean
  setShowLoginModal: (value: boolean) => void
  isInitialized: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  sessions: SessionData[]
  logoutSession: (token: string) => Promise<void>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

const FALLBACK_CREDENTIALS = [
  { name: "مؤمل أحمد", username: "moamel@2005", password: "abasAS@1977" },
  { name: "أحمد شاكر", username: "ahmed-shaker", password: "sara@2006" },
  { name: "ياسين محمد", username: "yaseen-mohammed", password: "aya@2006" },
]
const MAIN_ADMIN_USERNAME = "moamel@2005"
const SESSIONS_KEY = "admin_sessions"
const CREDENTIALS_KEY = "admin_credentials"

function getDevice(): string {
  if (typeof navigator === "undefined") return "unknown"
  const ua = navigator.userAgent
  const os = ua.includes("Win") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Linux") ? "Linux" : "unknown"
  const browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "unknown"
  return `${browser} / ${os}`
}

async function readSessions(supabase: NonNullable<ReturnType<typeof createClient>>): Promise<SessionData[]> {
  try {
    const { data } = await supabase.from("admin_settings").select("value").eq("key", SESSIONS_KEY).maybeSingle()
    return data?.value ? JSON.parse(data.value) : []
  } catch { return [] }
}

async function writeSessions(supabase: NonNullable<ReturnType<typeof createClient>>, sessions: SessionData[]) {
  try {
    await supabase.from("admin_settings").upsert(
      { key: SESSIONS_KEY, value: JSON.stringify(sessions) },
      { onConflict: "key", ignoreDuplicates: false }
    )
  } catch { /* ignore */ }
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentAdmin, setCurrentAdmin] = useState<{ name: string; username: string } | null>(null)
  const [isMainAdmin, setIsMainAdmin] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [sessions, setSessions] = useState<SessionData[]>([])

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      if (!supabase) { setIsInitialized(true); return }
      const stored = localStorage.getItem("rd_admin_session")
      if (!stored) { setIsInitialized(true); return }
      try {
        const parsed = JSON.parse(stored)
        if (parsed.token && parsed.name) {
          const allSessions = await readSessions(supabase)
          setSessions(allSessions)
          const match = allSessions.find(s => s.token === parsed.token)
          if (match) {
            setIsAdmin(true)
            setCurrentAdmin({ name: match.name, username: match.username })
            setIsMainAdmin(match.username === MAIN_ADMIN_USERNAME)
          }
        }
      } catch { /* ignore */ }
      setIsInitialized(true)
    })()
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = createClient()
    let credentials = FALLBACK_CREDENTIALS
    if (supabase) {
      try {
        const { data } = await supabase.from("admin_settings").select("value").eq("key", CREDENTIALS_KEY).maybeSingle()
        if (data?.value) {
          const parsed = JSON.parse(data.value)
          if (Array.isArray(parsed) && parsed.length) credentials = parsed
        }
      } catch { /* ignore */ }
    }
    const match = credentials.find(c => c.username === username && c.password === password)
    if (!match) return { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" }
    const token = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
    const session: SessionData = {
      token,
      name: match.name,
      username: match.username,
      device: getDevice(),
      created_at: new Date().toISOString(),
    }
    if (supabase) {
      const allSessions = await readSessions(supabase)
      allSessions.unshift(session)
      await writeSessions(supabase, allSessions)
      setSessions(allSessions)
    }
    localStorage.setItem("rd_admin_session", JSON.stringify({ token, name: match.name }))
    setIsAdmin(true)
    setCurrentAdmin({ name: match.name, username: match.username })
    setIsMainAdmin(match.username === MAIN_ADMIN_USERNAME)
    return { success: true }
  }, [])

  const logout = useCallback(async () => {
    const supabase = createClient()
    const stored = localStorage.getItem("rd_admin_session")
    if (supabase && stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.token) {
          const allSessions = await readSessions(supabase)
          const filtered = allSessions.filter(s => s.token !== parsed.token)
          await writeSessions(supabase, filtered)
          setSessions(filtered)
        }
      } catch { /* ignore */ }
    }
    localStorage.removeItem("rd_admin_session")
    setIsAdmin(false)
    setCurrentAdmin(null)
    setIsMainAdmin(false)
  }, [])

  const logoutSession = useCallback(async (token: string) => {
    const supabase = createClient()
    if (!supabase) return
    try {
      const allSessions = await readSessions(supabase)
      const filtered = allSessions.filter(s => s.token !== token)
      await writeSessions(supabase, filtered)
      setSessions(filtered)
      const stored = localStorage.getItem("rd_admin_session")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.token === token) {
          localStorage.removeItem("rd_admin_session")
          setIsAdmin(false)
          setCurrentAdmin(null)
          setIsMainAdmin(false)
        }
      }
    } catch { /* ignore */ }
  }, [])

  return (
    <AdminContext.Provider value={{
      isAdmin,
      currentAdmin,
      isMainAdmin,
      showLoginModal,
      setShowLoginModal,
      isInitialized,
      login,
      logout,
      sessions,
      logoutSession,
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider")
  }
  return context
}
