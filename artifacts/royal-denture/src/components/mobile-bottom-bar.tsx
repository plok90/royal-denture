import { useLocation, useNavigate } from "react-router-dom"
import { Home, LayoutGrid, ShoppingBag, PackageSearch, User } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useAdmin } from "@/lib/admin-context"

const GOLD = "#c9a84c"

function BarItem({
  icon, label, active, badge, onClick,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  badge?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-transform active:scale-90"
      aria-label={label}
    >
      <span className="relative" style={{ color: active ? GOLD : "#8a7060" }}>
        {icon}
        {badge !== undefined && badge > 0 && (
          <span
            className="absolute -top-1.5 -left-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-[#1a0a05]"
            style={{ background: GOLD }}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span className="text-[10px] font-semibold" style={{ color: active ? GOLD : "#8a7060" }}>
        {label}
      </span>
      {active && <span className="absolute bottom-0 h-[2.5px] w-8 rounded-full" style={{ background: GOLD }} />}
    </button>
  )
}

export function MobileBottomBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { count, setOpen } = useCart()
  const { isAdmin, setShowLoginModal } = useAdmin()

  const onHome = location.pathname === "/"

  const goProducts = () => {
    if (onHome) {
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })
    } else {
      navigate("/")
      setTimeout(() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }), 150)
    }
  }

  const goAdmin = () => {
    if (isAdmin) navigate("/admin")
    else setShowLoginModal(true)
  }

  return (
    <nav
      dir="rtl"
      aria-label="شريط التنقل السفلي"
      className="fixed bottom-0 left-0 right-0 z-[60] flex items-stretch border-t border-[#ddd5c8] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden dark:border-[#3a1f10] dark:bg-[#120805]/95"
    >
      <BarItem icon={<Home size={22} strokeWidth={onHome ? 2.4 : 1.8} />} label="الرئيسية" active={onHome} onClick={() => navigate("/")} />
      <BarItem icon={<LayoutGrid size={22} strokeWidth={1.8} />} label="المنتجات" onClick={goProducts} />
      <BarItem icon={<ShoppingBag size={22} strokeWidth={1.8} />} label="السلة" badge={count} onClick={() => setOpen(true)} />
      <BarItem
        icon={<PackageSearch size={22} strokeWidth={1.8} />}
        label="تتبع"
        active={location.pathname === "/track"}
        onClick={() => navigate("/track")}
      />
      <BarItem
        icon={<User size={22} strokeWidth={1.8} />}
        label={isAdmin ? "إدارة" : "حساب"}
        active={location.pathname === "/admin"}
        onClick={goAdmin}
      />
    </nav>
  )
}
