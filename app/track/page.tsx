"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getLocalOrders, getSettingsOrders } from "@/lib/order"

const GOLD = "#c9a84c"
const DARK = "#1a0a05"
const DARK2 = "#251208"
const BORDER = "#3a1f10"
const TEXT = "#f5efe6"
const MUTED = "#8a7060"
const RED = "#e57373"
const GREEN = "#7fc97f"
const FONT = "'Cairo', sans-serif"

const STATUS_COLORS: Record<string, string> = {
  "جديد": GOLD,
  "قيد المعالجة": "#5dade2",
  "تم": GREEN,
}

export default function TrackPage() {
  const [phone, setPhone] = useState("")
  const [searched, setSearched] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchOrders = useCallback(async () => {
    if (!phone.trim()) return
    setLoading(true)
    const all: any[] = []
    const supabase = createClient()
    if (supabase) {
      const { data } = await supabase.from("orders").select("*").eq("customer_phone", phone.trim()).order("created_at", { ascending: false })
      if (data) all.push(...data)
    }
    const settingsOrders = await getSettingsOrders()
    all.push(...settingsOrders.filter((o: any) => o.customer_phone === phone.trim()))
    all.push(...getLocalOrders().filter(o => o.customer_phone === phone.trim()))
    const seen = new Set<string>()
    const deduped = all.filter(o => { if (seen.has(o.id)) return false; seen.add(o.id); return true })
    setOrders(deduped)
    setLoading(false)
    setSearched(true)
  }, [phone])

  useEffect(() => {
    if (!searched) return
    const timer = setInterval(fetchOrders, 30000)
    return () => clearInterval(timer)
  }, [searched, fetchOrders])

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: DARK, color: TEXT, fontFamily: FONT }}>
      <header style={{ borderBottom: `1px solid ${BORDER}`, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ color: GOLD, textDecoration: "none", fontSize: 14, fontFamily: FONT }}>← العودة للمتجر</Link>
        <span style={{ color: GOLD, fontSize: 18, fontWeight: 700, fontFamily: "serif", letterSpacing: 2 }}>ROYAL DENTURE</span>
      </header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ color: GOLD, fontSize: 24, margin: "0 0 8px", fontFamily: "serif" }}>تتبع طلبي</h1>
        <p style={{ color: MUTED, fontSize: 13, margin: "0 0 24px", fontFamily: FONT }}>أدخل رقم الهاتف للبحث عن طلباتك</p>

        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") fetchOrders() }}
            placeholder="رقم الهاتف"
            style={{
              flex: 1, padding: "11px 14px", borderRadius: 8, border: `1px solid ${BORDER}`,
              background: DARK2, color: TEXT, fontFamily: FONT, fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
          />
          <button
            onClick={fetchOrders}
            disabled={loading}
            style={{
              padding: "11px 22px", borderRadius: 8, border: "none", background: GOLD, color: DARK,
              fontWeight: 700, cursor: "pointer", fontFamily: FONT, fontSize: 14, opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "جارٍ البحث..." : "بحث"}
          </button>
        </div>

        {searched && orders.length === 0 && (
          <div style={{ textAlign: "center", color: MUTED, padding: 40, fontSize: 14 }}>
            لا توجد طلبات بهذا الرقم
          </div>
        )}

        {orders.map((o: any) => (
          <div key={o.id} style={{ background: DARK2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT }}>
                {new Date(o.created_at).toLocaleDateString("ar-IQ")}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 99,
                background: `${STATUS_COLORS[o.status] || MUTED}22`,
                color: STATUS_COLORS[o.status] || MUTED,
              }}>
                {o.status === "تم" ? "✅ " : ""}{o.status}
              </span>
            </div>

            <div style={{ fontSize: 13, color: MUTED, marginBottom: 10, fontFamily: FONT }}>
              {o.customer_name}
            </div>

            {Array.isArray(o.items) && o.items.map((item: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: TEXT, fontFamily: FONT }}>
                <span>{item.name_ar || item.name} × {item.quantity}</span>
                <span style={{ color: GOLD }}>{(item.price * item.quantity).toLocaleString("ar-IQ")} د.ع</span>
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "space-between", borderTop: `0.5px solid ${BORDER}`, marginTop: 10, paddingTop: 10, fontSize: 14, fontWeight: 700, color: GOLD, fontFamily: FONT }}>
              <span>الإجمالي</span>
              <span>{o.total?.toLocaleString("ar-IQ")} د.ع</span>
            </div>

            {o.notes && (
              <div style={{ marginTop: 10, fontSize: 12, color: MUTED, fontFamily: FONT }}>
                <span style={{ color: MUTED }}>ملاحظات: </span>{o.notes}
              </div>
            )}
          </div>
        ))}

        {orders.length > 0 && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT }}>يتم التحديث تلقائياً كل 30 ثانية</span>
          </div>
        )}
      </main>
    </div>
  )
}
