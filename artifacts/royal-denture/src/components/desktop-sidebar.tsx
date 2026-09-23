import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Home, LayoutGrid, ShoppingBag, PackageSearch, ShieldCheck, Moon, Sun } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useTheme } from "@/lib/theme-context"
import { useAdmin } from "@/lib/admin-context"

const GOLD = "#c9a84c"

function NavItem({
  icon, label, active, badge, onClick, dark,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  badge?: number
  dark: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group/item relative flex w-full items-center gap-4 rounded-xl px-3 py-3.5 text-right transition-colors"
      style={{ background: "transparent", color: dark ? "#f5efe6" : "#1a0a05" }}
      title={label}
      onMouseEnter={(e) => { e.currentTarget.style.background = dark ? "rgba(255,255,255,0.08)" : "rgba(26,10,5,0.05)" }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
    >
      <span
        className="relative flex h-6 w-6 shrink-0 items-center justify-center transition-transform group-hover/item:scale-110"
        style={{ color: active ? GOLD : "currentColor" }}
      >
        {icon}
        {badge !== undefined && badge > 0 && (
          <span
            className="absolute -top-2 -left-2.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-[#1a0a05]"
            style={{ background: GOLD }}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span
        className="whitespace-nowrap text-[15px] font-semibold opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100"
        style={{ color: active ? GOLD : "inherit" }}
      >
        {label}
      </span>
      {active && <span className="absolute right-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-l-full" style={{ background: GOLD }} />}
    </button>
  )
}

export function DesktopSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { count, setOpen } = useCart()
  const { darkMode, toggleDark } = useTheme()
  const { isAdmin, setShowLoginModal } = useAdmin()
  const [isScrolled, setIsScrolled] = useState(false)

  const onHome = location.pathname === "/"

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const goProducts = () => {
    if (onHome) {
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })
    } else {
      navigate("/#products")
      setTimeout(() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }), 120)
    }
  }

  const goAdmin = () => {
    if (isAdmin) navigate("/admin")
    else setShowLoginModal(true)
  }

  // Same colors as the page header:
  // - top of home (over dark hero) → dark
  // - after scroll → theme solid (light cream / dark) with blur + gold border
  const heroTop = onHome && !isScrolled
  const dark = heroTop || darkMode
  const bg = dark ? "rgba(26,10,5,0.97)" : "rgba(250,247,244,0.97)"
  const borderColor = isScrolled || heroTop ? "rgba(201,168,76,0.2)" : (darkMode ? "#3a1f10" : "#ddd5c8")
  const blur = isScrolled || heroTop ? "blur(14px)" : "none"

  return (
    <aside
      className="group/sidebar fixed right-0 top-0 z-[60] hidden h-full w-[76px] overflow-hidden transition-[width,background,border-color] duration-300 ease-out hover:w-[245px] lg:flex lg:flex-col"
      style={{
        background: bg,
        backdropFilter: blur,
        WebkitBackdropFilter: blur,
        borderLeft: `1px solid ${borderColor}`,
        color: dark ? "#f5efe6" : "#1a0a05",
        transition: "width 0.3s ease, background 0.45s ease, border-color 0.45s ease",
      }}
      dir="rtl"
      aria-label="القائمة الرئيسية"
    >
      <div
        className="flex items-center gap-3 px-4 py-6 pb-4 transition-all"
        style={{
          borderBottom: isScrolled ? "1px solid rgba(201,168,76,0.2)" : "1px solid transparent",
        }}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm ring-1 ring-[#c9a84c]/40">
          <img src="/logo.png" alt="Royal Denture" className="h-full w-full object-cover" />
        </div>
        <span
          className="whitespace-nowrap text-[15px] font-black tracking-[0.14em] text-[#c9a84c] opacity-0 transition-opacity group-hover/sidebar:opacity-100"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          ROYAL
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2">
        <NavItem
          icon={<Home size={23} strokeWidth={onHome ? 2.4 : 1.8} />}
          label="الرئيسية"
          active={onHome}
          dark={dark}
          onClick={() => navigate("/")}
        />
        <NavItem icon={<LayoutGrid size={23} strokeWidth={1.8} />} label="المنتجات" dark={dark} onClick={goProducts} />
        <NavItem
          icon={<ShoppingBag size={23} strokeWidth={1.8} />}
          label="السلة"
          badge={count}
          dark={dark}
          onClick={() => setOpen(true)}
        />
        <NavItem
          icon={<PackageSearch size={23} strokeWidth={1.8} />}
          label="تتبع الطلب"
          active={location.pathname === "/track"}
          dark={dark}
          onClick={() => navigate("/track")}
        />
        <NavItem
          icon={<ShieldCheck size={23} strokeWidth={1.8} />}
          label={isAdmin ? "لوحة التحكم" : "دخول الإدارة"}
          active={location.pathname === "/admin"}
          dark={dark}
          onClick={goAdmin}
        />
      </nav>

      <div
        className="px-2 py-3"
        style={{
          borderTop: `1px solid ${isScrolled ? "rgba(201,168,76,0.2)" : borderColor}`,
          color: dark ? "#f5efe6" : "#1a0a05",
        }}
      >
        <NavItem
          icon={darkMode ? <Sun size={22} strokeWidth={1.8} /> : <Moon size={22} strokeWidth={1.8} />}
          label={darkMode ? "الوضع الصبحي" : "الوضع الليلي"}
          dark={dark}
          onClick={toggleDark}
        />
      </div>
    </aside>
  )
}
