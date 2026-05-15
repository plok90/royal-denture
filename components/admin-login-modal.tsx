"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAdmin } from "@/lib/admin-context"
import { XIcon } from "./icons"

export function AdminLoginModal() {
  const { showLoginModal, setShowLoginModal, login } = useAdmin()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  if (!showLoginModal) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await login(username, password)

    if (result.success) {
      setShowLoginModal(false)
      setUsername("")
      setPassword("")
      router.push("/admin")
    } else {
      setError(result.error || "اسم المستخدم أو كلمة المرور غير صحيحة")
    }
    setIsLoading(false)
  }

  const handleClose = () => {
    setShowLoginModal(false)
    setUsername("")
    setPassword("")
    setError("")
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-6"
    >
      <div className="bg-[#1a0a05] border border-[#3a1f10] rounded-2xl p-8 max-w-md w-full relative shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 text-[#8a7060] hover:text-[#c9a84c] transition-colors"
        >
          <XIcon />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif text-[#f5efe6] mb-2">تسجيل دخول المدير</h2>
          <p className="text-sm text-[#8a7060]">أدخل بيانات الدخول للوصول إلى لوحة التحكم</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs text-[#8a7060] mb-2 tracking-wider uppercase">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#251208] border border-[#3a1f10] rounded-lg text-[#f5efe6] text-sm focus:outline-none focus:border-[#c9a84c] transition-colors placeholder:text-[#5a4838]"
              placeholder="أدخل اسم المستخدم"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs text-[#8a7060] mb-2 tracking-wider uppercase">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#251208] border border-[#3a1f10] rounded-lg text-[#f5efe6] text-sm focus:outline-none focus:border-[#c9a84c] transition-colors placeholder:text-[#5a4838]"
              placeholder="أدخل كلمة المرور"
              dir="ltr"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#c9a84c] text-[#1a0a05] font-semibold rounded-lg hover:bg-[#d4b55a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "جاري التحقق..." : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </div>
  )
}
