"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface AdminContextType {
  isAdmin: boolean
  setIsAdmin: (value: boolean) => void
  showLoginModal: boolean
  setShowLoginModal: (value: boolean) => void
  isInitialized: boolean
  logout: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

const ADMIN_USER = "moamel@2005"
const ADMIN_PASS = "plokplok09"
const ADMIN_KEY = "rd_admin_session"

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    try {
      const session = localStorage.getItem(ADMIN_KEY)
      if (session === "true") {
        setIsAdmin(true)
      }
    } catch {}
    setIsInitialized(true)
  }, [])

  const handleSetIsAdmin = (value: boolean) => {
    setIsAdmin(value)
    try {
      if (value) {
        localStorage.setItem(ADMIN_KEY, "true")
      } else {
        localStorage.removeItem(ADMIN_KEY)
      }
    } catch {}
  }

  const logout = () => {
    handleSetIsAdmin(false)
  }

  return (
    <AdminContext.Provider value={{ 
      isAdmin, 
      setIsAdmin: handleSetIsAdmin, 
      showLoginModal, 
      setShowLoginModal,
      isInitialized,
      logout 
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

export function validateAdmin(username: string, password: string): boolean {
  return username === ADMIN_USER && password === ADMIN_PASS
}
