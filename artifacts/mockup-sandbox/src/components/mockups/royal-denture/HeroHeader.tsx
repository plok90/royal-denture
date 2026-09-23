import React, { useEffect, useState } from "react";
import { Crown, Star, ShieldCheck, Users, ChevronDown, Menu, Phone, Sun, Moon } from "lucide-react";

export function HeroHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const theme = {
    bg: isDark ? "#1a0a05" : "#faf7f4",
    bgCard: isDark ? "rgba(244,240,234,0.04)" : "rgba(26,10,5,0.04)",
    border: isDark ? "rgba(201,168,76,0.18)" : "rgba(201,168,76,0.35)",
    text: isDark ? "#f4f0ea" : "#1a0a05",
    textMuted: isDark ? "rgba(244,240,234,0.65)" : "rgba(26,10,5,0.55)",
    navBg: isDark ? "rgba(26,10,5,0.88)" : "rgba(250,247,244,0.92)",
    glow: isDark ? "rgba(201,168,76,0.12)" : "rgba(201,168,76,0.18)",
    toggleBg: isDark ? "rgba(201,168,76,0.15)" : "rgba(201,168,76,0.12)",
  };

  return (
    <div
      dir="rtl"
      style={{ background: theme.bg, color: theme.text, fontFamily: "'Cairo', sans-serif", minHeight: "100dvh", position: "relative", overflowX: "hidden", transition: "background 0.4s ease, color 0.4s ease" }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Outfit:wght@400;700;900&display=swap');
        @keyframes floatA { 0%,100% { transform: translateY(0) scale(1); opacity: 0.35; } 50% { transform: translateY(-22px) scale(1.08); opacity: 0.65; } }
        @keyframes floatB { 0%,100% { transform: translateY(0) scale(1); opacity: 0.22; } 50% { transform: translateY(-30px) scale(0.92); opacity: 0.5; } }
        @keyframes shimmerText { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        @keyframes bounceDown { 0%,20%,50%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-9px); } 60% { transform: translateY(-4px); } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 14px rgba(201,168,76,0.22); } 50% { box-shadow: 0 0 32px rgba(201,168,76,0.5); } }
        @keyframes shimmerBtn { 0% { left: -80%; } 100% { left: 130%; } }
        .gold-text {
          background: linear-gradient(90deg, #e8d08c, #c9a84c, #a68430, #c9a84c, #e8d08c);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shimmerText 6s linear infinite;
        }
        .particle { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(201,168,76,0.7) 0%, rgba(201,168,76,0) 70%); pointer-events: none; }
        .luxury-btn { position: relative; overflow: hidden; transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .luxury-btn::after { content: ''; position: absolute; top: 0; left: -80%; width: 60%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent); transform: skewX(-20deg); animation: shimmerBtn 3.5s infinite; }
        .luxury-btn:hover { transform: translateY(-2px); }
        .glass-card { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); transition: background 0.4s ease, border-color 0.4s ease; }
        .toggle-btn { cursor: pointer; border: none; outline: none; transition: all 0.3s ease; }
        .toggle-btn:hover { transform: scale(1.08); }
      ` }} />

      {/* Background blobs */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "18%", right: "8%", width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, ${isDark ? "rgba(201,168,76,0.07)" : "rgba(201,168,76,0.1)"} 0%, transparent 70%)`, filter: "blur(60px)", transition: "background 0.4s" }} />
        <div style={{ position: "absolute", bottom: "15%", left: "6%", width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${isDark ? "rgba(201,168,76,0.05)" : "rgba(201,168,76,0.08)"} 0%, transparent 70%)`, filter: "blur(80px)", transition: "background 0.4s" }} />
        <div className="particle" style={{ width: 14, height: 14, top: "14%", right: "24%", animation: "floatA 7s infinite" }} />
        <div className="particle" style={{ width: 20, height: 20, top: "62%", right: "14%", animation: "floatB 9s infinite" }} />
        <div className="particle" style={{ width: 10, height: 10, top: "33%", left: "19%", animation: "floatA 6s infinite 1s" }} />
        <div className="particle" style={{ width: 16, height: 16, bottom: "22%", left: "28%", animation: "floatB 8s infinite 2s" }} />
      </div>

      {/* Navbar */}
      <header style={{
        position: "fixed", top: 0, width: "100%", zIndex: 50,
        background: isScrolled ? theme.navBg : "transparent",
        backdropFilter: isScrolled ? "blur(14px)" : "none",
        WebkitBackdropFilter: isScrolled ? "blur(14px)" : "none",
        borderBottom: isScrolled ? `1px solid ${theme.border}` : "none",
        padding: isScrolled ? "12px 0" : "22px 0",
        transition: "all 0.45s ease"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", border: "1.5px solid #c9a84c", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(201,168,76,0.12)" }}>
              <Crown size={22} color="#c9a84c" />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 18, letterSpacing: "0.12em", color: "#c9a84c" }}>ROYAL DENTURE</span>
              <span style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, letterSpacing: "0.04em" }}>مختبر الأسنان الملكي</span>
            </div>
          </div>

          {/* Desktop nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: 32, fontSize: 14, fontWeight: 600 }}>
            {["الرئيسية", "خدماتنا", "عن المختبر", "تتبع الطلب"].map(item => (
              <a key={item} href="#" style={{ color: theme.textMuted, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#c9a84c")}
                onMouseLeave={e => (e.currentTarget.style.color = theme.textMuted)}
              >{item}</a>
            ))}
          </nav>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Day/Night toggle */}
            <button
              className="toggle-btn"
              onClick={() => setIsDark(!isDark)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                background: theme.toggleBg,
                border: `1.5px solid ${theme.border}`,
                borderRadius: 24,
                padding: "6px 14px",
                color: "#c9a84c",
                fontSize: 13,
                fontFamily: "'Cairo', sans-serif",
                fontWeight: 600,
              }}
            >
              {isDark
                ? <><Sun size={15} color="#c9a84c" /><span>نهاري</span></>
                : <><Moon size={15} color="#c9a84c" /><span>ليلي</span></>
              }
            </button>

            <button className="luxury-btn" style={{
              background: "#c9a84c", color: "#1a0a05",
              padding: "9px 22px", borderRadius: 4, fontWeight: 800,
              fontSize: 13, border: "none", letterSpacing: "0.04em",
              fontFamily: "'Cairo', sans-serif", animation: "pulseGlow 3s infinite"
            }}>
              اطلب الآن
            </button>

            <button style={{ background: "none", border: "none", color: theme.text, cursor: "pointer" }}>
              <Menu size={26} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto", padding: "0 32px", minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 100, paddingBottom: 80 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>

          {/* Left: text */}
          <div style={{ display: "flex", flexDirection: "column", gap: 28, textAlign: "right" }}>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 18px", borderRadius: 999, border: `1px solid rgba(201,168,76,0.3)`, background: "rgba(201,168,76,0.09)", fontSize: 12, color: "#c9a84c", fontWeight: 700, width: "fit-content", alignSelf: "flex-end" }}>
              <Star size={13} fill="#c9a84c" color="#c9a84c" />
              <span>الخيار الأول لأطباء الأسنان</span>
            </div>

            {/* Headline */}
            <h1 style={{ fontSize: 68, fontWeight: 900, lineHeight: 1.25, margin: 0 }}>
              ابتسامة <span className="gold-text" style={{ display: "inline-block" }}>ملكية</span>
              <br />
              <span style={{ fontSize: 52 }}>دقة لا تُضاهى</span>
            </h1>

            <p style={{ fontSize: 17, lineHeight: 1.8, color: theme.textMuted, maxWidth: 440, margin: 0, marginRight: "auto" }}>
              اختر ما يناسبك والباقي علينا — نقدم أحدث تقنيات صناعة الأسنان مع ضمان الجودة العالية والالتزام بالمواعيد.
            </p>

            <div style={{ display: "flex", gap: 14, alignItems: "center", paddingTop: 8 }}>
              <button className="luxury-btn" style={{
                background: "#c9a84c", color: "#1a0a05",
                padding: "15px 36px", borderRadius: 4,
                fontWeight: 900, fontSize: 16, border: "none",
                fontFamily: "'Cairo', sans-serif",
              }}>
                ابدأ طلبك الآن
              </button>
              <button style={{
                background: "none",
                border: `1.5px solid ${theme.border}`,
                color: theme.text,
                padding: "14px 28px", borderRadius: 4,
                fontWeight: 700, fontSize: 15,
                fontFamily: "'Cairo', sans-serif",
                cursor: "pointer",
                transition: "background 0.2s",
              }}>
                تعرف على خدماتنا
              </button>
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", gap: 24, paddingTop: 12, borderTop: `1px solid ${theme.border}`, marginTop: 8 }}>
              {[
                { icon: <ShieldCheck size={16} color="#c9a84c" />, label: "ضمان الجودة" },
                { icon: <Star size={16} color="#c9a84c" fill="#c9a84c" />, label: "خبرة ٢٠+ سنة" },
                { icon: <Users size={16} color="#c9a84c" />, label: "٥٠٠+ عميل راضٍ" },
              ].map(b => (
                <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>
                  {b.icon}{b.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: floating stat cards */}
          <div style={{ position: "relative", height: 520, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Big faded crown */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.08 }}>
              <Crown size={280} color="#c9a84c" />
            </div>

            {/* Stat card 1 */}
            <div className="glass-card" style={{
              position: "absolute", top: "8%", right: "4%",
              background: theme.bgCard, border: `1px solid ${theme.border}`,
              borderRadius: 16, padding: "18px 22px",
              display: "flex", alignItems: "center", gap: 14, width: 210,
              animation: "floatA 6s infinite",
              boxShadow: `0 8px 32px ${theme.glow}`
            }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(201,168,76,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={20} color="#c9a84c" />
              </div>
              <div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 24, color: "#c9a84c" }}>500+</div>
                <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>عميل راضٍ</div>
              </div>
            </div>

            {/* Stat card 2 */}
            <div className="glass-card" style={{
              position: "absolute", top: "42%", left: "-4%",
              background: theme.bgCard, border: `1px solid ${theme.border}`,
              borderRadius: 16, padding: "18px 22px",
              display: "flex", alignItems: "center", gap: 14, width: 210,
              animation: "floatB 8.5s infinite",
              boxShadow: `0 8px 32px ${theme.glow}`
            }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(201,168,76,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Star size={20} color="#c9a84c" fill="#c9a84c" />
              </div>
              <div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 24, color: "#c9a84c" }}>20+</div>
                <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>سنة خبرة</div>
              </div>
            </div>

            {/* Stat card 3 */}
            <div className="glass-card" style={{
              position: "absolute", bottom: "14%", right: "8%",
              background: theme.bgCard, border: `1px solid ${theme.border}`,
              borderRadius: 16, padding: "18px 22px",
              display: "flex", alignItems: "center", gap: 14, width: 210,
              animation: "floatA 7.5s infinite 1.2s",
              boxShadow: `0 8px 32px ${theme.glow}`
            }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(201,168,76,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={20} color="#c9a84c" />
              </div>
              <div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 24, color: "#c9a84c" }}>100%</div>
                <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>ضمان الجودة</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: 0.5, cursor: "pointer" }}>
          <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#c9a84c", fontWeight: 700 }}>اكتشف المزيد</span>
          <ChevronDown size={20} color="#c9a84c" style={{ animation: "bounceDown 2s infinite" }} />
        </div>
      </main>
    </div>
  );
}
