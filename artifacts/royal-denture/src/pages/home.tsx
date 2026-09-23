import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Crown, Star, ShieldCheck, Users, ChevronDown, Sun, Moon, Clock, Plus, Minus, ShoppingBag } from "lucide-react";
import { isReady, fetchActiveProducts, fetchTestimonials, fetchSettingsMap, fetchStages, prefetchProduct, type StageDoc } from "@/lib/firebase/client";
import { ImageLightbox } from "@/components/image-lightbox";
import { placeOrder } from "@/lib/order";
import { useTheme } from "@/lib/theme-context";
import { useCart } from "@/lib/cart-context";

const GOLD = "#c9a84c";
const DARK = "#1a0a05";
const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%233a1f10" width="400" height="300"/%3E%3C/svg%3E';
const DARK2 = "#251208";
const BORDER_GOLD = "#3a1f10";
const CREAM = "#f4f0ea";
const CREAM2 = "#faf7f4";
const BORDER_LIGHT = "#ddd5c8";
const MUTED = "#9a8878";

interface Product {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  price: number;
  deliveryDays: string;
  badge?: string;
  image: string;
  stage: number;
}

interface FormErrors {
  name?: string;
  phone?: string;
  products?: string;
}

const DEFAULT_STAGES: StageDoc[] = [
  { id: "2", number: 2, title: "المرحلة الثانية", sort_order: 1, is_active: true },
  { id: "3", number: 3, title: "المرحلة الثالثة", sort_order: 2, is_active: true },
];

export default function Home() {
  const { darkMode, toggleDark } = useTheme();
  const {
    items: orderItems, setQty: cartSetQty, toggle: cartToggle,
    clear: clearCart, count: cartCount, setOpen: setCartOpen,
  } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [stages, setStages] = useState<StageDoc[]>(DEFAULT_STAGES);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(() => { try { return localStorage.getItem("rd_name") || ""; } catch { return ""; } });
  const [phone, setPhone] = useState(() => { try { return localStorage.getItem("rd_phone") || ""; } catch { return ""; } });
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isScrolled, setIsScrolled] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [testimonials, setTestimonials] = useState<{text: string; author?: string}[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState(() => { try { return localStorage.getItem("rd_whatsapp") || "9647766463735"; } catch { return "9647766463735"; } });
  const [siteTitle, setSiteTitle] = useState("ROYAL DENTURE");
  const [siteSubtitle, setSiteSubtitle] = useState("مختبر الأسنان الملكي");
  const [siteTagline, setSiteTagline] = useState("اختر ما يناسبك والباقي علينا");
  const [activeStage, setActiveStage] = useState<number>(2);

  useEffect(() => { try { localStorage.setItem("rd_name", name); } catch { } }, [name]);
  useEffect(() => { try { localStorage.setItem("rd_phone", phone); } catch { } }, [phone]);
  useEffect(() => { document.body.style.margin = "0"; document.body.style.padding = "0"; document.documentElement.style.margin = "0"; document.documentElement.style.padding = "0"; }, []);
  useEffect(() => { const onScroll = () => setIsScrolled(window.scrollY > 20); window.addEventListener("scroll", onScroll); return () => window.removeEventListener("scroll", onScroll); }, []);

  useEffect(() => {
    (async () => {
      if (!isReady()) { setFetchError("لم يتم تهيئة قاعدة البيانات"); setLoading(false); return; }
      try {
        const [rows, testimonialsRes, map, stagesRes] = await Promise.all([
          fetchActiveProducts(),
          fetchTestimonials(),
          fetchSettingsMap(),
          fetchStages(),
        ]);
        const mapped: Product[] = rows.map((r: any) => ({
          id: r.slug || r.id,
          name: r.name,
          nameAr: r.name_ar,
          description: r.description,
          price: r.price,
          deliveryDays: r.delivery_days,
          badge: r.badge || undefined,
          image: r.image_url,
          stage: r.stage ?? 2,
        }));
        setProducts(mapped);
        const activeStages = stagesRes.filter((s) => s.is_active);
        setStages(activeStages.length ? activeStages : DEFAULT_STAGES);
        setFetchError(null);
        const addSlug = new URLSearchParams(window.location.search).get("add");
        if (addSlug) {
          const found = mapped.find((p: Product) => p.id === addSlug);
          if (found && !orderItems.some(i => i.productId === found.id)) {
            cartSetQty(found.id, 1);
          }
          window.history.replaceState({}, "", "/");
        }
        if (testimonialsRes.length) {
          setTestimonials(testimonialsRes);
        }
        if (map.whatsapp_number) { setWhatsappNumber(map.whatsapp_number); try { localStorage.setItem("rd_whatsapp", map.whatsapp_number); } catch {} }
        if (map.site_title) setSiteTitle(map.site_title);
        if (map.site_subtitle) setSiteSubtitle(map.site_subtitle);
        if (map.site_tagline) setSiteTagline(map.site_tagline);
      } catch (e) {
        console.warn(e);
        setFetchError("فشل تحميل المنتجات، يرجى المحاولة لاحقاً");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading && stages.length && !stages.some(s => s.number === activeStage)) {
      setActiveStage(stages[0].number);
    }
  }, [loading, stages, activeStage]);

  const getQty = (id: string) => orderItems.find(i => i.productId === id)?.quantity || 0;

  const setQty = (id: string, qty: number) => {
    cartSetQty(id, qty);
    setErrors(prev => ({ ...prev, products: undefined }));
  };

  const toggleProduct = (id: string) => {
    const qty = getQty(id);
    if (qty > 0) {
      cartSetQty(id, 0);
    } else {
      cartSetQty(id, 1);
      setAnimatingId(id);
      setTimeout(() => setAnimatingId(null), 400);
    }
    setErrors(prev => ({ ...prev, products: undefined }));
  };

  const selectedItems = orderItems.filter(i => i.quantity > 0);
  const total = selectedItems.reduce((sum, item) => {
    const p = products.find(p => p.id === item.productId);
    return sum + (p ? p.price * item.quantity : 0);
  }, 0);

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (selectedItems.length === 0) errs.products = "اختر منتجاً واحداً على الأقل";
    if (!name.trim()) errs.name = "الاسم مطلوب";
    if (!phone.trim()) errs.phone = "رقم الهاتف مطلوب";
    else if (!/^[\d\s+\-]{9,15}$/.test(phone.trim())) errs.phone = "رقم الهاتف غير صحيح";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitOrder = () => { if (validate()) setShowPreview(true); };

  const confirmOrder = async () => {
    try {
      await placeOrder({ products, items: selectedItems, name, phone, notes, whatsappNumber });
      setShowPreview(false);
      clearCart();
      setNotes("");
    } catch {
      setShowPreview(false);
    }
  };

  const clearAll = () => { clearCart(); setNotes(""); setErrors({}); };

  const scrollToStage = (num: number) => {
    setActiveStage(num);
    document.getElementById(`stage-${num}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const bg = darkMode ? "#0d0502" : CREAM;
  const surface = darkMode ? "#1a0a05" : "#fff";
  const surfaceBorder = darkMode ? BORDER_GOLD : BORDER_LIGHT;
  const textPrimary = darkMode ? "#f5efe6" : DARK;
  const textMuted = darkMode ? "#8a7060" : MUTED;
  const inputBg = darkMode ? DARK2 : CREAM2;

  return (
    <div style={{ minHeight: "100vh", width: "100%", maxWidth: "100%", background: bg, fontFamily: "'Cairo', sans-serif", direction: "rtl", transition: "background 0.3s", margin: 0, padding: 0 }}>
      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rdFloatA { 0%,100% { transform: translateY(0) scale(1); opacity: 0.35; } 50% { transform: translateY(-22px) scale(1.08); opacity: 0.65; } }
        @keyframes rdFloatB { 0%,100% { transform: translateY(0) scale(1); opacity: 0.22; } 50% { transform: translateY(-30px) scale(0.92); opacity: 0.5; } }
        @keyframes rdShimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        @keyframes rdBounce { 0%,20%,50%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-9px); } 60% { transform: translateY(-4px); } }
        @keyframes rdPulse { 0%,100% { box-shadow: 0 0 14px rgba(201,168,76,0.22); } 50% { box-shadow: 0 0 32px rgba(201,168,76,0.5); } }
        @keyframes rdShimBtn { 0% { left:-80%; } 100% { left:130%; } }
        .rd-gold-text { background: linear-gradient(90deg,#e8d08c,#c9a84c,#a68430,#c9a84c,#e8d08c); background-size:200% auto; color:transparent; -webkit-background-clip:text; background-clip:text; animation:rdShimmer 6s linear infinite; }
        .rd-lux-btn { position:relative; overflow:hidden; transition:transform 0.25s ease,box-shadow 0.25s ease; }
        .rd-lux-btn::after { content:''; position:absolute; top:0; left:-80%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent); transform:skewX(-20deg); animation:rdShimBtn 3.5s infinite; }
        .rd-lux-btn:hover { transform:translateY(-2px); }
        .rd-particle { position:absolute; border-radius:50%; background:radial-gradient(circle,rgba(201,168,76,0.7) 0%,rgba(201,168,76,0) 70%); pointer-events:none; }
        .rd-glass { backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); }
        .rd-toggle:hover { transform:scale(1.08); }
        .rd-nav-links { display:flex; }
        .rd-nav-cta { display:inline-block; }
        .rd-hero-grid { display:grid; grid-template-columns:1fr 1fr; gap:56px; align-items:center; }
        .rd-hero-right { display:block; }
        .rd-hero-inner { padding:120px 28px 80px; }
        .rd-navbar-inner { padding:0 28px; }
        @media (max-width: 768px) {
          .rd-nav-links { display:none !important; }
          .rd-nav-cta { display:none !important; }
          .rd-hero-grid { grid-template-columns:1fr !important; gap:0 !important; }
          .rd-hero-right { display:none !important; }
          .rd-hero-inner { padding:100px 20px 60px !important; }
          .rd-navbar-inner { padding:0 16px !important; }
          .rd-lux-btn::after { display:none; }
          .rd-order-form { padding:24px 18px !important; }
          .rd-order-form input, .rd-order-form textarea { padding:14px 16px !important; font-size:16px !important; border-radius:12px !important; }
          .rd-order-form button { padding:16px 0 !important; font-size:16px !important; border-radius:12px !important; }
          .rd-form-actions { flex-direction:column !important; }
          .rd-form-actions button { width:100% !important; }
        }
      ` }} />
      {/* Fixed Navbar */}
      <header style={{ position: "fixed", top: 0, width: "100%", zIndex: 50, background: isScrolled ? (darkMode ? "rgba(26,10,5,0.92)" : "rgba(250,247,244,0.92)") : "transparent", backdropFilter: isScrolled ? "blur(14px)" : "none", WebkitBackdropFilter: isScrolled ? "blur(14px)" : "none", borderBottom: isScrolled ? "1px solid rgba(201,168,76,0.2)" : "none", padding: isScrolled ? "10px 0" : "20px 0", transition: "all 0.45s ease" }}>
        <div className="rd-navbar-inner" style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", flexShrink: 0, boxShadow: "0 0 0 1.5px rgba(201,168,76,0.4)" }}>
              <img src="/logo.png" alt="Royal Denture Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 16, letterSpacing: "0.12em", color: "#c9a84c" }}>{siteTitle}</span>
              <span style={{ fontSize: 10, color: !isScrolled ? "rgba(244,240,234,0.6)" : (darkMode ? "rgba(244,240,234,0.6)" : "rgba(26,10,5,0.5)"), fontWeight: 600, fontFamily: "'Cairo', sans-serif", transition: "color 0.3s" }}>{siteSubtitle}</span>
            </div>
          </div>
          <nav className="rd-nav-links" style={{ alignItems: "center", gap: 28, fontSize: 13, fontWeight: 600 }}>
            <a href="#products" style={{ color: isScrolled ? (darkMode ? "rgba(244,240,234,0.75)" : "rgba(26,10,5,0.7)") : "rgba(244,240,234,0.8)", textDecoration: "none", fontFamily: "'Cairo', sans-serif", transition: "color 0.3s" }}>خدماتنا</a>
            <Link to="/track" style={{ color: isScrolled ? (darkMode ? "rgba(244,240,234,0.75)" : "rgba(26,10,5,0.7)") : "rgba(244,240,234,0.8)", textDecoration: "none", fontFamily: "'Cairo', sans-serif", transition: "color 0.3s" }}>تتبع الطلب</Link>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={toggleDark} aria-label="تبديل الوضع" className="rd-toggle" style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(201,168,76,0.12)", border: "1.5px solid rgba(201,168,76,0.25)", borderRadius: 24, padding: "6px 14px", color: "#c9a84c", fontSize: 12, fontFamily: "'Cairo', sans-serif", fontWeight: 700, cursor: "pointer", transition: "all 0.3s ease" }}>
              {darkMode ? <><Sun size={14} color="#c9a84c" /><span>نهاري</span></> : <><Moon size={14} color="#c9a84c" /><span>ليلي</span></>}
            </button>
            <button
              onClick={() => setCartOpen(true)}
              aria-label="فتح السلة"
              className="rd-toggle relative"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(201,168,76,0.12)", border: "1.5px solid rgba(201,168,76,0.25)", borderRadius: 24, padding: "6px 14px", color: "#c9a84c", cursor: "pointer" }}
            >
              <ShoppingBag size={16} />
              {cartCount > 0 && (
                <span style={{ position: "absolute", top: -6, left: -6, background: GOLD, color: "#1a0a05", fontSize: 10, fontWeight: 800, minWidth: 16, height: 16, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
            <a href="#products" className="rd-lux-btn rd-nav-cta" style={{ background: "#c9a84c", color: "#1a0a05", padding: "8px 20px", borderRadius: 4, fontWeight: 800, fontSize: 13, border: "none", fontFamily: "'Cairo', sans-serif", cursor: "pointer", textDecoration: "none", animation: "rdPulse 3s infinite" }}>اطلب الآن</a>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section style={{ position: "relative", minHeight: "100dvh", background: "#1a0a05", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "18%", right: "8%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", bottom: "15%", left: "6%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)", filter: "blur(80px)" }} />
          <div className="rd-particle" style={{ width: 14, height: 14, top: "14%", right: "24%", animation: "rdFloatA 7s infinite" }} />
          <div className="rd-particle" style={{ width: 20, height: 20, top: "62%", right: "14%", animation: "rdFloatB 9s infinite" }} />
          <div className="rd-particle" style={{ width: 10, height: 10, top: "33%", left: "19%", animation: "rdFloatA 6s infinite 1s" }} />
          <div className="rd-particle" style={{ width: 16, height: 16, bottom: "22%", left: "28%", animation: "rdFloatB 8s infinite 2s" }} />
        </div>
        <div className="rd-hero-inner" style={{ position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto", width: "100%" }}>
          <div className="rd-hero-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: 24, textAlign: "right" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 999, border: "1px solid rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.09)", fontSize: 11, color: "#c9a84c", fontWeight: 700, width: "fit-content", alignSelf: "flex-end", fontFamily: "'Cairo', sans-serif" }}>
                <Star size={12} fill="#c9a84c" color="#c9a84c" />
                <span>الخيار الأول لأطباء الأسنان</span>
              </div>
              <h1 style={{ fontSize: "clamp(38px, 5vw, 62px)", fontWeight: 900, lineHeight: 1.28, margin: 0, color: "#f4f0ea", fontFamily: "'Cairo', sans-serif" }}>
                ابتسامة <span className="rd-gold-text" style={{ display: "inline-block" }}>ملكية</span>
                <br /><span style={{ fontSize: "clamp(30px, 4vw, 46px)" }}>دقة لا تُضاهى</span>
              </h1>
              <p style={{ fontSize: 15, lineHeight: 1.85, color: "rgba(244,240,234,0.62)", maxWidth: 420, margin: 0, fontFamily: "'Cairo', sans-serif" }}>{siteTagline} — نقدم أحدث تقنيات صناعة الأسنان مع ضمان الجودة والالتزام بالمواعيد.</p>
              <div style={{ display: "flex", gap: 12, alignItems: "center", paddingTop: 6, flexWrap: "wrap" }}>
                <a href="#products" className="rd-lux-btn" style={{ background: "#c9a84c", color: "#1a0a05", padding: "14px 32px", borderRadius: 4, fontWeight: 900, fontSize: 15, border: "none", fontFamily: "'Cairo', sans-serif", cursor: "pointer", textDecoration: "none", display: "inline-block" }}>ابدأ طلبك الآن</a>
                <Link to="/track" style={{ border: "1.5px solid rgba(201,168,76,0.35)", color: "#f4f0ea", padding: "13px 24px", borderRadius: 4, fontWeight: 700, fontSize: 14, fontFamily: "'Cairo', sans-serif", textDecoration: "none", display: "inline-block" }}>تتبع طلبي</Link>
              </div>
              <div style={{ display: "flex", gap: 20, paddingTop: 12, borderTop: "1px solid rgba(201,168,76,0.15)", marginTop: 4, flexWrap: "wrap" }}>
                {[{ icon: <ShieldCheck size={14} color="#c9a84c" />, label: "ضمان الجودة" }, { icon: <Star size={14} color="#c9a84c" fill="#c9a84c" />, label: "خبرة ٢٠+ سنة" }, { icon: <Users size={14} color="#c9a84c" />, label: "٥٠٠+ عميل راضٍ" }].map(b => (
                  <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(244,240,234,0.55)", fontWeight: 600, fontFamily: "'Cairo', sans-serif" }}>{b.icon}{b.label}</div>
                ))}
              </div>
            </div>
            <div className="rd-hero-right" style={{ position: "relative", height: 460 }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.07 }}><Crown size={250} color="#c9a84c" /></div>
              {[
                { top: "8%", right: "4%", anim: "rdFloatA 6s infinite", icon: <Users size={18} color="#c9a84c" />, val: "500+", label: "عميل راضٍ" },
                { top: "42%", left: "-2%", anim: "rdFloatB 8.5s infinite", icon: <Star size={18} color="#c9a84c" fill="#c9a84c" />, val: "20+", label: "سنة خبرة" },
                { bottom: "12%", right: "8%", anim: "rdFloatA 7.5s infinite 1.2s", icon: <ShieldCheck size={18} color="#c9a84c" />, val: "100%", label: "ضمان الجودة" },
              ].map((card, i) => (
                <div key={i} className="rd-glass" style={{ position: "absolute", ...(card.top ? { top: card.top } : {}), ...(card.bottom ? { bottom: card.bottom } : {}), ...(card.right ? { right: card.right } : {}), ...(card.left ? { left: card.left } : {}), background: "rgba(244,240,234,0.04)", border: "1px solid rgba(201,168,76,0.18)", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, width: 195, animation: card.anim, boxShadow: "0 8px 32px rgba(201,168,76,0.08)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(201,168,76,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>{card.icon}</div>
                  <div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 22, color: "#c9a84c" }}>{card.val}</div>
                    <div style={{ fontSize: 11, color: "rgba(244,240,234,0.55)", fontFamily: "'Cairo', sans-serif", fontWeight: 600 }}>{card.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, opacity: 0.45, cursor: "pointer" }} onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}>
          <span style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#c9a84c", fontWeight: 700, fontFamily: "'Cairo', sans-serif" }}>اكتشف المزيد</span>
          <ChevronDown size={18} color="#c9a84c" style={{ animation: "rdBounce 2s infinite" }} />
        </div>
      </section>
      <main id="products" style={{ maxWidth: 860, margin: "0 auto", padding: "36px 24px", scrollMarginTop: 90 }}>

        {selectedItems.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: "'Cairo', sans-serif", fontSize: 11, color: textMuted, letterSpacing: 1 }}>
              <span>المنتجات المختارة</span>
              <span style={{ color: GOLD }}>{selectedItems.length} / {products.length}</span>
            </div>
            <div style={{ height: 3, background: surfaceBorder, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", background: GOLD, width: `${(selectedItems.length / products.length) * 100}%`, transition: "width 0.4s ease", borderRadius: 99 }} />
            </div>
          </div>
        )}

        {fetchError && (
          <div style={{ background: "rgba(229,115,115,0.12)", border: "1px solid #e57373", borderRadius: 10, padding: "14px 18px", marginBottom: 20, textAlign: "center" }}>
            <p style={{ color: "#e57373", fontSize: 13, fontFamily: "'Cairo', sans-serif", margin: 0 }}>⚠ {fetchError}</p>
          </div>
        )}

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 11, letterSpacing: 3, color: GOLD, textTransform: "uppercase", fontFamily: "'Cairo', sans-serif", marginBottom: 8 }}>خدماتنا</p>
          <h2 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 900, color: darkMode ? "#f4f0ea" : "#1a0a05", fontFamily: "'Cairo', sans-serif", margin: 0 }}>
            المنتجات <span style={{ color: GOLD }}>المميزة</span>
          </h2>
        </div>

        {errors.products && (
          <p style={{ textAlign: "center", color: "#c0392b", fontSize: 13, marginBottom: 16, fontFamily: "'Cairo', sans-serif" }}>⚠ {errors.products}</p>
        )}

        {loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ borderRadius: 18, overflow: "hidden", border: `1px solid ${surfaceBorder}`, background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)" }}>
                <div style={{ height: 180, background: `linear-gradient(90deg, ${inputBg} 25%, ${surface} 50%, ${inputBg} 75%)`, backgroundSize: "200% 100%", animation: "rdShimmer 1.4s ease infinite" }} />
                <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ height: 16, width: "60%", borderRadius: 6, background: inputBg }} />
                  <div style={{ height: 12, width: "40%", borderRadius: 6, background: inputBg }} />
                  <div style={{ height: 40, borderRadius: 6, background: inputBg }} />
                  <div style={{ height: 36, borderRadius: 999, background: inputBg, marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && stages.length > 1 && (
          <div
            style={{
              position: "sticky", top: isScrolled ? 64 : 84, zIndex: 40,
              display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap",
              marginBottom: 28, padding: "8px 12px", borderRadius: 999,
              background: darkMode ? "rgba(26,10,5,0.88)" : "rgba(255,255,255,0.88)",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              border: `1px solid ${surfaceBorder}`, boxShadow: "0 8px 28px rgba(26,10,5,0.1)",
            }}
          >
            {stages.map(s => {
              const count = products.filter(p => p.stage === s.number).length;
              const isActive = activeStage === s.number;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollToStage(s.number)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 16px", borderRadius: 999, border: "none",
                    background: isActive ? GOLD : "transparent",
                    color: isActive ? DARK : textMuted,
                    fontSize: 13, fontWeight: isActive ? 800 : 600,
                    fontFamily: "'Cairo', sans-serif", cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {s.title}
                  <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.75, background: isActive ? "rgba(26,10,5,0.12)" : (darkMode ? "rgba(255,255,255,0.08)" : "rgba(26,10,5,0.06)"), borderRadius: 999, padding: "1px 7px" }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {!loading && stages.map(section => {
          const sectionItems = products.filter(p => p.stage === section.number);
          return (
          <div key={section.id} id={`stage-${section.number}`} style={{ marginBottom: 40, scrollMarginTop: 150 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 20px" }}>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, ${BORDER_GOLD}, transparent)` }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: 2, fontFamily: "'Cairo', sans-serif", margin: 0, whiteSpace: "nowrap" }}>{section.title}</p>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${BORDER_GOLD}, transparent)` }} />
            </div>

            {sectionItems.length === 0 ? (
              <p style={{ textAlign: "center", color: textMuted, fontSize: 12, padding: "18px 0", fontFamily: "'Cairo', sans-serif" }}>لا توجد منتجات في هذا القسم بعد</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
                {sectionItems.map(p => {
                  const qty = getQty(p.id);
                  const isSelected = qty > 0;
                  const isHov = hovered === p.id;
                  const isAnim = animatingId === p.id;
                  const stagePalette: Record<number, { bg: string; text: string; border: string }> = {
                    1: { bg: "rgba(52,211,153,0.12)", text: "#34d399", border: "rgba(52,211,153,0.3)" },
                    2: { bg: "rgba(96,165,250,0.12)", text: "#60a5fa", border: "rgba(96,165,250,0.3)" },
                    3: { bg: "rgba(167,139,250,0.12)", text: "#a78bfa", border: "rgba(167,139,250,0.3)" },
                    4: { bg: "rgba(251,146,60,0.12)", text: "#fb923c", border: "rgba(251,146,60,0.3)" },
                  };
                  const sp = stagePalette[section.number] ?? stagePalette[2];
                  return (
                    <div
                      key={p.id}
                      onMouseEnter={() => { setHovered(p.id); prefetchProduct(p.id); }}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        border: isSelected ? `1.5px solid ${GOLD}` : isHov ? "1px solid rgba(201,168,76,0.45)" : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 18,
                        overflow: "hidden",
                        cursor: "default",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: isSelected ? "0 0 28px rgba(201,168,76,0.2)" : isHov ? "0 0 24px rgba(201,168,76,0.12)" : "0 4px 24px rgba(26,10,5,0.08)",
                        transform: isAnim ? "scale(1.02)" : isHov ? "translateY(-4px)" : "none",
                        transition: "transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
                      }}
                    >
                      {/* Image area */}
                      <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                        <img
                          src={p.image}
                          alt={p.name}
                          onError={(e) => { const t = e.target as HTMLImageElement; if (!t.dataset.err) { t.dataset.err = "1"; t.src = FALLBACK_IMG; } }}
                          onClick={(e) => { e.stopPropagation(); setSelectedProduct({ id: p.id, name: p.name, name_ar: p.nameAr, description: p.description, price: p.price, delivery_days: p.deliveryDays, badge: p.badge, image_url: p.image }); }}
                          style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in", transform: isHov ? "scale(1.07)" : "scale(1)", transition: "transform 0.6s ease", opacity: 1 }}
                        />
                        {/* Stage badge */}
                        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 2, display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700, border: `1px solid ${sp.border}`, background: sp.bg, color: sp.text, backdropFilter: "blur(8px)", fontFamily: "'Cairo', sans-serif" }}>
                          {section.title}
                        </div>
                        {isSelected && (
                          <div style={{ position: "absolute", top: 12, left: 12, zIndex: 2, background: GOLD, color: DARK, fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 999, fontFamily: "'Cairo', sans-serif" }}>✓ مختار</div>
                        )}
                        {p.badge && (
                          <div style={{ position: "absolute", bottom: 12, right: 12, zIndex: 2, background: GOLD, color: DARK, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 999, fontFamily: "'Cairo', sans-serif" }}>{p.badge}</div>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ padding: "18px 20px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <h3 style={{ fontSize: 18, fontWeight: 800, color: darkMode ? "#f4f0ea" : "#1a0a05", fontFamily: "'Cairo', sans-serif", margin: 0 }}>{p.name}</h3>
                          <span style={{ fontSize: 16, fontWeight: 800, color: GOLD, fontFamily: "'Outfit', sans-serif", whiteSpace: "nowrap", marginRight: 8 }}>
                            {p.price.toLocaleString("ar-IQ")} <span style={{ fontSize: 11, color: textMuted }}>د.ع</span>
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: textMuted, fontFamily: "'Cairo', sans-serif", marginBottom: 8 }}>{p.nameAr}</p>
                        <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.7, marginBottom: 12, fontFamily: "'Cairo', sans-serif", minHeight: 40 }}>{p.description}</p>

                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: textMuted, fontFamily: "'Cairo', sans-serif", marginBottom: 16 }}>
                          <Clock size={13} color={GOLD} />
                          <span>مدة التسليم: {p.deliveryDays}</span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "rgba(26,10,5,0.08)"}` }}>
                          {isSelected ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 0, background: darkMode ? "rgba(0,0,0,0.4)" : "rgba(26,10,5,0.07)", borderRadius: 999, padding: "3px", border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(26,10,5,0.08)"}` }}>
                              <button onClick={(e) => { e.stopPropagation(); setQty(p.id, qty - 1); }} style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(26,10,5,0.06)", border: "none", cursor: "pointer", color: darkMode ? "#f4f0ea" : "#1a0a05" }}>
                                <Minus size={13} />
                              </button>
                              <span style={{ width: 28, textAlign: "center", fontSize: 14, fontWeight: 700, color: darkMode ? "#f4f0ea" : "#1a0a05", fontFamily: "'Outfit', sans-serif" }}>{qty}</span>
                              <button onClick={(e) => { e.stopPropagation(); setQty(p.id, qty + 1); }} style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(26,10,5,0.06)", border: "none", cursor: "pointer", color: darkMode ? "#f4f0ea" : "#1a0a05" }}>
                                <Plus size={13} />
                              </button>
                            </div>
                          ) : (
                            <div />
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleProduct(p.id); }}
                            style={{ display: "flex", alignItems: "center", gap: 6, background: GOLD, color: DARK, padding: "9px 18px", borderRadius: 999, fontWeight: 800, fontSize: 13, border: "none", fontFamily: "'Cairo', sans-serif", cursor: "pointer", boxShadow: isHov ? "0 0 14px rgba(201,168,76,0.4)" : "none", transition: "box-shadow 0.3s" }}
                          >
                            <Plus size={14} />
                            {isSelected ? "تعديل" : "أضف"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          );
        })}

        {/* Order Form */}
        {products.length > 0 && (
          <div className="rd-order-form" style={{ marginTop: 40, padding: "32px", background: surface, border: `0.5px solid ${surfaceBorder}`, borderRadius: 16 }}>
            <p style={{ fontSize: 11, letterSpacing: 3, color: GOLD, marginBottom: 24, textTransform: "uppercase", fontFamily: "'Cairo', sans-serif" }}>بيانات الطلب</p>

            <Field label="الاسم الكريم" error={errors.name} textMuted={textMuted}>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="أدخل اسمك" style={iStyle(inputBg, textPrimary, surfaceBorder)} />
            </Field>

            <Field label="رقم الهاتف" error={errors.phone} textMuted={textMuted}>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07XX XXX XXXX" dir="ltr" style={iStyle(inputBg, textPrimary, surfaceBorder)} />
            </Field>

            <Field label="ملاحظات إضافية (اختياري)" textMuted={textMuted}>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="أي ملاحظات أو تعليمات خاصة..." rows={3} style={{ ...iStyle(inputBg, textPrimary, surfaceBorder), resize: "vertical" as const }} />
            </Field>

            {selectedItems.length > 0 && (
              <div style={{ background: darkMode ? DARK2 : "#f9f5f0", borderRadius: 10, padding: "14px 18px", marginBottom: 20, border: `0.5px solid ${surfaceBorder}` }}>
                <p style={{ fontSize: 11, letterSpacing: 2, color: GOLD, marginBottom: 10, textTransform: "uppercase", fontFamily: "'Cairo', sans-serif" }}>ملخص الطلب</p>
                {selectedItems.map(item => {
                  const p = products.find(pr => pr.id === item.productId)!;
                  return (
                    <div key={item.productId} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `0.5px solid ${surfaceBorder}` }}>
                      <span style={{ fontSize: 12, color: textPrimary, fontFamily: "'Cairo', sans-serif" }}>{p?.nameAr} × {item.quantity}</span>
                      <span style={{ fontSize: 12, color: GOLD, fontFamily: "'Cairo', sans-serif" }}>{((p?.price || 0) * item.quantity).toLocaleString("ar-IQ")} د.ع</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: textPrimary, fontFamily: "'Cairo', sans-serif" }}>الإجمالي</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: GOLD, fontFamily: "'Cairo', sans-serif" }}>{total.toLocaleString("ar-IQ")} د.ع</span>
                </div>
              </div>
            )}

            <div className="rd-form-actions" style={{ display: "flex", gap: 10 }}>
              {selectedItems.length > 0 && (
                <button onClick={clearAll} style={{ padding: "12px 20px", background: "transparent", border: `0.5px solid ${surfaceBorder}`, borderRadius: 8, color: textMuted, fontSize: 13, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                  مسح الكل
                </button>
              )}
              <button
                onClick={submitOrder}
                style={{ flex: 1, padding: "13px 0", background: DARK, color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'Cairo', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <WhatsAppIcon /> إرسال الطلب
              </button>
            </div>
          </div>
        )}

        {/* Testimonials */}
        {(testimonials.length > 0 || true) && (
          <div style={{ marginTop: 56 }}>
            <p style={{ fontSize: 11, letterSpacing: 3, color: GOLD, textAlign: "center", marginBottom: 24, textTransform: "uppercase", fontFamily: "'Cairo', sans-serif" }}>آراء عملائنا</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {(testimonials.length > 0 ? testimonials : [
                { text: "جودة تفوق التوقعات في كل مرة، مختبر يستحق الثقة." },
                { text: "التسليم دائماً في الوقت المحدد والدقة لا تُضاهى." },
                { text: "احترافية عالية وخامات ممتازة، تعامل مميز من البداية للنهاية." },
              ]).map((t, i) => (
                <div key={i} style={{ background: surface, border: `0.5px solid ${surfaceBorder}`, borderRadius: 10, padding: "18px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.8, fontFamily: "'Cairo', sans-serif", fontStyle: "italic" }}>"{t.text}"</p>
                  {(t as any).author && <p style={{ fontSize: 10, color: GOLD, marginTop: 8, letterSpacing: 1 }}>— {(t as any).author}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
      {/* Footer */}
      <footer style={{ background: "#0d0502", borderTop: "1px solid rgba(201,168,76,0.15)", padding: "48px 24px 28px", fontFamily: "'Cairo', sans-serif", direction: "rtl" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 36, marginBottom: 36 }}>
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid #c9a84c", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(201,168,76,0.1)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#c9a84c"><path d="M2 18h20l-2-10-5 4-3-7-3 7-5-4z"/></svg>
                </div>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: "0.12em", color: "#c9a84c" }}>ROYAL DENTURE</span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(244,240,234,0.4)", lineHeight: 1.9, maxWidth: 220 }}>مختبر أسنان متخصص يقدم أعلى معايير الجودة بدقة لا تُضاهى </p>
            </div>

            {/* Quick links */}
            <div>
              <p style={{ fontSize: 11, letterSpacing: 2, color: "#c9a84c", textTransform: "uppercase", marginBottom: 16, fontWeight: 700 }}>روابط سريعة</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="#products" style={{ color: "rgba(244,240,234,0.5)", fontSize: 13, textDecoration: "none" }}>خدماتنا</a>
                <Link to="/track" style={{ color: "rgba(244,240,234,0.5)", fontSize: 13, textDecoration: "none" }}>تتبع طلبي</Link>
                <a href="#products" style={{ color: "rgba(244,240,234,0.5)", fontSize: 13, textDecoration: "none" }}>اطلب الآن</a>
              </div>
            </div>

            {/* Contact */}
            <div>
              <p style={{ fontSize: 11, letterSpacing: 2, color: "#c9a84c", textTransform: "uppercase", marginBottom: 16, fontWeight: 700 }}>تواصل معنا</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {whatsappNumber && (
                  <a href={`https://wa.me/${whatsappNumber.replace(/[^\d]/g,"")}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(244,240,234,0.5)", fontSize: 13, textDecoration: "none" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#25d366"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Zm5.2 14.1c-.22.62-1.3 1.18-1.8 1.22-.46.04-.88.22-2.98-.62-2.52-1.02-4.14-3.6-4.26-3.76-.12-.16-.98-1.3-.98-2.48 0-1.18.62-1.76.84-2 .22-.24.48-.3.64-.3l.46.008c.148.006.346-.056.54.412l.696 1.836c.06.154.1.334.002.526-.1.194-.15.314-.3.482-.15.168-.316.374-.452.502-.148.14-.302.292-.13.572.172.28.764 1.258 1.638 2.036 1.126 1.002 2.074 1.312 2.354 1.46.28.148.444.124.608-.074.164-.198.7-.816.886-1.096.186-.28.372-.232.628-.14.256.09 1.626.766 1.906.906.28.14.466.21.534.326.068.114.068.664-.152 1.286Z"/></svg>
                    واتساب
                  </a>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(244,240,234,0.5)", fontSize: 13 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.6)" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  العراق
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ paddingTop: 20, borderTop: "1px solid rgba(201,168,76,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <p style={{ fontSize: 11, color: "rgba(244,240,234,0.2)", margin: 0 }}>© {new Date().getFullYear()} ROYAL DENTURE — جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>
      {/* Order Preview Modal */}
      {showPreview && (
        <div onClick={() => setShowPreview(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: surface, border: `1px solid ${surfaceBorder}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto" }}>
            <h2 style={{ color: GOLD, margin: "0 0 16px", fontSize: 20, fontFamily: "serif", textAlign: "center" }}>مراجعة الطلب</h2>

            {selectedItems.map(item => {
              const p = products.find(pr => pr.id === item.productId)!;
              return (
                <div key={item.productId} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `0.5px solid ${surfaceBorder}` }}>
                  <span style={{ fontSize: 13, color: textPrimary, fontFamily: "'Cairo', sans-serif" }}>{p?.nameAr} × {item.quantity}</span>
                  <span style={{ fontSize: 13, color: GOLD, fontFamily: "'Cairo', sans-serif" }}>{((p?.price || 0) * item.quantity).toLocaleString("ar-IQ")} د.ع</span>
                </div>
              );
            })}

            <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderTop: `1px solid ${surfaceBorder}`, marginTop: 4, marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: textPrimary, fontFamily: "'Cairo', sans-serif" }}>الإجمالي</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: GOLD, fontFamily: "'Cairo', sans-serif" }}>{total.toLocaleString("ar-IQ")} د.ع</span>
            </div>

            <div style={{ background: darkMode ? DARK2 : "#f9f5f0", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: textMuted, fontFamily: "'Cairo', sans-serif", lineHeight: 1.9 }}>
              <p>👤 {name}</p>
              <p>📱 {phone}</p>
              {notes.trim() && <p>📝 {notes}</p>}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowPreview(false)} style={{ flex: 1, padding: "12px", background: "transparent", border: `0.5px solid ${surfaceBorder}`, borderRadius: 8, color: textMuted, fontSize: 13, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>
                تعديل
              </button>
              <button onClick={confirmOrder} style={{ flex: 2, padding: "12px", background: DARK, color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Cairo', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <WhatsAppIcon /> تأكيد وإرسال
              </button>
            </div>
          </div>
        </div>
      )}
      <ImageLightbox product={selectedProduct} onClose={() => setSelectedProduct(null)} darkMode={darkMode} />
    </div>
  );
}

function Field({ label, error, children, textMuted }: { label: string; error?: string; children: React.ReactNode; textMuted: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, letterSpacing: 1.5, color: textMuted, textTransform: "uppercase" as const, marginBottom: 7, fontFamily: "'Cairo', sans-serif" }}>{label}</label>
      {children}
      {error && <p style={{ fontSize: 12, color: "#c0392b", marginTop: 4, fontFamily: "'Cairo', sans-serif" }}>{error}</p>}
    </div>
  );
}

function iStyle(bg: string, color: string, border: string): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 14px",
    border: `0.5px solid ${border}`,
    borderRadius: 8,
    background: bg,
    color,
    fontSize: 14,
    fontFamily: "'Cairo', sans-serif",
    outline: "none",
    boxSizing: "border-box",
    textAlign: "right",
    direction: "rtl"
  };
}

function CrownIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M2 19h20M3 19l2-10 4 5 3-8 3 8 4-5 2 10" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Zm5.2 14.1c-.22.62-1.3 1.18-1.8 1.22-.46.04-.88.22-2.98-.62-2.52-1.02-4.14-3.6-4.26-3.76-.12-.16-.98-1.3-.98-2.48 0-1.18.62-1.76.84-2 .22-.24.48-.3.64-.3l.46.008c.148.006.346-.056.54.412l.696 1.836c.06.154.1.334.002.526-.1.194-.15.314-.3.482-.15.168-.316.374-.452.502-.148.14-.302.292-.13.572.172.28.764 1.258 1.638 2.036 1.126 1.002 2.074 1.312 2.354 1.46.28.148.444.124.608-.074.164-.198.7-.816.886-1.096.186-.28.372-.232.628-.14.256.09 1.626.766 1.906.906.28.14.466.21.534.326.068.114.068.664-.152 1.286Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  );
}
