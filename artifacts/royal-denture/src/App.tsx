import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AdminProvider } from "@/lib/admin-context";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { AdminLoginModal } from "@/components/admin-login-modal";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { MobileBottomBar } from "@/components/mobile-bottom-bar";
import { track } from "@/lib/analytics";
import Home from "@/pages/home";

const AdminPage = lazy(() => import("@/pages/admin"));
const TrackPage = lazy(() => import("@/pages/track"));
const ProductDetail = lazy(() => import("@/pages/product-detail"));
const NotFound = lazy(() => import("@/pages/not-found"));
const CartDrawer = lazy(() => import("@/components/cart-drawer").then((m) => ({ default: m.CartDrawer })));

function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    track("page_view", { page_path: location.pathname });
  }, [location.pathname]);
  return null;
}

function AppChrome({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { darkMode } = useTheme();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <DesktopSidebar />}
      {!isAdminRoute && <MobileBottomBar />}
      <div
        className={isAdminRoute ? "" : "lg:pr-[76px] pb-16 lg:pb-0"}
        style={{ minHeight: "100vh" }}
      >
        {children}
      </div>
      <Suspense fallback={null}>
        <CartDrawer />
      </Suspense>
      <AdminLoginModal />
      <Toaster
        position="top-center"
        theme={darkMode ? "dark" : "light"}
        richColors
        closeButton
        dir="rtl"
      />
    </>
  );
}

function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <CartProvider>
          <AdminProvider>
            <BrowserRouter basename={base}>
              <RouteTracker />
              <AppChrome>
                <Suspense
                  fallback={
                    <div
                      style={{
                        minHeight: "60vh",
                        display: "grid",
                        placeItems: "center",
                        color: "#c9a84c",
                        fontFamily: "'Cairo', sans-serif",
                      }}
                    >
                      جارٍ التحميل…
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/track" element={<TrackPage />} />
                    <Route path="/products/:slug" element={<ProductDetail />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </AppChrome>
            </BrowserRouter>
          </AdminProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
