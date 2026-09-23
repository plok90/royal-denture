import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useTheme } from "@/lib/theme-context"
import { fetchActiveProducts, prefetchProduct } from "@/lib/firebase/client"
import { placeOrder, validateOrder, type CheckoutProduct } from "@/lib/order"
import { toast } from "sonner"

const GOLD = "#c9a84c"
const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%233a1f10" width="400" height="300"/%3E%3C/svg%3E'

export function CartDrawer() {
  const { items, setQty, removeItem, clear, setOpen, isOpen } = useCart()
  const { darkMode } = useTheme()
  const navigate = useNavigate()
  const [products, setProducts] = useState<CheckoutProduct[]>([])
  const [rawProducts, setRawProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(() => { try { return localStorage.getItem("rd_name") || "" } catch { return "" } })
  const [phone, setPhone] = useState(() => { try { return localStorage.getItem("rd_phone") || "" } catch { return "" } })
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<{ name?: string; phone?: string; products?: string }>({})
  const [sending, setSending] = useState(false)

  useEffect(() => {
    try { localStorage.setItem("rd_name", name) } catch { /* ignore */ }
  }, [name])
  useEffect(() => {
    try { localStorage.setItem("rd_phone", phone) } catch { /* ignore */ }
  }, [phone])

  useEffect(() => {
    if (!isOpen || rawProducts.length > 0) return
    let cancelled = false
    setLoading(true)
    fetchActiveProducts()
      .then((rows) => {
        if (cancelled) return
        const list = Array.isArray(rows) ? rows : []
        setRawProducts(list)
        setProducts(list.map((r) => ({
          id: r.slug || r.id,
          slug: r.slug,
          name: r.name,
          name_ar: r.name_ar,
          price: Number(r.price) || 0,
        })))
      })
      .catch(() => { /* ignore; retry on next open */ })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, rawProducts.length])

  useEffect(() => {
    if (!isOpen) return
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", onEsc)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onEsc)
      document.body.style.overflow = ""
    }
  }, [isOpen, setOpen])

  if (!isOpen) return null

  const surface = darkMode ? "#1a0a05" : "#ffffff"
  const border = darkMode ? "#3a1f10" : "#ddd5c8"
  const text = darkMode ? "#f5efe6" : "#1a0a05"
  const muted = darkMode ? "#8a7060" : "#9a8878"
  const inputBg = darkMode ? "#251208" : "#faf7f4"

  const findRaw = (id: string) =>
    rawProducts.find((r) => r.id === id || r.slug === id || (r.slug || r.id) === id)

  const lineItems = items.map((item) => {
    const p = findRaw(item.productId)
    return {
      ...item,
      product: p,
      price: Number(p?.price) || 0,
      image: String(p?.image_url || ""),
      nameAr: String(p?.name_ar || p?.name || item.productId),
      nameEn: String(p?.name || ""),
      found: !!p,
    }
  })

  const total = lineItems.reduce((s, l) => s + l.price * l.quantity, 0)

  const prefetchHover = (slug?: string) => { if (slug) prefetchProduct(slug) }

  const handleSend = async () => {
    const errs = validateOrder(items, name, phone)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSending(true)
    try {
      let whatsapp = "9647766463735"
      try { whatsapp = localStorage.getItem("rd_whatsapp") || whatsapp } catch { /* ignore */ }
      await placeOrder({ products, items, name, phone, notes, whatsappNumber: whatsapp })
      clear()
      setNotes("")
      toast.success("تم إرسال الطلب عبر واتساب ✅", { position: "top-center" })
      setOpen(false)
      navigate("/track")
    } catch {
      toast.error("تعذر إرسال الطلب", { position: "top-center" })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80]" dir="rtl">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        style={{ animation: "fadeIn .2s ease" }}
      />
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(-100%) } to { transform: translateX(0) } }
      `}</style>

      <aside
        className="absolute bottom-0 left-0 top-0 flex w-full max-w-[420px] flex-col shadow-2xl"
        style={{
          background: surface,
          borderRight: `1px solid ${border}`,
          borderLeft: "none",
          animation: "slideIn .3s cubic-bezier(.16,1,.3,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${border}` }}
        >
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={20} color={GOLD} />
            <h2 className="m-0 text-lg font-bold" style={{ color: text, fontFamily: "'Cairo', sans-serif" }}>
              سلة التسوق
            </h2>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold"
              style={{ background: `${GOLD}22`, color: GOLD }}
            >
              {items.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={() => { clear(); toast.info("تم مسح السلة", { position: "top-center" }) }}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                style={{ color: muted }}
              >
                <Trash2 size={14} /> مسح
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              aria-label="إغلاق"
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              style={{ color: muted }}
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center" style={{ color: muted }}>
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full"
                style={{ background: `${GOLD}15` }}
              >
                <ShoppingBag size={36} color={GOLD} strokeWidth={1.4} />
              </div>
              <p className="m-0 text-base font-bold" style={{ color: text }}>سلتك فارغة</p>
              <p className="m-0 text-sm">أضف منتجات لتظهر هنا</p>
              <button
                onClick={() => {
                  setOpen(false)
                  if (location.pathname !== "/") navigate("/")
                  setTimeout(() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }), 150)
                }}
                className="mt-2 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-transform active:scale-95"
                style={{ background: GOLD, color: "#1a0a05" }}
              >
                تصفح المنتجات <ArrowLeft size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {loading && rawProducts.length === 0 && (
                <div className="flex flex-col gap-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="flex gap-3 rounded-2xl p-3 animate-pulse" style={{ background: inputBg, border: `1px solid ${border}` }}>
                      <div className="h-16 w-16 shrink-0 rounded-xl" style={{ background: darkMode ? "#3a1f10" : "#ebe4d8" }} />
                      <div className="flex-1 flex flex-col gap-2 py-1">
                        <div className="h-4 w-2/3 rounded" style={{ background: darkMode ? "#3a1f10" : "#ebe4d8" }} />
                        <div className="h-3 w-1/3 rounded" style={{ background: darkMode ? "#3a1f10" : "#ebe4d8" }} />
                        <div className="h-4 w-1/2 rounded-full" style={{ background: darkMode ? "#3a1f10" : "#ebe4d8" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {lineItems.map((l) => (
                <div
                  key={l.productId}
                  className="flex gap-3 rounded-2xl p-3"
                  style={{ background: inputBg, border: `1px solid ${border}` }}
                  onMouseEnter={() => prefetchHover(l.product?.slug || l.productId)}
                >
                  <div
                    className="h-16 w-16 shrink-0 overflow-hidden rounded-xl"
                    style={{ background: darkMode ? "#251208" : "#f0ebe3" }}
                  >
                    {l.image ? (
                      <img
                        src={l.image}
                        alt={l.nameAr}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => { const t = e.currentTarget; if (!t.dataset.err) { t.dataset.err = "1"; t.src = FALLBACK_IMG } }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs" style={{ color: muted }}>بدون صورة</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm font-bold" style={{ color: text }}>{l.nameAr}</p>
                        <p className="m-0 mt-0.5 truncate text-xs" style={{ color: muted }} dir="ltr">{l.nameEn}</p>
                      </div>
                      <button
                        onClick={() => removeItem(l.productId)}
                        aria-label="حذف"
                        className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                        style={{ color: muted }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div
                        className="flex items-center rounded-full"
                        style={{ background: darkMode ? "#1a0a05" : "#fff", border: `1px solid ${border}` }}
                      >
                        <button
                          onClick={() => setQty(l.productId, l.quantity - 1)}
                          aria-label="إنقاص"
                          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                          style={{ color: text }}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-7 text-center text-sm font-bold" style={{ color: text }}>{l.quantity}</span>
                        <button
                          onClick={() => setQty(l.productId, l.quantity + 1)}
                          aria-label="زيادة"
                          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                          style={{ color: text }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-sm font-bold" style={{ color: l.found ? GOLD : muted }}>
                        {l.found
                          ? <>{(l.price * l.quantity).toLocaleString("ar-IQ")} د.ع</>
                          : loading ? "…" : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-1 rounded-2xl p-4" style={{ background: inputBg, border: `1px solid ${border}` }}>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                  بيانات التواصل
                </p>
                <label className="mb-1 block text-xs" style={{ color: muted }}>الاسم</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك"
                  className="mb-1 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[#c9a84c]"
                  style={{ background: surface, borderColor: errors.name ? "#e57373" : border, color: text }}
                />
                {errors.name && <p className="m-0 mb-2 text-xs text-[#e57373]">{errors.name}</p>}

                <label className="mb-1 mt-2 block text-xs" style={{ color: muted }}>الهاتف</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XX XXX XXXX"
                  dir="ltr"
                  className="mb-1 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[#c9a84c]"
                  style={{ background: surface, borderColor: errors.phone ? "#e57373" : border, color: text }}
                />
                {errors.phone && <p className="m-0 mb-2 text-xs text-[#e57373]">{errors.phone}</p>}

                <label className="mb-1 mt-2 block text-xs" style={{ color: muted }}>ملاحظات (اختياري)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="أي تعليمات خاصة..."
                  className="w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[#c9a84c]"
                  style={{ background: surface, borderColor: border, color: text }}
                />
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <footer className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3" style={{ borderTop: `1px solid ${border}` }}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm" style={{ color: muted }}>الإجمالي</span>
              <span className="text-lg font-black" style={{ color: total > 0 ? GOLD : muted, fontFamily: "'Outfit', sans-serif" }}>
                {total > 0 ? total.toLocaleString("ar-IQ") : loading ? "…" : "0"} <span className="text-xs font-medium" style={{ color: muted }}>د.ع</span>
              </span>
            </div>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-transform active:scale-[.98] disabled:opacity-60"
              style={{ background: GOLD, color: "#1a0a05" }}
            >
              {sending ? "جارٍ الإرسال..." : "💬 إتمام الطلب عبر واتساب"}
            </button>
          </footer>
        )}
      </aside>
    </div>
  )
}
