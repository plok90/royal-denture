import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { isReady, fetchOrdersByPhone, updateOrderDoc } from "@/lib/firebase/client"
import { getLocalOrders, getSettingsOrders } from "@/lib/order"
import { useTheme } from "@/lib/theme-context"

const GOLD = "#c9a84c"
const DARK = "#1a0a05"
const FONT = "'Cairo', sans-serif"

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  "قيد المعالجة": { color: "#60a5fa", bg: "rgba(96,165,250,0.12)", icon: "⚙️", label: "قيد المعالجة" },
  "تم":           { color: "#c9a84c", bg: "rgba(201,168,76,0.12)", icon: "🏆", label: "تم التسليم" },
}
const STEPS = [
  { label: "مستلم",        icon: "📥", key: "received"   },
  { label: "قيد المعالجة", icon: "⚙️", key: "processing" },
  { label: "تم التسليم",   icon: "🏆", key: "done"       },
]
function getStepIndex(status: string) {
  if (status === "قيد المعالجة") return 1
  if (status === "تم") return 2
  return 0
}

const RATING_KEY = (id: string) => `rd_rating_${id}`

function loadLocalRating(id: string): number {
  try { return parseInt(localStorage.getItem(RATING_KEY(id)) || "0") || 0 } catch { return 0 }
}

/* ─── Star Rating Widget ─────────────────────────── */
function StarRating({ orderId, existingRating }: { orderId: string; existingRating: number }) {
  const [hover, setHover]       = useState(0)
  const [selected, setSelected] = useState(existingRating)
  const [saved, setSaved]       = useState(existingRating > 0)
  const [saving, setSaving]     = useState(false)

  async function submitRating(stars: number) {
    if (saved || saving) return
    setSelected(stars)
    setSaving(true)
    try { localStorage.setItem(RATING_KEY(orderId), String(stars)) } catch {}
    try {
      if (isReady()) await updateOrderDoc(orderId, { rating: stars })
    } catch {}
    setSaving(false)
    setSaved(true)
  }

  if (saved) {
    return (
      <div style={{ textAlign: "center", padding: "18px 0 4px" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 8 }}>
          {[1,2,3,4,5].map(i => (
            <span key={i} style={{ fontSize: 24, color: i <= selected ? GOLD : "rgba(255,255,255,0.1)", transition: "color 0.2s" }}>★</span>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "rgba(244,240,234,0.45)", fontFamily: FONT, margin: 0 }}>شكراً على تقييمك 🙏</p>
      </div>
    )
  }

  return (
    <div style={{ borderTop: "1px solid rgba(201,168,76,0.1)", marginTop: 16, padding: "18px 0 4px", textAlign: "center" }}>
      <p style={{ fontSize: 11, letterSpacing: 2, color: GOLD, textTransform: "uppercase", fontFamily: FONT, marginBottom: 12 }}>قيّم خدمتنا</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 14 }}
        onMouseLeave={() => setHover(0)}>
        {[1,2,3,4,5].map(i => (
          <button
            key={i}
            onClick={() => submitRating(i)}
            onMouseEnter={() => setHover(i)}
            disabled={saving}
            style={{
              background: "none", border: "none", cursor: saving ? "default" : "pointer",
              fontSize: 32, color: i <= (hover || selected) ? GOLD : "rgba(255,255,255,0.12)",
              transition: "color 0.15s, transform 0.15s",
              transform: i <= hover ? "scale(1.2)" : "scale(1)",
              padding: "0 2px", lineHeight: 1,
            }}
          >★</button>
        ))}
      </div>
      {hover > 0 && (
        <p style={{ fontSize: 12, color: "rgba(244,240,234,0.4)", fontFamily: FONT, margin: 0, minHeight: 18 }}>
          {["", "ضعيف", "مقبول", "جيد", "جيد جداً", "ممتاز"][hover]}
        </p>
      )}
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────── */
export default function TrackPage() {
  const { darkMode } = useTheme()
  const [phone, setPhone]       = useState("")
  const [searched, setSearched] = useState(false)
  const [orders, setOrders]     = useState<any[]>([])
  const [loading, setLoading]   = useState(false)

  const fetchOrders = useCallback(async () => {
    if (!phone.trim()) return
    setLoading(true)
    const all: any[] = []
    if (isReady()) {
      try {
        const data = await fetchOrdersByPhone(phone.trim())
        all.push(...data)
      } catch { /* ignore */ }
    }
    const settingsOrders = await getSettingsOrders()
    all.push(...settingsOrders.filter((o: any) => o.customer_phone === phone.trim()))
    all.push(...getLocalOrders().filter(o => o.customer_phone === phone.trim()))
    const seen = new Set<string>()
    const deduped = all.filter(o => { if (seen.has(o.id)) return false; seen.add(o.id); return true })
    // merge local ratings into orders that came from non-firebase sources
    const merged = deduped.map(o => ({
      ...o,
      rating: o.rating || loadLocalRating(o.id) || 0,
    }))
    setOrders(merged)
    setLoading(false)
    setSearched(true)
  }, [phone])

  useEffect(() => {
    if (!searched) return
    const t = setInterval(fetchOrders, 30000)
    return () => clearInterval(t)
  }, [searched, fetchOrders])

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: darkMode ? "#0d0502" : "#f4f0ea", color: darkMode ? "#f4f0ea" : "#1a0a05", fontFamily: FONT, transition: "background 0.3s" }}>

      <style>{`
        @keyframes rdTrackPulse { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.12)} }
        @keyframes rdTrackSpin  { to{transform:rotate(360deg)} }
        .rd-track-input:focus { border-color:${GOLD} !important; box-shadow:0 0 0 3px rgba(201,168,76,0.15) !important; outline:none; }
        .rd-track-card:hover { border-color:rgba(201,168,76,0.3) !important; transform:translateY(-2px); }
      `}</style>

      {/* Navbar — same colors as site header/sidebar (theme + scroll) */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: darkMode ? "rgba(26,10,5,0.97)" : "rgba(250,247,244,0.97)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(201,168,76,0.2)",
        padding: "14px 0",
        transition: "background 0.45s ease",
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: darkMode ? "rgba(244,240,234,0.75)" : "rgba(26,10,5,0.7)", fontSize: 13, fontFamily: FONT }}>
            <span style={{ fontSize: 16 }}>←</span> العودة للرئيسية
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #c9a84c", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(201,168,76,0.1)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#c9a84c"><path d="M2 18h20l-2-10-5 4-3-7-3 7-5-4z"/></svg>
            </div>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: "0.12em", color: GOLD }}>ROYAL DENTURE</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: darkMode ? "linear-gradient(135deg,#1a0a05 0%,#2a1208 50%,#1a0a05 100%)" : "linear-gradient(135deg,#1a0a05 0%,#2a1208 50%,#1a0a05 100%)", borderBottom: "1px solid rgba(201,168,76,0.12)", padding: "40px 20px 36px", textAlign: "center" }}>
        <p style={{ fontSize:10, letterSpacing:4, color:GOLD, textTransform:"uppercase", fontFamily:FONT, marginBottom:8 }}>تتبع طلبك</p>
        <h1 style={{ fontSize:"clamp(22px,4vw,34px)", fontWeight:900, color:"#f4f0ea", fontFamily:FONT, margin:"0 0 8px" }}>أين وصل <span style={{ color:GOLD }}>طلبي؟</span></h1>
        <p style={{ color:"rgba(244,240,234,0.5)", fontSize:13, maxWidth:360, margin:"0 auto", fontFamily:FONT }}>أدخل رقم هاتفك لمتابعة حالة طلباتك بشكل فوري</p>
      </div>

      <main style={{ maxWidth:720, margin:"0 auto", padding:"36px 20px 60px" }}>

        {/* Search */}
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(201,168,76,0.15)", borderRadius:20, padding:"28px 24px", marginBottom:32, backdropFilter:"blur(10px)" }}>
          <label style={{ display:"block", fontSize:11, letterSpacing:2, color:"rgba(244,240,234,0.5)", textTransform:"uppercase", fontFamily:FONT, marginBottom:12 }}>رقم الهاتف</label>
          <div style={{ display:"flex", gap:10 }}>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") fetchOrders() }}
              placeholder="07XX XXX XXXX" dir="ltr" className="rd-track-input"
              style={{ flex:1, padding:"14px 16px", borderRadius:12, border:"1.5px solid rgba(201,168,76,0.2)", background:"rgba(255,255,255,0.04)", color:"#f4f0ea", fontFamily:FONT, fontSize:15, transition:"border-color 0.2s,box-shadow 0.2s", boxSizing:"border-box" }}
            />
            <button onClick={fetchOrders} disabled={loading}
              style={{ padding:"14px 28px", borderRadius:12, border:"none", background:loading ? "rgba(201,168,76,0.4)" : GOLD, color:DARK, fontWeight:800, cursor:loading ? "default" : "pointer", fontFamily:FONT, fontSize:14, whiteSpace:"nowrap", transition:"all 0.2s" }}>
              {loading ? <span style={{ animation:"rdTrackSpin 1s linear infinite", display:"inline-block" }}>⏳</span> : "بحث"}
            </button>
          </div>
        </div>

        {searched && orders.length === 0 && (
          <div style={{ textAlign:"center", padding:"56px 20px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(201,168,76,0.1)", borderRadius:20 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
            <p style={{ color:"rgba(244,240,234,0.4)", fontSize:14, fontFamily:FONT }}>لا توجد طلبات بهذا الرقم</p>
          </div>
        )}

        {orders.map((o: any) => {
          const sc = STATUS_CONFIG[o.status] || { color:GOLD, bg:"rgba(201,168,76,0.12)", icon:"📦", label:o.status }
          const stepIdx = getStepIndex(o.status)
          return (
            <div key={o.id} className="rd-track-card" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(201,168,76,0.12)", borderRadius:20, marginBottom:20, overflow:"hidden", transition:"all 0.3s" }}>

              {/* Header */}
              <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid rgba(201,168,76,0.08)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      {o.case_id && <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:"rgba(201,168,76,0.15)", color:GOLD, fontFamily:FONT }}>#{o.case_id}</span>}
                      <span style={{ fontSize:15, fontWeight:700, color:"#f4f0ea", fontFamily:FONT }}>{o.customer_name}</span>
                    </div>
                    <span style={{ fontSize:12, color:"rgba(244,240,234,0.4)", fontFamily:FONT }}>{new Date(o.created_at).toLocaleDateString("ar-IQ", { year:"numeric", month:"long", day:"numeric" })}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:999, background:sc.bg, border:`1px solid ${sc.color}33` }}>
                    <span>{sc.icon}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:sc.color, fontFamily:FONT }}>{sc.label}</span>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div style={{ padding:"20px 24px", borderBottom:"1px solid rgba(201,168,76,0.08)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  {STEPS.map((step, i) => (
                    <div key={step.key} style={{ display:"flex", alignItems:"center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                        <div style={{ width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background: i <= stepIdx ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.04)", border:`2px solid ${i <= stepIdx ? GOLD : "rgba(255,255,255,0.1)"}`, fontSize:16, transition:"all 0.3s", animation: i === stepIdx ? "rdTrackPulse 2s infinite" : "none" }}>
                          {i <= stepIdx ? step.icon : <span style={{ opacity:0.3 }}>{step.icon}</span>}
                        </div>
                        <span style={{ fontSize:9, color: i <= stepIdx ? GOLD : "rgba(244,240,234,0.3)", fontFamily:FONT, fontWeight:600, whiteSpace:"nowrap" }}>{step.label}</span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div style={{ flex:1, height:2, margin:"0 4px", marginBottom:20, background: i < stepIdx ? GOLD : "rgba(255,255,255,0.08)", borderRadius:1, transition:"background 0.5s" }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Items */}
              <div style={{ padding:"16px 24px 20px" }}>
                {o.assigned_to && (
                  <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"rgba(244,240,234,0.45)", fontFamily:FONT, marginBottom:12 }}>
                    <span>👤</span><span>يعمل عليه: {o.assigned_to}</span>
                  </div>
                )}
                {Array.isArray(o.items) && o.items.map((item: any, i: number) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", fontSize:13, fontFamily:FONT }}>
                    <span style={{ color:"rgba(244,240,234,0.75)" }}>{item.name_ar || item.name} × {item.quantity}</span>
                    <span style={{ color:GOLD, fontWeight:600 }}>{(item.price * item.quantity).toLocaleString("ar-IQ")} د.ع</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", paddingTop:12, marginTop:4 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:"#f4f0ea", fontFamily:FONT }}>الإجمالي</span>
                  <span style={{ fontSize:15, fontWeight:800, color:GOLD, fontFamily:"'Outfit',sans-serif" }}>{o.total?.toLocaleString("ar-IQ")} <span style={{ fontSize:11, fontWeight:500, fontFamily:FONT }}>د.ع</span></span>
                </div>
                {o.notes && (
                  <div style={{ marginTop:10, padding:"10px 14px", background:"rgba(255,255,255,0.03)", borderRadius:8, fontSize:12, color:"rgba(244,240,234,0.45)", fontFamily:FONT }}>
                    📝 {o.notes}
                  </div>
                )}

                {/* ⭐ Star Rating — only for completed orders */}
                {o.status === "تم" && (
                  <StarRating orderId={o.id} existingRating={o.rating || 0} />
                )}
              </div>
            </div>
          )
        })}

        {orders.length > 0 && (
          <p style={{ textAlign:"center", fontSize:11, color:"rgba(244,240,234,0.25)", fontFamily:FONT, marginTop:8 }}>يتم التحديث تلقائياً كل 30 ثانية</p>
        )}
      </main>
    </div>
  )
}
