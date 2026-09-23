import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { isReady, fetchProductBySlug } from "@/lib/firebase/client"
import { useTheme } from "@/lib/theme-context"
import { track } from "@/lib/analytics"

const GOLD = "#c9a84c"
const DARK = "#1a0a05"
const DARK2 = "#251208"
const BORDER_GOLD = "#3a1f10"
const MUTED = "#8a7060"
const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%233a1f10" width="400" height="300"/%3E%3C/svg%3E'

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? "property" : "name"
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement("link")
    el.rel = "canonical"
    document.head.appendChild(el)
  }
  el.href = href
}

function absolute(url?: string) {
  if (!url) return "https://royal-denture.web.app/opengraph.jpg"
  if (url.startsWith("http")) return url
  return `https://royal-denture.web.app${url.startsWith("/") ? "" : "/"}${url}`
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { darkMode } = useTheme()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pageBg = darkMode ? "#0d0502" : "#f4f0ea"
  const cardBg = darkMode ? "#251208" : "#ffffff"
  const headBg = darkMode ? "rgba(26,10,5,0.97)" : "rgba(250,247,244,0.97)"
  const headText = darkMode ? "rgba(244,240,234,0.75)" : "rgba(26,10,5,0.7)"
  const titleColor = darkMode ? "#f5efe6" : "#1a0a05"
  const bodyColor = darkMode ? "#8a7060" : "#9a8878"
  const borderCol = darkMode ? "#3a1f10" : "#ddd5c8"

  useEffect(() => {
    if (!slug) return
    ;(async () => {
      if (!isReady()) { setError("قاعدة البيانات غير مهيأة"); setLoading(false); return }
      try {
        const data = await fetchProductBySlug(slug)
        if (!data) { setError("المنتج غير موجود"); setLoading(false); return }
        setProduct(data)
        // Dynamic SEO
        const title = `${data.name_ar || data.name} — Royal Denture`
        const desc = String(data.description || "منتج من مختبر الأسنان الملكي").slice(0, 160)
        document.title = title
        setMeta("description", desc)
        setMeta("og:title", title, true)
        setMeta("og:description", desc, true)
        setMeta("og:url", `https://royal-denture.web.app/products/${slug}`, true)
        setMeta("og:image", absolute(data.image_url), true)
        setMeta("twitter:title", title)
        setMeta("twitter:description", desc)
        setCanonical(`https://royal-denture.web.app/products/${slug}`)
        track("view_item", { item_id: slug, item_name: data.name_ar || data.name, price: data.price })
      } catch {
        setError("المنتج غير موجود")
      }
      setLoading(false)
    })()
  }, [slug])

  if (loading) return (
    <div style={{ minHeight: "100vh", background: pageBg, color: GOLD, display: "grid", placeItems: "center", fontFamily: "'Cairo', sans-serif" }}>
      جارٍ التحميل...
    </div>
  )

  if (error || !product) return (
    <div style={{ minHeight: "100vh", background: pageBg, color: bodyColor, display: "grid", placeItems: "center", fontFamily: "'Cairo', sans-serif", textAlign: "center", padding: 32 }}>
      <div>
        <p style={{ fontSize: 18, marginBottom: 16 }}>{error || "المنتج غير موجود"}</p>
        <Link to="/" style={{ color: GOLD, textDecoration: "none", border: `1px solid ${GOLD}`, padding: "10px 24px", borderRadius: 8, fontSize: 14 }}>العودة إلى المتجر</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: pageBg, fontFamily: "'Cairo', sans-serif", direction: "rtl", transition: "background 0.3s" }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: headBg,
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(201,168,76,0.2)",
        padding: "16px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        transition: "background 0.45s ease",
      }}>
        <Link to="/" style={{ color: headText, textDecoration: "none", fontSize: 13 }}>← العودة</Link>
        <span style={{ color: GOLD, fontSize: 14, letterSpacing: 2, fontFamily: "serif" }}>ROYAL DENTURE</span>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ background: cardBg, border: `1px solid ${borderCol}`, borderRadius: 16, overflow: "hidden", marginBottom: 24, width: "100%", height: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src={product.image_url}
            alt={product.name}
            onError={(e) => { const t = e.target as HTMLImageElement; if (!t.dataset.err) { t.dataset.err = "1"; t.src = FALLBACK_IMG; } }}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
        {product.badge && (
          <span style={{ background: GOLD, color: DARK, padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{product.badge}</span>
        )}

        <h1 style={{ color: titleColor, fontSize: 24, margin: "12px 0 2px", fontFamily: "serif" }}>{product.name_ar}</h1>
        <p style={{ color: bodyColor, fontSize: 14, marginBottom: 16 }}>{product.name}</p>
        <p style={{ color: bodyColor, fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>{product.description}</p>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <span style={{ background: cardBg, color: bodyColor, padding: "4px 12px", borderRadius: 20, fontSize: 12, border: `0.5px solid ${borderCol}` }}>{product.delivery_days}</span>
        </div>

        <div style={{ fontSize: 28, fontWeight: 700, color: GOLD, marginBottom: 24 }}>
          {product.price?.toLocaleString("ar-IQ")} د.ع
        </div>

        <Link
          to={`/?add=${product.slug}`}
          style={{ display: "inline-block", padding: "14px 36px", background: GOLD, color: DARK, fontSize: 15, fontWeight: 700, borderRadius: 8, textDecoration: "none", fontFamily: "'Cairo', sans-serif" }}
        >
          أضف إلى الطلب
        </Link>
      </main>
    </div>
  )
}
