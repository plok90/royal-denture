"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

const GOLD = "#c9a84c"
const DARK = "#1a0a05"
const DARK2 = "#251208"
const BORDER_GOLD = "#3a1f10"
const MUTED = "#8a7060"
const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%233a1f10" width="400" height="300"/%3E%3C/svg%3E'
const BLUR_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIj48cmVjdCBmaWxsPSIjMjUxMjA4IiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIvPjwvc3ZnPg=="

export default function ProductDetail() {
  const params = useParams()
  const slug = params?.slug as string
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    (async () => {
      const supabase = createClient()
      if (!supabase) { setError("قاعدة البيانات غير مهيأة"); setLoading(false); return }
      const { data, error: err } = await supabase.from("products").select("*").eq("slug", slug).single()
      if (err || !data) { setError("المنتج غير موجود"); setLoading(false); return }
      setProduct(data)
      setLoading(false)
    })()
  }, [slug])

  if (loading) return (
    <div style={{ minHeight: "100vh", background: DARK, color: GOLD, display: "grid", placeItems: "center", fontFamily: "'Cairo', sans-serif" }}>
      جارٍ التحميل...
    </div>
  )

  if (error || !product) return (
    <div style={{ minHeight: "100vh", background: DARK, color: MUTED, display: "grid", placeItems: "center", fontFamily: "'Cairo', sans-serif", textAlign: "center", padding: 32 }}>
      <div>
        <p style={{ fontSize: 18, marginBottom: 16 }}>{error || "المنتج غير موجود"}</p>
        <Link href="/" style={{ color: GOLD, textDecoration: "none", border: `1px solid ${GOLD}`, padding: "10px 24px", borderRadius: 8, fontSize: 14 }}>العودة إلى المتجر</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: DARK, fontFamily: "'Cairo', sans-serif", direction: "rtl" }}>
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${BORDER_GOLD}`, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ color: GOLD, textDecoration: "none", fontSize: 13 }}>← العودة</Link>
        <span style={{ color: GOLD, fontSize: 14, letterSpacing: 2, fontFamily: "serif" }}>ROYAL DENTURE</span>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        {/* Image */}
        <div style={{ background: DARK2, borderRadius: 16, overflow: "hidden", marginBottom: 24, position: "relative", width: "100%", height: 360 }}>
          <Image
            fill
            src={product.image_url}
            alt={product.name}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            onError={(e) => { const t = e.target as HTMLImageElement; if (!t.dataset.err) { t.dataset.err = "1"; t.src = FALLBACK_IMG; } }}
            style={{ objectFit: "contain" }}
            sizes="(max-width: 800px) 100vw, 800px"
          />
        </div>
        {product.badge && (
          <span style={{ background: GOLD, color: DARK, padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{product.badge}</span>
        )}

        {/* Info */}
        <h1 style={{ color: "#f5efe6", fontSize: 24, margin: "12px 0 2px", fontFamily: "serif" }}>{product.name_ar}</h1>
        <p style={{ color: MUTED, fontSize: 14, marginBottom: 16 }}>{product.name}</p>
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>{product.description}</p>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <span style={{ background: DARK2, color: MUTED, padding: "4px 12px", borderRadius: 20, fontSize: 12, border: `0.5px solid ${BORDER_GOLD}` }}>{product.delivery_days}</span>
        </div>

        <div style={{ fontSize: 28, fontWeight: 700, color: GOLD, marginBottom: 24 }}>
          {product.price?.toLocaleString("ar-IQ")} د.ع
        </div>

        <a
          href={`/?add=${product.slug}`}
          style={{ display: "inline-block", padding: "14px 36px", background: GOLD, color: DARK, fontSize: 15, fontWeight: 700, borderRadius: 8, textDecoration: "none", fontFamily: "'Cairo', sans-serif" }}
        >
          أضف إلى الطلب
        </a>
      </main>
    </div>
  )
}
