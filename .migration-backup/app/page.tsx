"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ImageLightbox } from "@/components/image-lightbox";
import { saveOrder } from "@/lib/order";
import { useAdmin } from "@/lib/admin-context";
import { AdminLoginModal } from "@/components/admin-login-modal";


// ─── Constants ────────────────────────────────────────────────


const GOLD = "#c9a84c";

const DARK = "#1a0a05";

const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%233a1f10" width="400" height="300"/%3E%3C/svg%3E';
const BLUR_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIj48cmVjdCBmaWxsPSIjMjUxMjA4IiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIvPjwvc3ZnPg==";

const DARK2 = "#251208";

const BORDER_GOLD = "#3a1f10";

const CREAM = "#f4f0ea";

const CREAM2 = "#faf7f4";

const BORDER_LIGHT = "#ddd5c8";

const MUTED = "#9a8878";




// ─── Types ────────────────────────────────────────────────────

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




interface OrderItem {

  productId: string;

  quantity: number;

}




interface FormErrors {

  name?: string;

  phone?: string;

  products?: string;

}




// Products are loaded from backend at runtime (see useEffect inside App).




const TESTIMONIALS = [

  { text: "جودة تفوق التوقعات في كل مرة، مختبر يستحق الثقة." },

  { text: "التسليم دائماً في الوقت المحدد والدقة لا تُضاهى." },

  { text: "احترافية عالية وخامات ممتازة، تعامل مميز من البداية للنهاية." },

];




// ─── Main Component ───────────────────────────────────────────

export default function App() {
  const { isAdmin, showLoginModal, setShowLoginModal } = useAdmin();

  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const [name, setName] = useState(() => {

    try { return localStorage.getItem("rd_name") || ""; } catch { return ""; }

  });

  const [phone, setPhone] = useState(() => {

    try { return localStorage.getItem("rd_phone") || ""; } catch { return ""; }

  });

  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});

  const [darkMode, setDarkMode] = useState(false);

  const [showPreview, setShowPreview] = useState(false);

  const [showMenu, setShowMenu] = useState(false);

  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const [hovered, setHovered] = useState<string | null>(null);

  const [submitHover, setSubmitHover] = useState(false);

  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [testimonials, setTestimonials] = useState<{text: string; author?: string}[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState(() => { try { return localStorage.getItem("rd_whatsapp") || "9647766463735"; } catch { return "9647766463735"; } });
  const [siteTitle, setSiteTitle] = useState("ROYAL DENTURE");
  const [siteSubtitle, setSiteSubtitle] = useState("مختبر الأسنان الملكي");
  const [siteTagline, setSiteTagline] = useState("اختر ما يناسبك والباقي علينا");




  useEffect(() => {

    try { localStorage.setItem("rd_name", name); } catch { /* ignore */ }

  }, [name]);

  useEffect(() => {

    try { localStorage.setItem("rd_phone", phone); } catch { /* ignore */ }

  }, [phone]);

  useEffect(() => {
    try { const saved = localStorage.getItem("rd_cart"); if (saved) setOrderItems(JSON.parse(saved)); } catch { /* ignore */ }
  }, []);

  useEffect(() => {

    try { localStorage.setItem("rd_cart", JSON.stringify(orderItems)); } catch { /* ignore */ }

  }, [orderItems]);

  

  useEffect(() => {

    document.body.style.margin = "0";

    document.body.style.padding = "0";

    document.documentElement.style.margin = "0";

    document.documentElement.style.padding = "0";

  }, []);

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      if (!supabase) { setFetchError("لم يتم تهيئة قاعدة البيانات"); return; }
      const [productsRes, testimonialsRes, settingsRes] = await Promise.all([
        supabase.from("products").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
        supabase.from("testimonials").select("*").order("sort_order", { ascending: true }),
        supabase.from("admin_settings").select("*"),
      ]);
      if (productsRes.error) { setFetchError("فشل تحميل المنتجات، يرجى المحاولة لاحقاً"); return; }
      const mapped: Product[] = (productsRes.data || []).map((r: any) => ({
        id: r.slug,
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
      setFetchError(null);
      const addSlug = new URLSearchParams(window.location.search).get("add");
      if (addSlug) {
        const found = mapped.find((p: Product) => p.id === addSlug);
        if (found && getQty(found.id) === 0) {
          setOrderItems(prev => [...prev, { productId: found.id, quantity: 1 }]);
        }
        window.history.replaceState({}, "", "/");
      }
      if (!testimonialsRes.error && testimonialsRes.data?.length) {
        setTestimonials(testimonialsRes.data);
      }
      if (!settingsRes.error && settingsRes.data) {
        const map: Record<string, string> = {};
        (settingsRes.data as any[]).forEach(r => { map[r.key] = r.value; });
        if (map.whatsapp_number) { setWhatsappNumber(map.whatsapp_number); try { localStorage.setItem("rd_whatsapp", map.whatsapp_number); } catch {} }
        if (map.site_title) setSiteTitle(map.site_title);
        if (map.site_subtitle) setSiteSubtitle(map.site_subtitle);
        if (map.site_tagline) setSiteTagline(map.site_tagline);
      }
    })();
  }, []);




  const getQty = (id: string) => orderItems.find(i => i.productId === id)?.quantity || 0;




  const setQty = (id: string, qty: number) => {

    if (qty <= 0) {

      setOrderItems(prev => prev.filter(i => i.productId !== id));

    } else {

      setOrderItems(prev => {

        const exists = prev.find(i => i.productId === id);

        if (exists) return prev.map(i => i.productId === id ? { ...i, quantity: qty } : i);

        return [...prev, { productId: id, quantity: qty }];

      });

    }

  };




  const toggleProduct = (id: string) => {

    const qty = getQty(id);

    if (qty > 0) {

      setQty(id, 0);

    } else {

      setQty(id, 1);

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




  const submitOrder = () => {

    if (validate()) setShowPreview(true);

  };




  const confirmOrder = () => {

    const lines = selectedItems.map((item, i) => {

      const p = products.find(p => p.id === item.productId)!;

      return `${i + 1}. ${p.name} × ${item.quantity} — ${(p.price * item.quantity).toLocaleString("ar-IQ")} د.ع`;

    });

    let msg = `مرحباً Royal Denture 👑\n\nأرغب بطلب المنتجات التالية:\n\n${lines.join("\n")}\n\n`;

    msg += `💰 الإجمالي: ${total.toLocaleString("ar-IQ")} د.ع\n\n`;

    msg += `👤 الاسم: ${name}\n📱 الهاتف: ${phone}`;

    if (notes.trim()) msg += `\n\n📝 ملاحظات:\n${notes}`;

    msg += "\n\nشكراً لكم";

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");

    saveOrder(name, phone, notes, selectedItems.map(i => { const p = products.find(pp => pp.id === i.productId)!; return { product_id: i.productId, name: p.name, name_ar: p.nameAr, quantity: i.quantity, price: p.price }; }), total);

    setShowPreview(false);

  };




  const clearAll = () => {

    setOrderItems([]);

    setNotes("");

    setErrors({});

  };




  // Theme tokens

  const bg = darkMode ? "#0d0502" : CREAM;

  const surface = darkMode ? "#1a0a05" : "#fff";

  const surfaceBorder = darkMode ? BORDER_GOLD : BORDER_LIGHT;

  const textPrimary = darkMode ? "#f5efe6" : DARK;

  const textMuted = darkMode ? "#8a7060" : MUTED;

  const inputBg = darkMode ? DARK2 : CREAM2;

  const heroBg = darkMode ? "#0d0502" : DARK;




  return (

    <div style={{ 

      minHeight: "100vh", 

      width: "100vw",

      maxWidth: "100%",

      background: bg, 

      fontFamily: "'Cairo', sans-serif", 

      direction: "rtl", 

      transition: "background 0.3s",

      margin: 0,

      padding: 0,

      position: "absolute",

      top: 0,

      left: 0,

      right: 0

    }}>




      {/* Hero */}

      <header style={{ background: heroBg, borderBottom: `1px solid ${BORDER_GOLD}`, position: "relative" }}>

        <button
          onClick={() => setDarkMode(p => !p)}
          title={darkMode ? "الوضع الصبحي" : "الوضع الليلي"}
          style={{ position: "absolute", top: 16, left: 16, background: "transparent", border: `0.5px solid ${BORDER_GOLD}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: GOLD, fontSize: 16 }}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowMenu(p => !p)}
            title="القائمة"
            style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: `0.5px solid ${BORDER_GOLD}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: GOLD, fontSize: 16, zIndex: 10 }}
          >
            ☰
          </button>

          {showMenu && (
            <div style={{ position: "absolute", top: 52, right: 16, background: "#1a0a05", border: `0.5px solid ${BORDER_GOLD}`, borderRadius: 10, padding: 8, zIndex: 100, minWidth: 150, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <Link href="/track" onClick={() => setShowMenu(false)} style={{ display: "block", padding: "10px 12px", borderRadius: 6, color: GOLD, fontSize: 13, textDecoration: "none", fontFamily: "'Cairo', sans-serif" }}>
                📦 تتبع طلبي
              </Link>
              {isAdmin ? (
                <Link href="/admin" onClick={() => setShowMenu(false)} style={{ display: "block", padding: "10px 12px", borderRadius: 6, color: GOLD, fontSize: 13, textDecoration: "none", fontFamily: "'Cairo', sans-serif" }}>
                  🔒 إدارة
                </Link>
              ) : (
                <button onClick={() => { setShowMenu(false); setShowLoginModal(true); }} style={{ display: "block", padding: "10px 12px", borderRadius: 6, color: GOLD, fontSize: 13, textDecoration: "none", fontFamily: "'Cairo', sans-serif", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "right" }}>
                  🔒 إدارة
                </button>
              )}
            </div>
          )}

          {showMenu && <div onClick={() => setShowMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />}
        </div>

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 32px 40px", textAlign: "center" }}>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 10 }}>

            <CrownIcon style={{ color: GOLD, opacity: 0.6 }} />

            <span style={{ fontSize: 30, fontWeight: 400, color: "#f5efe6", letterSpacing: 5, fontFamily: "'Cairo', sans-serif" }}>{siteTitle}</span>

            <CrownIcon style={{ color: GOLD, opacity: 0.6 }} />

          </div>

          <p style={{ fontSize: 11, letterSpacing: 4, color: GOLD, textTransform: "uppercase", marginBottom: 14, fontFamily: "'Cairo', sans-serif" }}>{siteSubtitle}</p>

          <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: 160, margin: "0 auto 14px" }}>

            <div style={{ flex: 1, height: 0.5, background: BORDER_GOLD }} />

            <div style={{ width: 4, height: 4, borderRadius: "50%", background: GOLD }} />

            <div style={{ flex: 1, height: 0.5, background: BORDER_GOLD }} />

          </div>

          <p style={{ fontSize: 14, color: "#8a7060", letterSpacing: 1, fontFamily: "'Cairo', sans-serif" }}>{siteTagline}</p>

        </div>

      </header>




      <main style={{ maxWidth: 860, margin: "0 auto", padding: "36px 24px" }}>




        {/* Progress Bar */}

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

        <p style={{ fontSize: 11, letterSpacing: 3, color: GOLD, textAlign: "center", marginBottom: 20, textTransform: "uppercase", fontFamily: "'Cairo', sans-serif" }}>خدماتنا</p>

        {errors.products && (
          <p style={{ textAlign: "center", color: "#c0392b", fontSize: 13, marginBottom: 16, fontFamily: "'Cairo', sans-serif" }}>⚠ {errors.products}</p>
        )}

        {[
          { title: "المرحلة الثانية", items: products.filter(p => p.stage === 2) },
          { title: "المرحلة الثالثة", items: products.filter(p => p.stage === 3) },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 14px" }}>
              <div style={{ flex: 1, height: 0.5, background: surfaceBorder }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: 1.5, fontFamily: "'Cairo', sans-serif", margin: 0 }}>{section.title}</p>
              <div style={{ flex: 1, height: 0.5, background: surfaceBorder }} />
            </div>

            {section.items.length === 0 ? (
              <p style={{ textAlign: "center", color: textMuted, fontSize: 12, padding: "18px 0", fontFamily: "'Cairo', sans-serif" }}>لا توجد منتجات في هذا القسم بعد</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 }}>
                {section.items.map(p => {
                  const qty = getQty(p.id);
                  const isSelected = qty > 0;
                  const isHov = hovered === p.id;
                  const isAnim = animatingId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      onMouseEnter={() => setHovered(p.id)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        background: surface,
                        border: isSelected ? `1.5px solid ${GOLD}` : `0.5px solid ${isHov ? "#b8a898" : surfaceBorder}`,
                        borderRadius: 12,
                        overflow: "hidden",
                        cursor: "pointer",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: isSelected ? `0 4px 20px rgba(201,168,76,0.15)` : isHov ? "0 6px 24px rgba(26,10,5,0.1)" : "0 2px 12px rgba(26,10,5,0.05)",
                        transform: isAnim ? "scale(1.03)" : isHov ? "translateY(-3px)" : "none",
                        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
                      }}
                    >
                      {p.badge && (
                        <div style={{ position: "absolute", top: 10, right: 10, background: GOLD, color: DARK, fontSize: 9, fontWeight: 600, letterSpacing: 0.5, padding: "2px 8px", borderRadius: 20, fontFamily: "'Cairo', sans-serif", zIndex: 2 }}>
                          {p.badge}
                        </div>
                      )}
                      {isSelected && (
                        <div style={{ position: "absolute", top: 10, left: 10, background: GOLD, color: DARK, fontSize: 10, fontWeight: 600, letterSpacing: 1, padding: "3px 10px", borderRadius: 20, fontFamily: "'Cairo', sans-serif", zIndex: 2 }}>
                          ✓ مختار
                        </div>
                      )}
                      <div
                        style={{ height: 120, background: isSelected ? DARK2 : darkMode ? "#1a0a05" : "#f9f5f0", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: `0.5px solid ${isSelected ? BORDER_GOLD : surfaceBorder}`, transition: "background 0.2s", overflow: "hidden", position: "relative" }}
                      >
                        <Image fill src={p.image} alt={p.name} placeholder="blur" blurDataURL={BLUR_DATA_URL} onError={(e) => { const t = e.target as HTMLImageElement; if (!t.dataset.err) { t.dataset.err = "1"; t.src = FALLBACK_IMG; } }} onClick={(e) => { e.stopPropagation(); setSelectedProduct({ id: p.id, name: p.name, name_ar: p.nameAr, description: p.description, price: p.price, delivery_days: p.deliveryDays, badge: p.badge, image_url: p.image, sort_order: 0, created_at: "", updated_at: "" }); }} style={{ objectFit: "cover", cursor: "zoom-in" }} sizes="190px" />
                      </div>
                      <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: textPrimary, letterSpacing: 0.5, fontFamily: "'Cairo', sans-serif", marginBottom: 1 }}>{p.name}</p>
                        <p style={{ fontSize: 11, color: textMuted, fontFamily: "'Cairo', sans-serif", marginBottom: 6 }}>{p.nameAr}</p>
                        <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.65, marginBottom: 8, fontFamily: "'Cairo', sans-serif" }}>{p.description}</p>
                        <div style={{ display: "inline-flex", alignSelf: "flex-start", marginTop: "auto", alignItems: "center", gap: 4, background: darkMode ? "#251208" : "#f4f0ea", border: `0.5px solid ${surfaceBorder}`, borderRadius: 20, padding: "3px 8px", marginBottom: 10 }}>
                          <ClockIcon />
                          <span style={{ fontSize: 10, color: textMuted, fontFamily: "'Cairo', sans-serif" }}>{p.deliveryDays}</span>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: GOLD, marginBottom: 12, fontFamily: "'Cairo', sans-serif" }}>{p.price.toLocaleString("ar-IQ")} د.ع</p>
                        {isSelected ? (
                          <div style={{ display: "flex", alignItems: "center", border: `0.5px solid ${GOLD}`, borderRadius: 8, overflow: "hidden" }}>
                            <button onClick={(e) => { e.stopPropagation(); setQty(p.id, qty - 1); }} style={{ flex: 1, padding: "8px 0", background: "transparent", border: "none", color: GOLD, fontSize: 18, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>−</button>
                            <span style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 600, color: textPrimary, fontFamily: "'Cairo', sans-serif" }}>{qty}</span>
                            <button onClick={(e) => { e.stopPropagation(); setQty(p.id, qty + 1); }} style={{ flex: 1, padding: "8px 0", background: "transparent", border: "none", color: GOLD, fontSize: 18, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}>+</button>
                          </div>
                        ) : (
                          <button
                            style={{ width: "100%", padding: "9px 0", border: `0.5px solid ${surfaceBorder}`, borderRadius: 8, background: "transparent", color: textMuted, fontSize: 12, letterSpacing: 0.5, cursor: "pointer", fontFamily: "'Cairo', sans-serif" }}
                          >
                            إضافة إلى الطلب
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}




        {/* Summary Bar */}

        <div style={{ background: surface, border: `0.5px solid ${surfaceBorder}`, borderRadius: 12, padding: "18px 22px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>

          <div style={{ flex: 1, minWidth: 0 }}>

            <p style={{ fontSize: 11, letterSpacing: 2, color: textMuted, textTransform: "uppercase", marginBottom: 4, fontFamily: "'Cairo', sans-serif" }}>إجمالي الطلب</p>

            <p style={{ fontSize: 12, color: textMuted, fontFamily: "'Cairo', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>

              {selectedItems.length ? selectedItems.map(i => products.find(p => p.id === i.productId)?.nameAr).join(" · ") : "لم يتم اختيار أي منتج بعد"}

            </p>

          </div>

          <div style={{ textAlign: "left" }}>

            <p style={{ fontSize: 22, fontWeight: 600, color: GOLD, fontFamily: "'Cairo', sans-serif" }}>{total.toLocaleString("ar-IQ")} د.ع</p>

          </div>

          {selectedItems.length > 0 && (

            <button onClick={clearAll} style={{ padding: "6px 14px", background: "transparent", border: `0.5px solid ${surfaceBorder}`, borderRadius: 8, color: textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Cairo', sans-serif", letterSpacing: 0.5, whiteSpace: "nowrap" }}>

              امسح الكل

            </button>

          )}

        </div>




        {/* Order Form */}

        <div style={{ background: surface, border: `0.5px solid ${surfaceBorder}`, borderRadius: 12, padding: "28px" }}>

          <p style={{ fontSize: 11, letterSpacing: 3, color: GOLD, textTransform: "uppercase", textAlign: "center", marginBottom: 24, fontFamily: "'Cairo', sans-serif" }}>تفاصيل الطلب</p>




          <Field label=" " error={errors.name} textMuted={textMuted}>

            <input type="text" value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }} placeholder="اكتب اسمك الكامل هنا" style={iStyle(inputBg, textPrimary, errors.name ? "#c0392b" : surfaceBorder)} />

          </Field>




          <Field label="" error={errors.phone} textMuted={textMuted}>

            <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: undefined })); }} placeholder="رقم الهاتف" style={iStyle(inputBg, textPrimary, errors.phone ? "#c0392b" : surfaceBorder)} />

          </Field>




          <Field label=" " textMuted={textMuted}>

            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="أي تفاصيل اضافية...؟" rows={3} style={{ ...iStyle(inputBg, textPrimary, surfaceBorder), resize: "vertical" }} />

          </Field>




          <button

            onClick={submitOrder}

            onMouseEnter={() => setSubmitHover(true)}

            onMouseLeave={() => setSubmitHover(false)}

            style={{ width: "100%", padding: "14px 20px", background: submitHover ? GOLD : DARK, color: submitHover ? DARK : GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, fontSize: 14, letterSpacing: 2, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'Cairo', sans-serif", marginTop: 8, transition: "all 0.2s" }}

          >

            <WhatsAppIcon />

            <span> إرسال الطلب</span>

          </button>

        </div>




        {/* Testimonials */}

        <div style={{ marginTop: 40 }}>

          <p style={{ fontSize: 11, letterSpacing: 3, color: GOLD, textAlign: "center", marginBottom: 24, textTransform: "uppercase", fontFamily: "'Cairo', sans-serif" }}>ماذا يقولون عنّا</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>

            {((testimonials.length ? testimonials : TESTIMONIALS) as any[]).map((t, i) => (

              <div key={i} style={{ background: surface, border: `0.5px solid ${surfaceBorder}`, borderRadius: 12, padding: "20px" }}>

                <p style={{ fontSize: 28, color: GOLD, marginBottom: 8, lineHeight: 1, fontFamily: "'Cairo', serif" }}>"</p>

                <p style={{ fontSize: 13, color: textMuted, lineHeight: 1.7, fontFamily: "'Cairo', sans-serif" }}>{t.text}</p>

                {t.author && <p style={{ fontSize: 11, color: GOLD, marginTop: 8, fontFamily: "'Cairo', sans-serif" }}>— {t.author}</p>}

              </div>

            ))}

          </div>

        </div>

      </main>




      {/* Footer */}

      <footer style={{ background: heroBg, borderTop: `1px solid ${BORDER_GOLD}`, padding: "32px 24px", textAlign: "center" }}>

        <p style={{ fontSize: 12, color: GOLD, letterSpacing: 4, marginBottom: 10, fontFamily: "'Cairo', sans-serif" }}>ROYAL DENTURE</p>

        <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 16 }}>

          <a href="tel:+9647766463735" style={{ display: "flex", alignItems: "center", gap: 6, color: "#8a7060", fontSize: 13, textDecoration: "none", fontFamily: "'Cairo', sans-serif" }}>

            <PhoneIcon /> +964 776 646 3735

          </a>

          <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "#8a7060", fontSize: 13, textDecoration: "none", fontFamily: "'Cairo', sans-serif" }}>

            <WhatsAppIcon /> واتساب مباشر

          </a>

        </div>

<p style={{ fontSize: 10, color: "#4a3828", letterSpacing: 1, fontFamily: "'Cairo', sans-serif" }}>© 2024 ROYAL DENTURE — جميع الحقوق محفوظة</p>      </footer>




      {/* Preview Modal */}

      {showPreview && (

        <div

          onClick={e => { if (e.target === e.currentTarget) setShowPreview(false); }}

          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}

        >

          <div style={{ background: surface, borderRadius: 16, border: `1px solid ${BORDER_GOLD}`, padding: "32px", maxWidth: 460, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>

            <p style={{ fontSize: 11, letterSpacing: 3, color: GOLD, textTransform: "uppercase", textAlign: "center", marginBottom: 20, fontFamily: "'Cairo', sans-serif" }}>مراجعة الطلب</p>




            {selectedItems.map(item => {

              const p = products.find(p => p.id === item.productId)!;

              return (

                <div key={item.productId} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `0.5px solid ${surfaceBorder}` }}>

                  <span style={{ fontSize: 13, color: textPrimary, fontFamily: "'Cairo', sans-serif" }}>{p.nameAr} × {item.quantity}</span>

                  <span style={{ fontSize: 13, color: GOLD, fontFamily: "'Cairo', sans-serif" }}>{(p.price * item.quantity).toLocaleString("ar-IQ")} د.ع</span>

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
      <AdminLoginModal />

    </div>

  );

}




// ─── Sub-components ───────────────────────────────────────────

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




// ─── Icons ────────────────────────────────────────────────────

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




function PhoneIcon() {

  return (

    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">

      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.41 2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16l.92.92z" />

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
