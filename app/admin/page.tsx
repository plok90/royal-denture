"use client"

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useAdmin } from "@/lib/admin-context";
import { ConfirmModal } from "@/components/confirm-modal";
import { getLocalOrders, getSettingsOrders, removeLocalOrder, removeSettingsOrder, updateSettingsOrderStatus, updateSupabaseOrderAssignment, buildCompletionMessage, getCustomerData, getOrderStats, exportOrdersToHTML } from "@/lib/order";

// ─── Types ──────────────────────────────────────────────────────
interface Product {
  id: string;
  slug: string;
  name: string;
  name_ar: string;
  description: string;
  price: number;
  delivery_days: string;
  badge: string | null;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  stage: number;
}


// ─── Theme tokens ───────────────────────────────────────────────
let BG = "#0d0502";
let CARD = "#1a0a05";
const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%233a1f10" width="400" height="300"/%3E%3C/svg%3E';
const BLUR_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIj48cmVjdCBmaWxsPSIjMjUxMjA4IiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIvPjwvc3ZnPg==";
let CARD2 = "#251208";
let BORDER = "#3a1f10";
const GOLD = "#c9a84c";
let TEXT = "#f5efe6";
let MUTED = "#8a7060";
const RED = "#e57373";
const GREEN = "#7fc97f";
const FONT = "'Cairo', sans-serif";

// ─── Icons ──────────────────────────────────────────────────────
const ic = (d: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const CrownIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill={GOLD}><path d="M2 18h20l-2-10-5 4-3-7-3 7-5-4z"/></svg>;
const HomeIcon = () => ic("M3 11l9-8 9 8M5 10v10h14V10");
const PackageIcon = () => ic("M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12");

const LogoutIcon = () => ic("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9");
const DashboardIcon = () => ic("M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10");
const OrderIcon = () => ic("M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z M9 14l2 2 4-4");
const PlusIcon = () => ic("M12 5v14 M5 12h14");
const TrashIcon = () => ic("M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6");
const EditIcon = () => ic("M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z");
const UsersIcon = () => ic("M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75");
const EyeIcon = () => ic("M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z");
const EyeOffIcon = () => ic("M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94 M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19 m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22");
const XIcon = () => ic("M18 6L6 18 M6 6l12 12");
const SaveIcon = () => ic("M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8");

type Tab = "dashboard" | "products" | "orders" | "customers";
type Notif = { type: "success" | "error"; msg: string } | null;

const blankProduct: Omit<Product, "id"> = {
  slug: "", name: "", name_ar: "", description: "", price: 0,
  delivery_days: "", badge: "", image_url: "", sort_order: 0, is_active: true, stage: 2,
};


export default function Admin() {
  const router = useRouter();
  const { isAdmin, isInitialized, currentAdmin, isMainAdmin, logout: adminLogout, sessions, logoutSession } = useAdmin();
  const [darkMode, setDarkMode] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [activeStage, setActiveStage] = useState<2 | 3>(2);

  const [products, setProducts] = useState<Product[]>([]);

  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string | null>(null);

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<typeof blankProduct | null>(null);

  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: "product" | "order" } | null>(null);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [notif, setNotif] = useState<Notif>(null);
  const notifTimer = useRef<number | null>(null);

  // Auth guard
  useEffect(() => {
    if (!isInitialized) return; // wait for AdminProvider to check localStorage
    if (!isAdmin) { router.push("/"); return; }
    setAuthChecked(true);
    (async () => {
      await fetchData();
    })();
    return () => { if (notifTimer.current) window.clearTimeout(notifTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isInitialized]);

  function showNotification(type: "success" | "error", msg: string) {
    setNotif({ type, msg });
    if (notifTimer.current) window.clearTimeout(notifTimer.current);
    notifTimer.current = window.setTimeout(() => setNotif(null), 3000);
  }

  async function fetchData() {
    const supabase = createClient();
    if (!supabase) { setLoading(false); showNotification("error", "قاعدة البيانات غير مهيأة"); return; }
    setLoading(true);
    // One-time migration: update old "جديد" orders to "قيد المعالجة"
    if (typeof window !== "undefined" && !localStorage.getItem("rd_migrated_status")) {
      try { await supabase.from("orders").update({ status: "قيد المعالجة" }).eq("status", "جديد"); } catch {}
      localStorage.setItem("rd_migrated_status", "1");
    }
    const [p, o] = await Promise.all([
      supabase.from("products").select("*").order("sort_order", { ascending: true }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
    ]);
    if (!p.error) setProducts((p.data as Product[]) || []);
    if (!o.error) setOrders((o.data as any[]) || []);
    else {
      const fromSettings = await getSettingsOrders();
      setOrders(fromSettings.length ? fromSettings : getLocalOrders());
    }
    setLoading(false);
  }

  async function uploadImage(file: File): Promise<string | null> {
    const supabase = createClient();
    if (!supabase) { showNotification("error", "قاعدة البيانات غير مهيأة"); return null; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      return data.publicUrl;
    } catch (e: any) {
      showNotification("error", e.message);
      return null;
    } finally { setUploading(false); }
  }

  // Product CRUD
  async function saveProduct(p: Partial<Product>, isNew: boolean) {
    const supabase = createClient();
    if (!supabase) { showNotification("error", "قاعدة البيانات غير مهيأة"); return; }
    if (!p.name_ar || !p.slug) { showNotification("error", "الاسم العربي والمعرّف مطلوبان"); return; }
    setIsSaving(true);
    if (isNew) {
      const { error } = await supabase.from("products").insert([p as any]);
      if (error) showNotification("error", error.message);
      else { showNotification("success", "تمت الإضافة"); setNewProduct(null); }
    } else {
      const { id, ...rest } = p as Product;
      const { error } = await supabase.from("products").update(rest).eq("id", id);
      if (error) showNotification("error", error.message);
      else { showNotification("success", "تم الحفظ"); setEditProduct(null); }
    }
    setIsSaving(false);
    await fetchData();
  }
  async function deleteProduct(id: string) {
    setConfirmDelete({ id, type: "product" });
  }
  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    if (confirmDelete.type === "order") { await handleConfirmDeleteOrder(); return; }
    const supabase = createClient();
    if (!supabase) { showNotification("error", "قاعدة البيانات غير مهيأة"); setConfirmDelete(null); return; }
    const { error } = await supabase.from("products").delete().eq("id", confirmDelete.id);
    if (error) showNotification("error", error.message);
    else showNotification("success", "تم الحذف");
    setConfirmDelete(null);
    await fetchData();
  }
  async function toggleProductVisibility(p: Product) {
    const supabase = createClient();
    if (!supabase) { showNotification("error", "قاعدة البيانات غير مهيأة"); return; }
    const { error } = await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) showNotification("error", error.message);
    else showNotification("success", p.is_active ? "تم إخفاء المنتج" : "تم إظهار المنتج");
    await fetchData();
  }

  // Reorder (Drag & Drop)
  async function handleReorder(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;
    const supabase = createClient();
    if (!supabase) { showNotification("error", "قاعدة البيانات غير مهيأة"); return; }
    const dragged = products.find(p => p.id === draggedId);
    const target = products.find(p => p.id === targetId);
    if (!dragged || !target) return;
    const tempSort = dragged.sort_order;
    const { error: e1 } = await supabase.from("products").update({ sort_order: target.sort_order }).eq("id", draggedId);
    const { error: e2 } = await supabase.from("products").update({ sort_order: tempSort }).eq("id", targetId);
    if (e1 || e2) showNotification("error", "فشل إعادة الترتيب");
    else showNotification("success", "تم إعادة الترتيب");
    await fetchData();
  }

  async function updateOrderStatus(id: string, status: string) {
    if (status === "تم") {
      const order = orders.find(o => o.id === id);
      if (order) {
        let phone = order.customer_phone?.replace(/[^\d]/g, "");
        if (phone) {
          if (phone.startsWith("0")) phone = "964" + phone.slice(1);
          const msg = buildCompletionMessage(order.customer_name || "العميل", order.items || [], order.total || 0);
          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
        }
      }
    }
    const supabase = createClient();
    if (!supabase) { showNotification("error", "قاعدة البيانات غير مهيأة"); return; }
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      const local = getLocalOrders().map(o => o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o);
      localStorage.setItem("rd_orders_fallback", JSON.stringify(local));
      await updateSettingsOrderStatus(id, status);
    }
    showNotification("success", "تم تحديث الحالة");
    await fetchData();
  }

  async function deleteOrder(id: string) {
    setConfirmDelete({ id, type: "order" });
  }

  async function handleConfirmDeleteOrder() {
    if (!confirmDelete || confirmDelete.type !== "order") return;
    const id = confirmDelete.id;
    const supabase = createClient();
    if (supabase) {
      await supabase.from("orders").delete().eq("id", id);
    }
    removeLocalOrder(id);
    await removeSettingsOrder(id);
    setConfirmDelete(null);
    showNotification("success", "تم حذف الطلب");
    await fetchData();
  }

  async function completeOrder(o: any) {
    await updateOrderStatus(o.id, "تم");
  }

  async function updateOrderAssignment(id: string, assignedTo: string) {
    const supabase = createClient();
    if (!supabase) { showNotification("error", "قاعدة البيانات غير مهيأة"); return; }
    const { error } = await supabase.from("orders").update({ assigned_to: assignedTo }).eq("id", id);
    if (error) {
      await updateSupabaseOrderAssignment(id, assignedTo);
    }
    showNotification("success", "تم تحديث العامل");
    await fetchData();
  }

  async function logout() {
    adminLogout();
    router.push("/");
  }

  if (!authChecked) {
    return <div dir="rtl" style={{ minHeight: "100vh", background: BG, color: TEXT, display: "grid", placeItems: "center", fontFamily: FONT }}>جارٍ التحقق...</div>;
  }

  const stageFiltered = products.filter(p => p.stage === activeStage);
  const filteredProducts = searchQuery
    ? stageFiltered.filter(p => p.name_ar?.includes(searchQuery) || p.name?.includes(searchQuery))
    : stageFiltered;
  const stage2Count = products.filter(p => p.stage === 2).length;
  const stage3Count = products.filter(p => p.stage === 3).length;

  const light = !darkMode;
  BG = light ? "#f4f0ea" : "#0d0502";
  CARD = light ? "#ffffff" : "#1a0a05";
  CARD2 = light ? "#faf7f4" : "#251208";
  BORDER = light ? "#ddd5c8" : "#3a1f10";
  TEXT = light ? "#1a0a05" : "#f5efe6";
  MUTED = light ? "#9a8878" : "#8a7060";

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: FONT, display: "flex" }}>
      {/* Notification */}
      {notif && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: notif.type === "success" ? "rgba(127,201,127,0.15)" : "rgba(229,115,115,0.15)",
          border: `1px solid ${notif.type === "success" ? GREEN : RED}`,
          color: notif.type === "success" ? GREEN : RED,
          padding: "12px 24px", borderRadius: 10, zIndex: 200, fontSize: 14, fontWeight: 600,
          backdropFilter: "blur(8px)",
        }}>{notif.msg}</div>
      )}

      {/* Sidebar backdrop */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 49 }} />}

      {/* Sidebar overlay */}
      <aside style={{ width: 256, background: CARD, borderLeft: `1px solid ${BORDER}`, padding: "24px 18px", display: "flex", flexDirection: "column", gap: 6, position: "fixed", top: 0, right: 0, height: "100vh", zIndex: 50, transform: sidebarOpen ? "translateX(0)" : "translateX(100%)", transition: "transform 0.25s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 18, marginBottom: 14, borderBottom: `1px solid ${BORDER}` }}>
          <CrownIcon />
          <div>
            <div style={{ color: GOLD, fontSize: 16, fontWeight: 700, letterSpacing: 2, fontFamily: "serif" }}>ROYAL DENTURE</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 2, letterSpacing: 1 }}>لوحة التحكم</div>
            {currentAdmin && <div style={{ fontSize: 10, color: GOLD, marginTop: 2 }}>👤 {currentAdmin.name}</div>}
          </div>
        </div>

        <button
          onClick={() => { setDarkMode(p => !p); setSidebarOpen(false); }}
          title={darkMode ? "الوضع الصبحي" : "الوضع الليلي"}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: `0.5px solid ${BORDER}`, background: "transparent", color: MUTED, cursor: "pointer", fontFamily: FONT, fontSize: 13, width: "100%", textAlign: "right" }}
        >
          {darkMode ? "☀️" : "🌙"}<span>{darkMode ? "الوضع الصبحي" : "الوضع الليلي"}</span>
        </button>

        <NavBtn icon={<DashboardIcon />} label="لوحة التحكم" active={activeTab === "dashboard"} onClick={() => { setActiveTab("dashboard"); setSidebarOpen(false); }} />
        <NavBtn icon={<PackageIcon />} label="المنتجات" active={activeTab === "products"} onClick={() => { setActiveTab("products"); }} />
        {activeTab === "products" && (
          <div style={{ paddingRight: 28, display: "flex", flexDirection: "column", gap: 4, marginBottom: 4 }}>
            <SubBtn label="المرحلة الثانية" count={stage2Count} active={activeStage === 2} onClick={() => { setActiveStage(2); setSidebarOpen(false); }} />
            <SubBtn label="المرحلة الثالثة" count={stage3Count} active={activeStage === 3} onClick={() => { setActiveStage(3); setSidebarOpen(false); }} />
          </div>
        )}
        <NavBtn icon={<OrderIcon />} label="الطلبات" active={activeTab === "orders"} onClick={() => { setActiveTab("orders"); setSidebarOpen(false); }} />
        <NavBtn icon={<UsersIcon />} label="العملاء" active={activeTab === "customers"} onClick={() => { setActiveTab("customers"); setSidebarOpen(false); }} />
        <NavBtn icon={<HomeIcon />} label="الموقع الرئيسي" onClick={() => router.push("/")} />
        {isMainAdmin && <NavBtn icon={<span style={{ fontSize: 14 }}>🔐</span>} label="الجلسات" onClick={() => { setShowSessionsModal(true); setSidebarOpen(false); }} />}

        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
          <NavBtn icon={<LogoutIcon />} label="تسجيل الخروج" danger onClick={() => { logout(); setSidebarOpen(false); }} />
        </div>
      </aside>

      {/* Hamburger button */}
      <button onClick={() => setSidebarOpen(p => !p)} style={{ position: "fixed", top: 16, left: 16, zIndex: 30, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: GOLD, fontSize: 18 }}>☰</button>

      {/* Main */}
      <main style={{ flex: 1, padding: "28px 36px 28px 16px", overflowX: "hidden" }}>
        {loading && (
          <div style={{ display: "grid", placeItems: "center", padding: 80, color: GOLD }}>
            <div style={{ animation: "spin 1.6s linear infinite" }}><CrownIcon /></div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {!loading && activeTab === "products" && (
          <ProductsTab
            products={filteredProducts}
            allCount={stageFiltered.length}
            stage={activeStage}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAdd={() => setNewProduct({ ...blankProduct, stage: activeStage, sort_order: filteredProducts.length + 1 })}
            onEdit={(p) => setEditProduct({ ...p })}
            onDelete={deleteProduct}
            onToggle={toggleProductVisibility}
            onReorder={handleReorder}
          />
        )}

        {!loading && activeTab === "dashboard" && (
          <DashboardTab products={products} orders={orders} />
        )}

        {!loading && activeTab === "orders" && (
          <OrdersTab orders={orders} products={products} onStatusChange={updateOrderStatus} onSelect={setSelectedOrder} onDelete={deleteOrder} onComplete={completeOrder} onAssign={updateOrderAssignment} onExport={() => { const html = exportOrdersToHTML(orders, products); downloadHTML(html, `orders-${new Date().toISOString().slice(0, 10)}`); }} />
        )}

        {!loading && activeTab === "customers" && (
          <CustomersTab orders={orders} products={products} onCustomerClick={(phone) => setSelectedCustomerPhone(phone)} onComplete={completeOrder} />
        )}

      </main>

      {/* Product Modal */}
      {(editProduct || newProduct) && (
        <ProductModal
          product={(editProduct || newProduct)!}
          isNew={!!newProduct}
          uploading={uploading}
          isSaving={isSaving}
          onChange={(v) => editProduct ? setEditProduct(v as Product) : setNewProduct(v as any)}
          onClose={() => { setEditProduct(null); setNewProduct(null); }}
          onSave={() => saveProduct((editProduct || newProduct)!, !!newProduct)}
          onUpload={uploadImage}
        />
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <ConfirmModal
          title={confirmDelete.type === "order" ? "حذف الطلب" : "حذف المنتج"}
          message={confirmDelete.type === "order" ? "هل أنت متأكد من حذف هذا الطلب؟" : "هل أنت متأكد من حذف هذا المنتج؟"}
          confirmLabel="حذف"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onComplete={completeOrder} onDelete={deleteOrder} onAssign={updateOrderAssignment} />
      )}
      {selectedCustomerPhone && (
        <CustomerOrdersModal orders={orders} phone={selectedCustomerPhone} onClose={() => setSelectedCustomerPhone(null)} onComplete={completeOrder} />
      )}
      {showSessionsModal && isMainAdmin && (
        <SessionsModal sessions={sessions} currentToken={(() => { try { const s = localStorage.getItem("rd_admin_session"); return s ? JSON.parse(s).token : null; } catch { return null; } })()} onClose={() => setShowSessionsModal(false)} onLogoutSession={logoutSession} />
      )}
    </div>
  );
}

// ─── Sidebar buttons ───────────────────────────────────────────
function NavBtn({ icon, label, active, danger, onClick }: { icon: React.ReactNode; label: string; active?: boolean; danger?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
      borderRadius: 8, border: "none", cursor: "pointer", textAlign: "right",
      background: active ? GOLD : "transparent",
      color: active ? CARD : (danger ? RED : MUTED),
      fontFamily: FONT, fontSize: 13, fontWeight: active ? 700 : 500,
      transition: "all 0.15s",
    }}>{icon}<span>{label}</span></button>
  );
}
function SubBtn({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "7px 12px", borderRadius: 6, border: "none", cursor: "pointer",
      background: active ? CARD2 : "transparent", color: active ? GOLD : MUTED,
      fontFamily: FONT, fontSize: 12, textAlign: "right",
    }}>
      <span>{label}</span>
      <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 99, background: active ? GOLD : CARD2, color: active ? CARD : MUTED }}>{count}</span>
    </button>
  );
}

// ─── Tabs ──────────────────────────────────────────────────────
function ProductsTab({ products, allCount, stage, searchQuery, onSearchChange, onAdd, onEdit, onDelete, onToggle, onReorder }: {
  products: Product[]; allCount: number; stage: 2 | 3; searchQuery: string; onSearchChange: (v: string) => void;
  onAdd: () => void; onEdit: (p: Product) => void; onDelete: (id: string) => void; onToggle: (p: Product) => void; onReorder: (draggedId: string, targetId: string) => void;
}) {
  const dragRef = useRef<string | null>(null);
  return (
    <>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: TEXT, fontSize: 24, margin: 0, fontFamily: "serif" }}>المنتجات — المرحلة {stage === 2 ? "الثانية" : "الثالثة"}</h1>
          <p style={{ color: MUTED, fontSize: 13, margin: "4px 0 0", letterSpacing: 1 }}>{allCount} منتج</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث..."
            style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD2, color: TEXT, fontFamily: FONT, fontSize: 13, outline: "none", width: 160, boxSizing: "border-box" }}
          />
          <button onClick={onAdd} style={primaryBtn()}><PlusIcon />إضافة منتج</button>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {products.map(p => (
          <div
            key={p.id}
            draggable
            onDragStart={() => { dragRef.current = p.id; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragRef.current) { onReorder(dragRef.current, p.id); dragRef.current = null; } }}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", opacity: p.is_active ? 1 : 0.55, position: "relative", cursor: "grab" }}
          >
            {!p.is_active && <div style={hiddenBadge()}>مخفي</div>}
            <div style={{ height: 150, background: CARD2, display: "grid", placeItems: "center", overflow: "hidden", position: "relative" }}>
              {p.image_url
                ? <Image fill src={p.image_url} alt={p.name_ar} placeholder="blur" blurDataURL={BLUR_DATA_URL} onError={(e) => { const t = e.target as HTMLImageElement; if (!t.dataset.err) { t.dataset.err = "1"; t.src = FALLBACK_IMG; } }} style={{ objectFit: "cover" }} sizes="280px" />
                : <span style={{ color: MUTED, fontSize: 12 }}>بدون صورة</span>}
              {p.badge && <span style={{ position: "absolute", top: 8, right: 8, background: GOLD, color: CARD, padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>{p.badge}</span>}
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{p.name_ar}</div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 8, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.description}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: GOLD, fontWeight: 700 }}>{p.price.toLocaleString("ar-IQ")} د.ع</div>
                <div style={{ fontSize: 10, color: MUTED }}>{p.delivery_days || "—"}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => onEdit(p)} style={cardBtn()}><EditIcon />تعديل</button>
                <button onClick={() => onToggle(p)} style={cardBtn()} title={p.is_active ? "إخفاء" : "إظهار"}>
                  {p.is_active ? <EyeOffIcon /> : <EyeIcon />}
                </button>
                <button onClick={() => onDelete(p.id)} style={cardBtnDanger()}><TrashIcon /></button>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && <div style={emptyBox()}>{searchQuery ? "لا توجد نتائج للبحث" : "لا توجد منتجات في هذا القسم"}</div>}
      </div>
    </>
  );
}

function DashboardTab({ products, orders }: { products: Product[]; orders: any[] }) {
  const stats = getOrderStats(orders);
  const recentOrders = orders.slice(0, 5);
  const maxCount = stats.topProducts.length > 0 ? Math.max(...stats.topProducts.map(p => p.count)) : 1;
  const stage2 = products.filter(p => p.stage === 2).length;
  const stage3 = products.filter(p => p.stage === 3).length;
  return (
    <>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ color: TEXT, fontSize: 24, margin: 0, fontFamily: "serif" }}>لوحة التحكم</h1>
        <p style={{ color: MUTED, fontSize: 13, margin: "4px 0 0", letterSpacing: 1 }}>نظرة عامة على الموقع</p>
      </header>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        <StatRow label="عدد المنتجات" value={`${products.length} منتج`} />
        <StatRow label="المرحلة الثانية" value={`${stage2} منتج`} />
        <StatRow label="المرحلة الثالثة" value={`${stage3} منتج`} />
        <StatRow label="عدد الطلبات" value={`${orders.length} طلب`} />
        <StatRow label="طلبات اليوم" value={`${stats.today} طلب`} />
        <StatRow label="طلبات هذا الأسبوع" value={`${stats.week} طلب`} />
        <StatRow label="طلبات هذا الشهر" value={`${stats.month} طلب`} />
        <StatRow label="الإيرادات" value={`${stats.totalRevenue.toLocaleString("ar-IQ")} د.ع`} />
      </div>

      {stats.topProducts.length > 0 && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <h2 style={{ color: GOLD, fontSize: 16, margin: "0 0 14px", fontFamily: "serif" }}>أكثر المنتجات طلباً</h2>
          {stats.topProducts.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ color: TEXT, fontSize: 12, minWidth: 120 }}>{p.name}</span>
              <div style={{ flex: 1, height: 18, background: CARD2, borderRadius: 9, overflow: "hidden", position: "relative" }}>
                <div style={{ width: `${(p.count / maxCount) * 100}%`, height: "100%", background: GOLD, borderRadius: 9, transition: "width 0.3s" }} />
              </div>
              <span style={{ color: MUTED, fontSize: 11, minWidth: 30, textAlign: "left" }}>{p.count}</span>
            </div>
          ))}
        </div>
      )}

      {recentOrders.length > 0 && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
          <h2 style={{ color: GOLD, fontSize: 16, margin: "0 0 14px", fontFamily: "serif" }}>آخر الطلبات</h2>
          {recentOrders.map((o: any) => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 13, color: TEXT }}>
              <span>{o.customer_name} — {o.customer_phone}</span>
              <span style={{ color: o.status === "تم" ? GREEN : o.status === "قيد المعالجة" ? GOLD : RED, fontSize: 12 }}>{o.status}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 18px" }}>
      <span style={{ color: MUTED, fontSize: 13 }}>{label}</span>
      <span style={{ color: GOLD, fontSize: 14, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function getOrderStage(items: any[], products: Product[]): string {
  const stages = new Set<number>()
  if (Array.isArray(items)) {
    for (const item of items) {
      const p = products.find(pp => pp.id === item.product_id)
      if (p) stages.add(p.stage)
    }
  }
  if (stages.has(2) && stages.has(3)) return "مختلط"
  if (stages.has(2)) return "الثانية"
  return "الثالثة"
}

const ASSIGNMENT_OPTIONS = ["مؤمل أحمد", "أحمد شاكر", "ياسين محمد"];

function OrdersTab({ orders, products, onStatusChange, onSelect, onDelete, onComplete, onExport, onAssign }: { orders: any[]; products: Product[]; onStatusChange: (id: string, status: string) => void; onSelect: (o: any) => void; onDelete: (id: string) => void; onComplete: (o: any) => void; onExport: () => void; onAssign: (id: string, assignedTo: string) => void; }) {
  return (
    <>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: TEXT, fontSize: 24, margin: 0, fontFamily: "serif" }}>الطلبات</h1>
          <p style={{ color: MUTED, fontSize: 13, margin: "4px 0 0", letterSpacing: 1 }}>{orders.length} طلب</p>
        </div>
        <button onClick={onExport} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: GOLD, color: CARD, fontWeight: 700, cursor: "pointer", fontFamily: FONT, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
          📥 تحميل التقرير
        </button>
      </header>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {orders.map((o: any) => (
          <div key={o.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }} onClick={() => onSelect(o)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <span style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>{o.customer_name}</span>
                <span style={{ color: MUTED, fontSize: 12, marginRight: 10 }}>{o.customer_phone}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: getOrderStage(o.items, products) === "الثانية" ? `${GOLD}33` : `${MUTED}44`, color: getOrderStage(o.items, products) === "الثانية" ? GOLD : MUTED, marginRight: 6 }}>
                  {getOrderStage(o.items, products)}
                </span>
              </div>
              <span style={{ color: MUTED, fontSize: 11 }}>{new Date(o.created_at).toLocaleDateString("ar-IQ")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ color: GOLD, fontSize: 13 }}>{o.total?.toLocaleString("ar-IQ")} د.ع</span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <select value={o.assigned_to || ""} onChange={(e) => { e.stopPropagation(); onAssign(o.id, e.target.value); }} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${BORDER}`, background: CARD2, color: TEXT, fontSize: 12, fontFamily: FONT, cursor: "pointer" }}>
                  <option value="">من اشتغل؟</option>
                  {ASSIGNMENT_OPTIONS.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                <select value={o.status} onChange={(e) => { e.stopPropagation(); onStatusChange(o.id, e.target.value); }} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${BORDER}`, background: CARD2, color: TEXT, fontSize: 12, fontFamily: FONT, cursor: "pointer" }}>
                  <option value="قيد المعالجة">قيد المعالجة</option>
                  <option value="تم">تم</option>
                </select>
                <button onClick={(e) => { e.stopPropagation(); onDelete(o.id); }} style={cardBtnDanger()} title="حذف"><TrashIcon /></button>
              </div>
            </div>
            {o.assigned_to && (
              <div style={{ marginTop: 6, fontSize: 11, color: MUTED }}>
                👤 {o.assigned_to}
              </div>
            )}
          </div>
        ))}
        {orders.length === 0 && <div style={emptyBox()}>لا توجد طلبات بعد</div>}
      </div>
    </>
  );
}

function CustomersTab({ orders, products, onCustomerClick, onComplete }: { orders: any[]; products: Product[]; onCustomerClick: (phone: string) => void; onComplete: (o: any) => void }) {
  const customers = getCustomerData(orders, products);
  const [search, setSearch] = useState("");
  const filtered = search ? customers.filter(c => c.name.includes(search) || c.phone.includes(search)) : customers;
  return (
    <>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: TEXT, fontSize: 24, margin: 0, fontFamily: "serif" }}>العملاء</h1>
          <p style={{ color: MUTED, fontSize: 13, margin: "4px 0 0", letterSpacing: 1 }}>{customers.length} عميل</p>
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الرقم..." style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD2, color: TEXT, fontFamily: FONT, fontSize: 13, outline: "none", width: 200, boxSizing: "border-box" }} />
      </header>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, color: MUTED }}>
              <th style={thStyle()}>الهاتف</th>
              <th style={thStyle()}>الاسم</th>
              <th style={thStyle()}>المرحلة</th>
              <th style={thStyle()}>الطلبات</th>
              <th style={thStyle()}>المشتريات</th>
              <th style={thStyle()}>آخر طلب</th>
              <th style={thStyle()}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.phone} onClick={() => onCustomerClick(c.phone)} style={{ borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}>
                <td style={tdStyle()}>{c.phone}</td>
                <td style={tdStyle()}>{c.name}</td>
                <td style={tdStyle()}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: c.stages === "الثانية" ? `${GOLD}33` : `${MUTED}44`, color: c.stages === "الثانية" ? GOLD : MUTED }}>
                    {c.stages}
                  </span>
                </td>
                <td style={tdStyle()}>{c.orderCount}</td>
                <td style={{ ...tdStyle(), color: GOLD, fontWeight: 600 }}>{c.total.toLocaleString("ar-IQ")} د.ع</td>
                <td style={tdStyle()}>{new Date(c.lastOrder).toLocaleDateString("ar-IQ")}</td>
                <td style={tdStyle()}>
                  <button onClick={(e) => { e.stopPropagation(); let p = c.phone.replace(/[^\d]/g, ""); if (p.startsWith("0")) p = "964" + p.slice(1); window.open(`https://wa.me/${p}`, "_blank"); }} style={{ padding: "5px 9px", borderRadius: 6, border: "none", background: "#25D366", color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: FONT }}>
                    💬 واتساب
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} style={{ ...tdStyle(), textAlign: "center", color: MUTED, padding: 40 }}>لا يوجد عملاء</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
function thStyle(): React.CSSProperties { return { textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }; }
function tdStyle(): React.CSSProperties { return { padding: "12px", color: TEXT }; }


// ─── Modals ────────────────────────────────────────────────────
function CustomerOrdersModal({ orders, phone, onClose, onComplete }: { orders: any[]; phone: string; onClose: () => void; onComplete: (o: any) => void }) {
  const customerOrders = orders.filter(o => o.customer_phone === phone);
  const customerName = customerOrders[0]?.customer_name || phone;
  return (
    <ModalShell title={`طلبات ${customerName}`} onClose={onClose}>
      <div style={{ marginBottom: 14, color: MUTED, fontSize: 12 }}>{phone} — {customerOrders.length} طلب</div>
      {customerOrders.map(o => (
        <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 13 }}>
          <div>
            <span style={{ color: TEXT }}>{new Date(o.created_at).toLocaleDateString("ar-IQ")}</span>
            <span style={{ color: MUTED, marginRight: 8, fontSize: 11 }}>{o.status}</span>
            {o.assigned_to && <span style={{ color: GOLD, marginRight: 8, fontSize: 11 }}>👤 {o.assigned_to}</span>}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ color: GOLD, fontWeight: 600 }}>{o.total?.toLocaleString("ar-IQ")} د.ع</span>
            {o.status !== "تم" && (
              <button onClick={() => { onComplete(o); onClose(); }} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "#27ae60", color: "#fff", fontSize: 10, cursor: "pointer", fontFamily: FONT }}>
                ✅ تم
              </button>
            )}
          </div>
        </div>
      ))}
      {customerOrders.length === 0 && <div style={{ color: MUTED, textAlign: "center", padding: 20 }}>لا توجد طلبات</div>}
    </ModalShell>
  );
}

function downloadHTML(html: string, filename: string) {
  const blob = new Blob([html], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename + ".html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function ProductModal({ product, isNew, uploading, isSaving, onChange, onClose, onSave, onUpload }: {
  product: Product | Omit<Product, "id">; isNew: boolean; uploading: boolean; isSaving: boolean;
  onChange: (v: Product | Omit<Product, "id">) => void; onClose: () => void; onSave: () => void;
  onUpload: (f: File) => Promise<string | null>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const p = product as Product;
  const imgSrc = localPreview || p.image_url;
  return (
    <ModalShell title={isNew ? "منتج جديد" : "تعديل المنتج"} onClose={onClose}>
      <Field label="رابط الصورة">
        <input dir="ltr" value={p.image_url} onChange={(e) => onChange({ ...p, image_url: e.target.value })} style={inputStyle()} placeholder="https://..." />
      </Field>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        setLocalPreview(URL.createObjectURL(f));
        const url = await onUpload(f);
        setLocalPreview(null);
        if (url) onChange({ ...p, image_url: url });
      }} />
      <button onClick={() => fileRef.current?.click()} style={{ ...secondaryBtn(), marginBottom: 12, width: "100%" }}>{uploading ? "📤 جارٍ الرفع..." : "📷 رفع صورة من الجهاز"}</button>
      {imgSrc && <Image src={imgSrc} alt="" width={560} height={180} placeholder="blur" blurDataURL={BLUR_DATA_URL} onError={(e) => { const t = e.target as HTMLImageElement; if (!t.dataset.err) { t.dataset.err = "1"; t.src = FALLBACK_IMG; } }} style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} />}

      <Field label="الاسم بالعربي *"><input value={p.name_ar} onChange={(e) => onChange({ ...p, name_ar: e.target.value })} style={inputStyle()} /></Field>
      <Field label="الاسم بالإنجليزي"><input dir="ltr" value={p.name} onChange={(e) => onChange({ ...p, name: e.target.value })} style={inputStyle()} /></Field>
      <Field label="المعرّف (slug) *"><input dir="ltr" value={p.slug} onChange={(e) => onChange({ ...p, slug: e.target.value })} style={inputStyle()} placeholder="record-base" /></Field>
      <Field label="الوصف"><textarea value={p.description} onChange={(e) => onChange({ ...p, description: e.target.value })} style={{ ...inputStyle(), minHeight: 70, fontFamily: "inherit" }} /></Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="السعر (د.ع)"><input dir="ltr" type="number" value={p.price} onChange={(e) => onChange({ ...p, price: Number(e.target.value) })} style={inputStyle()} /></Field>
        <Field label="مدة التسليم"><input value={p.delivery_days} onChange={(e) => onChange({ ...p, delivery_days: e.target.value })} style={inputStyle()} placeholder="2–3 أيام" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Field label="شارة"><input value={p.badge || ""} onChange={(e) => onChange({ ...p, badge: e.target.value })} style={inputStyle()} placeholder="جديد" /></Field>
        <Field label="الترتيب"><input dir="ltr" type="number" value={p.sort_order} onChange={(e) => onChange({ ...p, sort_order: Number(e.target.value) })} style={inputStyle()} /></Field>
        <Field label="المرحلة">
          <select value={p.stage} onChange={(e) => onChange({ ...p, stage: Number(e.target.value) })} style={inputStyle()}>
            <option value={2}>الثانية</option>
            <option value={3}>الثالثة</option>
          </select>
        </Field>
      </div>

      <ModalFooter onClose={onClose} onSave={onSave} disabled={uploading || isSaving} label={uploading ? "جارٍ الرفع..." : isSaving ? "جارٍ الحفظ..." : "حفظ"} />
    </ModalShell>
  );
}

function OrderDetailModal({ order, onClose, onComplete, onDelete, onAssign }: { order: any; onClose: () => void; onComplete: (o: any) => void; onDelete: (id: string) => void; onAssign?: (id: string, assignedTo: string) => void }) {
  if (!order) return null;
  return (
    <ModalShell title={`طلب من ${order.customer_name}`} onClose={onClose}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: MUTED, fontSize: 11, marginBottom: 4 }}>العميل</div>
        <div style={{ color: TEXT, fontSize: 14 }}>{order.customer_name} — {order.customer_phone}</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: MUTED, fontSize: 11, marginBottom: 4 }}>اشتغل عليه</div>
        <select value={order.assigned_to || ""} onChange={(e) => { if (onAssign) { onAssign(order.id, e.target.value); } }} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${BORDER}`, background: CARD2, color: TEXT, fontSize: 13, fontFamily: FONT, cursor: "pointer", width: "100%", boxSizing: "border-box" }}>
          <option value="">اختر...</option>
          {ASSIGNMENT_OPTIONS.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>
      {order.notes && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: MUTED, fontSize: 11, marginBottom: 4 }}>ملاحظات</div>
          <div style={{ color: TEXT, fontSize: 13 }}>{order.notes}</div>
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: MUTED, fontSize: 11, marginBottom: 4 }}>المنتجات</div>
        {Array.isArray(order.items) && order.items.map((item: any, i: number) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `0.5px solid ${BORDER}`, fontSize: 13, color: TEXT }}>
            <span>{item.name_ar || item.name} × {item.quantity}</span>
            <span style={{ color: GOLD }}>{(item.price * item.quantity).toLocaleString("ar-IQ")} د.ع</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${BORDER}`, fontSize: 15, fontWeight: 600, color: GOLD }}>
        <span>الإجمالي</span>
        <span>{order.total?.toLocaleString("ar-IQ")} د.ع</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
        {order.status !== "تم" && (
          <button onClick={() => { onComplete(order); onClose(); }} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#27ae60", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: FONT, fontSize: 13 }}>
            ✅ إتمام وإرسال واتساب
          </button>
        )}
        <button onClick={() => { onDelete(order.id); onClose(); }} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: RED, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: FONT, fontSize: 13 }}>
          🗑️ حذف الطلب
        </button>
      </div>
      <div style={{ marginTop: 14, color: MUTED, fontSize: 11, textAlign: "center" }}>
        {new Date(order.created_at).toLocaleString("ar-IQ")}
      </div>
    </ModalShell>
  );
}

function SessionsModal({ sessions, currentToken, onClose, onLogoutSession }: { sessions: any[]; currentToken: string | null; onClose: () => void; onLogoutSession: (token: string) => void }) {
  return (
    <ModalShell title="الجلسات النشطة" onClose={onClose}>
      <div style={{ marginBottom: 14, color: MUTED, fontSize: 12 }}>{sessions.length} جلسة نشطة</div>
      {sessions.map((s, i) => (
        <div key={s.token} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 13 }}>
          <div>
            <div style={{ color: TEXT }}><span style={{ color: MUTED }}>#{i + 1}</span> 👤 {s.name}</div>
            <div style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>{s.device} — {new Date(s.created_at).toLocaleString("ar-IQ")}</div>
          </div>
          {s.token === currentToken ? (
            <span style={{ color: GREEN, fontSize: 11, fontWeight: 600 }}>✓ الحالية</span>
          ) : (
            <button onClick={() => { if (confirm("إنهاء هذه الجلسة؟")) { onLogoutSession(s.token); } }} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: RED, color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: FONT }}>
              إنهاء
            </button>
          )}
        </div>
      ))}
      {sessions.length === 0 && <div style={{ color: MUTED, textAlign: "center", padding: 20 }}>لا توجد جلسات نشطة</div>}
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 100 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ color: GOLD, margin: 0, fontSize: 20, fontFamily: "serif" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer" }}><XIcon /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function ModalFooter({ onClose, onSave, disabled, label }: { onClose: () => void; onSave: () => void; disabled: boolean; label: string }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
      <button onClick={onClose} style={secondaryBtn()}>إلغاء</button>
      <button onClick={onSave} disabled={disabled} style={{ ...primaryBtn(), opacity: disabled ? 0.6 : 1 }}><SaveIcon />{label}</button>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}><label style={fieldLabel()}>{label}</label>{children}</div>;
}

// ─── Styles ────────────────────────────────────────────────────
const fieldLabel = (): React.CSSProperties => ({ display: "block", fontSize: 11, color: MUTED, marginBottom: 5, letterSpacing: 1, textTransform: "uppercase" });
const inputStyle = (): React.CSSProperties => ({ width: "100%", padding: "9px 11px", borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD2, color: TEXT, fontFamily: "inherit", fontSize: 14, boxSizing: "border-box" });
const primaryBtn = (): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 8, border: "none", background: GOLD, color: CARD, fontWeight: 700, cursor: "pointer", fontFamily: FONT, fontSize: 13 });
const secondaryBtn = (): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT, cursor: "pointer", fontFamily: FONT, fontSize: 13 });
const cardBtn = (): React.CSSProperties => ({ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "7px 8px", borderRadius: 6, border: `1px solid ${BORDER}`, background: CARD2, color: MUTED, cursor: "pointer", fontFamily: FONT, fontSize: 11 });
const cardBtnDanger = (): React.CSSProperties => ({ padding: "7px 10px", borderRadius: 6, border: "1px solid #5a1a1a", background: "transparent", color: RED, cursor: "pointer" });
const hiddenBadge = (): React.CSSProperties => ({ position: "absolute", top: 8, left: 8, background: RED, color: CARD, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, zIndex: 2 });
const emptyBox = (): React.CSSProperties => ({ gridColumn: "1/-1", color: MUTED, textAlign: "center", padding: 60, border: `1px dashed ${BORDER}`, borderRadius: 12 });
