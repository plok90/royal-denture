import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  isReady, fetchAllProducts, fetchOrders, fetchSettingsMap, fetchStages,
  saveProductDoc, deleteProductDoc, updateProductDoc, deleteOrderDoc, updateOrderDoc,
  upsertSetting, uploadProductImage, migrateLegacyOrderStatus,
  saveStageDoc, deleteStageDoc, nextStageNumber, type StageDoc,
} from "@/lib/firebase/client";
import { useAdmin } from "@/lib/admin-context";
import { ConfirmModal } from "@/components/confirm-modal";
import { getLocalOrders, getSettingsOrders, removeLocalOrder, removeSettingsOrder, updateSettingsOrderStatus, updateSupabaseOrderAssignment, updateSettingsOrderInternalNotes, buildCompletionMessage, buildStatusMessage, getCustomerData, getOrderStats, exportOrdersToHTML, migrateOrdersCaseIds } from "@/lib/order";

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

let BG = "#0d0502";
let CARD = "#1a0a05";
const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%233a1f10" width="400" height="300"/%3E%3C/svg%3E';
let CARD2 = "#251208";
let BORDER = "#3a1f10";
const GOLD = "#c9a84c";
let TEXT = "#f5efe6";
let MUTED = "#8a7060";
const RED = "#e57373";
const GREEN = "#7fc97f";
const FONT = "'Cairo', sans-serif";

const ic = (d: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const CrownIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill={GOLD}><path d="M2 18h20l-2-10-5 4-3-7-3 7-5-4z"/></svg>;
const HomeIconSvg = () => ic("M3 11l9-8 9 8M5 10v10h14V10");
const PackageIconSvg = () => ic("M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12");
const LogoutIconSvg = () => ic("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9");
const DashboardIcon = () => ic("M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10");
const OrderIcon = () => ic("M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z M9 14l2 2 4-4");
const PlusIconSvg = () => ic("M12 5v14 M5 12h14");
const TrashIconSvg = () => ic("M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6");
const EditIconSvg = () => ic("M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z");
const UsersIcon = () => ic("M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75");
const EyeIconSvg = () => ic("M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z");
const EyeOffIconSvg = () => ic("M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94 M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19 m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22");
const XIconSvg = () => ic("M18 6L6 18 M6 6l12 12");
const SaveIconSvg = () => ic("M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8");

type Tab = "dashboard" | "products" | "orders" | "customers" | "settings" | "mycases" | "stages";
type Notif = { type: "success" | "error"; msg: string } | null;

const blankProduct: Omit<Product, "id"> = {
  slug: "", name: "", name_ar: "", description: "", price: 0,
  delivery_days: "", badge: "", image_url: "", sort_order: 0, is_active: true, stage: 2,
};

const DEFAULT_STAGE_TITLES: Record<number, string> = {
  2: "المرحلة الثانية",
  3: "المرحلة الثالثة",
};

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, isInitialized, currentAdmin, isMainAdmin, logout: adminLogout, sessions, logoutSession } = useAdmin();
  const [darkMode, setDarkMode] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [activeStage, setActiveStage] = useState<number>(2);
  const [stages, setStages] = useState<StageDoc[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<typeof blankProduct | null>(null);
  const [editStage, setEditStage] = useState<{ number: number; title: string; sort_order: number; is_active: boolean } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: "product" | "order" | "stage" } | null>(null);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [notif, setNotif] = useState<Notif>(null);
  const notifTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAdmin) { navigate("/"); return; }
    setAuthChecked(true);
    fetchData();
    return () => { if (notifTimer.current) window.clearTimeout(notifTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isInitialized]);

  function showNotification(type: "success" | "error", msg: string) {
    setNotif({ type, msg });
    if (notifTimer.current) window.clearTimeout(notifTimer.current);
    notifTimer.current = window.setTimeout(() => setNotif(null), 3000);
  }

  async function fetchData() {
    if (!isReady()) { setLoading(false); showNotification("error", "قاعدة البيانات غير مهيأة"); return; }
    setLoading(true);
    if (!localStorage.getItem("rd_migrated_status")) {
      try { await migrateLegacyOrderStatus(); } catch {}
      localStorage.setItem("rd_migrated_status", "1");
    }
    if (!localStorage.getItem("rd_migrated_case_ids")) {
      await migrateOrdersCaseIds();
      localStorage.setItem("rd_migrated_case_ids", "1");
    }
    try {
      const [p, o, settingsMap, stagesRes] = await Promise.all([
        fetchAllProducts(),
        fetchOrders(),
        fetchSettingsMap(),
        fetchStages(),
      ]);
      setProducts((p as Product[]) || []);
      setStages(stagesRes);
      if (stagesRes.length && !stagesRes.some(s => s.number === activeStage)) {
        setActiveStage(stagesRes[0].number);
      }
      if (o.length) setOrders(o);
      else {
        const fromSettings = await getSettingsOrders();
        setOrders(fromSettings.length ? fromSettings : getLocalOrders());
      }
      if (settingsMap.whatsapp_number) setWhatsappNumber(settingsMap.whatsapp_number);
    } catch (e: any) {
      showNotification("error", e?.message || "فشل تحميل البيانات");
      const fromSettings = await getSettingsOrders();
      setOrders(fromSettings.length ? fromSettings : getLocalOrders());
    }
    setLoading(false);
  }

  async function uploadImage(file: File): Promise<string | null> {
    if (!isReady()) { showNotification("error", "قاعدة البيانات غير مهيأة"); return null; }
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      return url;
    } catch (e: any) {
      showNotification("error", e.message);
      return null;
    } finally { setUploading(false); }
  }

  async function saveProduct(p: Partial<Product>, isNew: boolean) {
    if (!isReady()) { showNotification("error", "قاعدة البيانات غير مهيأة"); return; }
    if (!p.name_ar || !p.slug) { showNotification("error", "الاسم العربي والمعرّف مطلوبان"); return; }
    setIsSaving(true);
    try {
      await saveProductDoc(p as Product, isNew);
      showNotification("success", isNew ? "تمت الإضافة" : "تم الحفظ");
      setNewProduct(null);
      setEditProduct(null);
    } catch (e: any) {
      showNotification("error", e?.message || "حدث خطأ");
    }
    setIsSaving(false);
    await fetchData();
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    if (confirmDelete.type === "order") { await handleConfirmDeleteOrder(); return; }
    if (confirmDelete.type === "stage") { await handleDeleteStage(Number(confirmDelete.id)); return; }
    if (!isReady()) { showNotification("error", "قاعدة البيانات غير مهيأة"); setConfirmDelete(null); return; }
    try {
      await deleteProductDoc(confirmDelete.id);
      showNotification("success", "تم الحذف");
    } catch (e: any) {
      showNotification("error", e?.message || "حدث خطأ");
    }
    setConfirmDelete(null);
    await fetchData();
  }

  async function toggleProductVisibility(p: Product) {
    if (!isReady()) { showNotification("error", "قاعدة البيانات غير مهيأة"); return; }
    try {
      await updateProductDoc(p.id, { is_active: !p.is_active });
      showNotification("success", p.is_active ? "تم إخفاء المنتج" : "تم إظهار المنتج");
    } catch (e: any) {
      showNotification("error", e?.message || "حدث خطأ");
    }
    await fetchData();
  }

  async function handleReorder(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;
    if (!isReady()) return;
    const dragged = products.find(p => p.id === draggedId);
    const target = products.find(p => p.id === targetId);
    if (!dragged || !target) return;
    const tempSort = dragged.sort_order;
    try {
      await updateProductDoc(draggedId, { sort_order: target.sort_order });
      await updateProductDoc(targetId, { sort_order: tempSort });
      await fetchData();
      showNotification("success", "تم إعادة الترتيب");
    } catch { /* ignore */ }
  }

  async function updateOrderStatus(id: string, status: string) {
    const order = orders.find(o => o.id === id);
    if (order) {
      let phone = order.customer_phone?.replace(/[^\d]/g, "");
      if (phone) {
        if (phone.startsWith("0")) phone = "964" + phone.slice(1);
        const msg = buildStatusMessage(status, order.customer_name || "العميل", order.items || [], order.total || 0);
        if (msg) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
      }
    }
    if (isReady()) {
      try {
        await updateOrderDoc(id, { status });
      } catch {
        const local = getLocalOrders().map(o => o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o);
        localStorage.setItem("rd_orders_fallback", JSON.stringify(local));
        await updateSettingsOrderStatus(id, status);
      }
    }
    showNotification("success", "تم تحديث الحالة");
    await fetchData();
  }

  async function handleConfirmDeleteOrder() {
    if (!confirmDelete || confirmDelete.type !== "order") return;
    const id = confirmDelete.id;
    await deleteOrderDoc(id);
    removeLocalOrder(id);
    await removeSettingsOrder(id);
    setConfirmDelete(null);
    showNotification("success", "تم حذف الطلب");
    await fetchData();
  }

  async function updateOrderAssignment(id: string, assignedTo: string) {
    if (!isReady()) return;
    try {
      await updateOrderDoc(id, { assigned_to: assignedTo });
    } catch {
      await updateSupabaseOrderAssignment(id, assignedTo);
    }
    showNotification("success", "تم تحديث العامل");
    await fetchData();
  }

  async function saveWhatsappNumber(number: string) {
    if (!isReady()) { showNotification("error", "قاعدة البيانات غير مهيأة"); return; }
    try {
      await upsertSetting("whatsapp_number", number);
    } catch (e: any) {
      showNotification("error", e?.message || "حدث خطأ");
      return;
    }
    try { localStorage.setItem("rd_whatsapp", number); } catch {}
    setWhatsappNumber(number);
    showNotification("success", "تم حفظ رقم واتساب");
  }

  async function saveInternalNotes(id: string, notes: string) {
    if (!isReady()) return;
    try {
      await updateOrderDoc(id, { internal_notes: notes });
    } catch {
      await updateSettingsOrderInternalNotes(id, notes);
    }
    showNotification("success", "تم حفظ الملاحظات");
    await fetchData();
  }

  async function logout() {
    adminLogout();
    navigate("/");
  }

  async function saveStage(s: { number: number; title: string; sort_order: number; is_active: boolean }) {
    if (!isReady()) { showNotification("error", "قاعدة البيانات غير مهيأة"); return; }
    if (!s.title.trim()) { showNotification("error", "عنوان القسم مطلوب"); return; }
    try {
      await saveStageDoc(s);
      showNotification("success", "تم حفظ القسم");
      setEditStage(null);
    } catch (e: any) {
      showNotification("error", e?.message || "حدث خطأ");
    }
    await fetchData();
  }

  async function handleDeleteStage(number: number) {
    if (!isReady()) { showNotification("error", "قاعدة البيانات غير مهيأة"); setConfirmDelete(null); return; }
    try {
      await deleteStageDoc(number);
      showNotification("success", "تم حذف القسم");
      const remaining = stages.filter(s => s.number !== number);
      if (activeStage === number && remaining.length) setActiveStage(remaining[0].number);
    } catch (e: any) {
      showNotification("error", e?.message || "حدث خطأ");
    }
    setConfirmDelete(null);
    await fetchData();
  }

  async function startNewStage() {
    const number = await nextStageNumber().catch(() => stages.reduce((m, s) => Math.max(m, s.number), 1) + 1);
    setEditStage({ number, title: `المرحلة ${number === 2 ? "الثانية" : number === 3 ? "الثالثة" : number}`, sort_order: stages.length + 1, is_active: true });
  }

  if (!authChecked) {
    return <div dir="rtl" style={{ minHeight: "100vh", background: BG, color: TEXT, display: "grid", placeItems: "center", fontFamily: FONT }}>جارٍ التحقق...</div>;
  }

  const stageFiltered = products.filter(p => p.stage === activeStage);
  const filteredProducts = searchQuery
    ? stageFiltered.filter(p => p.name_ar?.includes(searchQuery) || p.name?.includes(searchQuery))
    : stageFiltered;
  const stageTitle = (num: number) =>
    stages.find(s => s.number === num)?.title || DEFAULT_STAGE_TITLES[num] || `المرحلة ${num}`;

  const light = !darkMode;
  BG = light ? "#f4f0ea" : "#0d0502";
  CARD = light ? "#ffffff" : "#1a0a05";
  CARD2 = light ? "#faf7f4" : "#251208";
  BORDER = light ? "#ddd5c8" : "#3a1f10";
  TEXT = light ? "#1a0a05" : "#f5efe6";
  MUTED = light ? "#9a8878" : "#8a7060";

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: FONT, display: "flex" }}>
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

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 49 }} />}

      <aside style={{ width: 256, background: CARD, borderLeft: `1px solid ${BORDER}`, padding: "24px 18px", display: "flex", flexDirection: "column", gap: 6, position: "fixed", top: 0, right: 0, height: "100vh", zIndex: 50, transform: sidebarOpen ? "translateX(0)" : "translateX(100%)", transition: "transform 0.25s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 18, marginBottom: 14, borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flexShrink: 0, boxShadow: "0 0 0 1.5px rgba(201,168,76,0.4)" }}>
            <img src="/logo.png" alt="Royal Denture Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ color: GOLD, fontSize: 16, fontWeight: 700, letterSpacing: 2, fontFamily: "serif" }}>ROYAL DENTURE</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 2, letterSpacing: 1 }}>لوحة التحكم</div>
            {currentAdmin && <div style={{ fontSize: 10, color: GOLD, marginTop: 2 }}>👤 {currentAdmin.name}</div>}
          </div>
        </div>

        <button onClick={() => { setDarkMode(p => !p); setSidebarOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: `0.5px solid ${BORDER}`, background: "transparent", color: MUTED, cursor: "pointer", fontFamily: FONT, fontSize: 13, width: "100%", textAlign: "right" }}>
          {darkMode ? "☀️" : "🌙"}<span>{darkMode ? "الوضع الصبحي" : "الوضع الليلي"}</span>
        </button>

        <NavBtn icon={<DashboardIcon />} label="لوحة التحكم" active={activeTab === "dashboard"} onClick={() => { setActiveTab("dashboard"); setSidebarOpen(false); }} />
        <NavBtn icon={<PackageIconSvg />} label="المنتجات" active={activeTab === "products"} onClick={() => { setActiveTab("products"); }} />
        {activeTab === "products" && (
          <div style={{ paddingRight: 28, display: "flex", flexDirection: "column", gap: 4, marginBottom: 4 }}>
            {(stages.length ? stages : [{ id: "2", number: 2, title: "المرحلة الثانية", sort_order: 1, is_active: true }, { id: "3", number: 3, title: "المرحلة الثالثة", sort_order: 2, is_active: true } as StageDoc]).map(s => (
              <SubBtn
                key={s.id}
                label={s.title}
                count={products.filter(p => p.stage === s.number).length}
                active={activeStage === s.number}
                onClick={() => { setActiveStage(s.number); setSidebarOpen(false); }}
              />
            ))}
          </div>
        )}
        <NavBtn icon={<span style={{ fontSize: 14 }}>🗂️</span>} label="الأقسام" active={activeTab === "stages"} onClick={() => { setActiveTab("stages"); setSidebarOpen(false); }} />
        <NavBtn icon={<OrderIcon />} label="الطلبات" active={activeTab === "orders"} onClick={() => { setActiveTab("orders"); setSidebarOpen(false); }} />
        <NavBtn icon={<span style={{ fontSize: 14 }}>📋</span>} label="حالاتي" active={activeTab === "mycases"} onClick={() => { setActiveTab("mycases"); setSidebarOpen(false); }} />
        <NavBtn icon={<UsersIcon />} label="العملاء" active={activeTab === "customers"} onClick={() => { setActiveTab("customers"); setSidebarOpen(false); }} />
        <NavBtn icon={<HomeIconSvg />} label="الموقع الرئيسي" onClick={() => navigate("/")} />
        {isMainAdmin && <NavBtn icon={<span style={{ fontSize: 14 }}>🔐</span>} label="الجلسات" onClick={() => { setShowSessionsModal(true); setSidebarOpen(false); }} />}
        {isMainAdmin && <NavBtn icon={<span style={{ fontSize: 14 }}>⚙️</span>} label="الإعدادات" active={activeTab === "settings"} onClick={() => { setActiveTab("settings"); setSidebarOpen(false); }} />}

        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
          <NavBtn icon={<LogoutIconSvg />} label="تسجيل الخروج" danger onClick={() => { logout(); setSidebarOpen(false); }} />
        </div>
      </aside>

      <button onClick={() => setSidebarOpen(p => !p)} style={{ position: "fixed", top: 16, right: 16, zIndex: 30, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: GOLD, fontSize: 18 }}>☰</button>

      <main style={{ flex: 1, padding: "28px 66px 28px 16px", overflowX: "hidden" }}>
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
            stageTitle={stageTitle(activeStage)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAdd={() => setNewProduct({ ...blankProduct, stage: activeStage, sort_order: filteredProducts.length + 1 })}
            onEdit={(p) => setEditProduct({ ...p })}
            onDelete={(id) => setConfirmDelete({ id, type: "product" })}
            onToggle={toggleProductVisibility}
            onReorder={handleReorder}
          />
        )}
        {!loading && activeTab === "stages" && (
          <StagesTab
            stages={stages}
            products={products}
            onAdd={startNewStage}
            onEdit={(s) => setEditStage({ number: s.number, title: s.title, sort_order: s.sort_order, is_active: s.is_active })}
            onDelete={(num) => setConfirmDelete({ id: String(num), type: "stage" })}
          />
        )}
        {!loading && activeTab === "dashboard" && <DashboardTab products={products} orders={orders} stages={stages} />}
        {!loading && activeTab === "orders" && (
          <OrdersTab orders={orders} products={products} onStatusChange={updateOrderStatus} onSelect={setSelectedOrder} onDelete={(id) => setConfirmDelete({ id, type: "order" })} onComplete={(o) => updateOrderStatus(o.id, "تم")} onAssign={updateOrderAssignment} onExport={() => { const html = exportOrdersToHTML(orders, products); downloadHTML(html, `orders-${new Date().toISOString().slice(0, 10)}`); }} />
        )}
        {!loading && activeTab === "mycases" && currentAdmin && (
          <MyCasesTab orders={orders.filter(o => o.assigned_to === currentAdmin.name)} products={products} onSelect={setSelectedOrder} />
        )}
        {!loading && activeTab === "customers" && (
          <CustomersTab orders={orders} products={products} onCustomerClick={(phone) => setSelectedCustomerPhone(phone)} onComplete={(o) => updateOrderStatus(o.id, "تم")} />
        )}
        {!loading && activeTab === "settings" && isMainAdmin && (
          <SettingsTab whatsappNumber={whatsappNumber} onUpdate={saveWhatsappNumber} />
        )}
      </main>

      {(editProduct || newProduct) && (
        <ProductModal
          product={(editProduct || newProduct)!}
          isNew={!!newProduct}
          uploading={uploading}
          isSaving={isSaving}
          stages={stages}
          onChange={(v) => editProduct ? setEditProduct(v as Product) : setNewProduct(v as any)}
          onClose={() => { setEditProduct(null); setNewProduct(null); }}
          onSave={() => saveProduct((editProduct || newProduct)!, !!newProduct)}
          onUpload={uploadImage}
        />
      )}

      {editStage && (
        <StageModal
          stage={editStage}
          stages={stages}
          isSaving={isSaving}
          onChange={setEditStage}
          onClose={() => setEditStage(null)}
          onSave={async () => { setIsSaving(true); await saveStage(editStage); setIsSaving(false); }}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title={confirmDelete.type === "stage" ? "حذف القسم" : confirmDelete.type === "order" ? "حذف الطلب" : "حذف المنتج"}
          message={confirmDelete.type === "stage"
            ? "هل أنت متأكد من حذف هذا القسم؟ (لن تُحذف المنتجات)"
            : confirmDelete.type === "order" ? "هل أنت متأكد من حذف هذا الطلب؟" : "هل أنت متأكد من حذف هذا المنتج؟"}
          confirmLabel="حذف"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onComplete={(o) => updateOrderStatus(o.id, "تم")} onDelete={(id) => setConfirmDelete({ id, type: "order" })} onAssign={updateOrderAssignment} onSaveInternalNotes={saveInternalNotes} />
      )}
      {selectedCustomerPhone && (
        <CustomerOrdersModal orders={orders} phone={selectedCustomerPhone} onClose={() => setSelectedCustomerPhone(null)} onComplete={(o) => updateOrderStatus(o.id, "تم")} />
      )}
      {showSessionsModal && isMainAdmin && (
        <SessionsModal sessions={sessions} currentToken={(() => { try { const s = localStorage.getItem("rd_admin_session"); return s ? JSON.parse(s).token : null; } catch { return null; } })()} onClose={() => setShowSessionsModal(false)} onLogoutSession={logoutSession} />
      )}
    </div>
  );
}

function NavBtn({ icon, label, active, danger, onClick }: { icon: React.ReactNode; label: string; active?: boolean; danger?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "right", background: active ? GOLD : "transparent", color: active ? CARD : (danger ? RED : MUTED), fontFamily: FONT, fontSize: 13, fontWeight: active ? 700 : 500, transition: "all 0.15s" }}>
      {icon}<span>{label}</span>
    </button>
  );
}

function SubBtn({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: active ? CARD2 : "transparent", color: active ? GOLD : MUTED, fontFamily: FONT, fontSize: 12, textAlign: "right" }}>
      <span>{label}</span>
      <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 99, background: active ? GOLD : CARD2, color: active ? CARD : MUTED }}>{count}</span>
    </button>
  );
}

function ProductsTab({ products, allCount, stageTitle, searchQuery, onSearchChange, onAdd, onEdit, onDelete, onToggle, onReorder }: {
  products: Product[]; allCount: number; stageTitle: string; searchQuery: string; onSearchChange: (v: string) => void;
  onAdd: () => void; onEdit: (p: Product) => void; onDelete: (id: string) => void; onToggle: (p: Product) => void; onReorder: (draggedId: string, targetId: string) => void;
}) {
  const dragRef = useRef<string | null>(null);
  return (
    <>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: TEXT, fontSize: 24, margin: 0, fontFamily: "serif" }}>المنتجات — {stageTitle}</h1>
          <p style={{ color: MUTED, fontSize: 13, margin: "4px 0 0", letterSpacing: 1 }}>{allCount} منتج</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder="بحث..." style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD2, color: TEXT, fontFamily: FONT, fontSize: 13, outline: "none", width: 160, boxSizing: "border-box" }} />
          <button onClick={onAdd} style={primaryBtn()}><PlusIconSvg />إضافة منتج</button>
        </div>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {products.map(p => (
          <div key={p.id} draggable onDragStart={() => { dragRef.current = p.id; }} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragRef.current) { onReorder(dragRef.current, p.id); dragRef.current = null; } }} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", opacity: p.is_active ? 1 : 0.55, position: "relative", cursor: "grab" }}>
            {!p.is_active && <div style={hiddenBadge()}>مخفي</div>}
            <div style={{ height: 150, background: CARD2, display: "grid", placeItems: "center", overflow: "hidden", position: "relative" }}>
              {p.image_url
                ? <img src={p.image_url} alt={p.name_ar} onError={(e) => { const t = e.target as HTMLImageElement; if (!t.dataset.err) { t.dataset.err = "1"; t.src = FALLBACK_IMG; } }} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ color: MUTED, fontSize: 12 }}>بدون صورة</span>}
              {p.badge && <span style={{ position: "absolute", top: 8, right: 8, background: GOLD, color: CARD, padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>{p.badge}</span>}
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{p.name_ar}</div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 8, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>{p.description}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: GOLD, fontWeight: 700 }}>{p.price.toLocaleString("ar-IQ")} د.ع</div>
                <div style={{ fontSize: 10, color: MUTED }}>{p.delivery_days || "—"}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => onEdit(p)} style={cardBtn()}><EditIconSvg />تعديل</button>
                <button onClick={() => onToggle(p)} style={cardBtn()}>{p.is_active ? <EyeOffIconSvg /> : <EyeIconSvg />}</button>
                <button onClick={() => onDelete(p.id)} style={cardBtnDanger()}><TrashIconSvg /></button>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && <div style={emptyBox()}>{searchQuery ? "لا توجد نتائج للبحث" : "لا توجد منتجات في هذا القسم"}</div>}
      </div>
    </>
  );
}

function StarsDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= rating ? GOLD : BORDER, lineHeight: 1 }}>★</span>
      ))}
    </span>
  );
}

function DashboardTab({ products, orders, stages }: { products: Product[]; orders: any[]; stages: StageDoc[] }) {
  const stats = getOrderStats(orders);
  const recentOrders = orders.slice(0, 5);
  const maxCount = stats.topProducts.length > 0 ? Math.max(...stats.topProducts.map(p => p.count)) : 1;
  const stageList = stages.length ? stages : [
    { id: "2", number: 2, title: "المرحلة الثانية", sort_order: 1, is_active: true },
    { id: "3", number: 3, title: "المرحلة الثالثة", sort_order: 2, is_active: true },
  ] as StageDoc[];

  const ratedOrders = orders.filter(o => o.rating && o.rating > 0);
  const avgRating = ratedOrders.length > 0
    ? (ratedOrders.reduce((s, o) => s + o.rating, 0) / ratedOrders.length).toFixed(1)
    : null;

  return (
    <>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ color: TEXT, fontSize: 24, margin: 0, fontFamily: "serif" }}>لوحة التحكم</h1>
        <p style={{ color: MUTED, fontSize: 13, margin: "4px 0 0", letterSpacing: 1 }}>نظرة عامة على الموقع</p>
      </header>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        <StatRow label="عدد المنتجات" value={`${products.length} منتج`} />
        {stageList.map(s => (
          <StatRow key={s.id} label={s.title} value={`${products.filter(p => p.stage === s.number).length} منتج`} />
        ))}
        <StatRow label="عدد الطلبات" value={`${orders.length} طلب`} />
        <StatRow label="طلبات اليوم" value={`${stats.today} طلب`} />
        <StatRow label="طلبات هذا الأسبوع" value={`${stats.week} طلب`} />
        <StatRow label="طلبات هذا الشهر" value={`${stats.month} طلب`} />
        <StatRow label="الإيرادات" value={`${stats.totalRevenue.toLocaleString("ar-IQ")} د.ع`} />
        {avgRating && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 18px" }}>
            <span style={{ color: MUTED, fontSize: 13 }}>متوسط تقييم العملاء ({ratedOrders.length} تقييم)</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StarsDisplay rating={Math.round(Number(avgRating))} size={16} />
              <span style={{ color: GOLD, fontSize: 14, fontWeight: 700 }}>{avgRating} / 5</span>
            </div>
          </div>
        )}
      </div>

      {ratedOrders.length > 0 && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <h2 style={{ color: GOLD, fontSize: 16, margin: "0 0 14px", fontFamily: "serif" }}>آراء العملاء</h2>
          {ratedOrders.slice(0, 5).map((o: any) => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ color: TEXT, fontSize: 13 }}>{o.customer_name}</span>
              <StarsDisplay rating={o.rating} size={15} />
            </div>
          ))}
        </div>
      )}

      {stats.topProducts.length > 0 && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <h2 style={{ color: GOLD, fontSize: 16, margin: "0 0 14px", fontFamily: "serif" }}>أكثر المنتجات طلباً</h2>
          {stats.topProducts.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ color: TEXT, fontSize: 12, minWidth: 120 }}>{p.name}</span>
              <div style={{ flex: 1, height: 18, background: CARD2, borderRadius: 9, overflow: "hidden" }}>
                <div style={{ width: `${(p.count / maxCount) * 100}%`, height: "100%", background: GOLD, borderRadius: 9 }} />
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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {o.rating > 0 && <StarsDisplay rating={o.rating} size={12} />}
                <span style={{ color: o.status === "تم" ? GREEN : GOLD, fontSize: 12 }}>{o.status}</span>
              </div>
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
  const stages = new Set<number>();
  if (Array.isArray(items)) {
    for (const item of items) {
      const p = products.find(pp => pp.id === item.product_id);
      if (p) stages.add(p.stage);
    }
  }
  if (stages.has(2) && stages.has(3)) return "مختلط";
  if (stages.has(2)) return "الثانية";
  return "الثالثة";
}

const ASSIGNMENT_OPTIONS = ["مؤمل أحمد", "أحمد شاكر", "ياسين محمد"];

const STATUS_OPTIONS = ["الكل", "قيد المعالجة", "تم"];
const STATUS_COLORS_ADMIN: Record<string, string> = {
  "قيد المعالجة": "#60a5fa",
  "تم": "#c9a84c",
};

function OrdersTab({ orders, products, onStatusChange, onSelect, onDelete, onComplete, onExport, onAssign }: { orders: any[]; products: Product[]; onStatusChange: (id: string, s: string) => void; onSelect: (o: any) => void; onDelete: (id: string) => void; onComplete: (o: any) => void; onExport: () => void; onAssign: (id: string, a: string) => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === "الكل" || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || o.customer_name?.toLowerCase().includes(q) || o.customer_phone?.includes(q) || o.case_id?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts: Record<string, number> = { "الكل": orders.length };
  orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });

  return (
    <>
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <h1 style={{ color: TEXT, fontSize: 24, margin: 0, fontFamily: "serif" }}>الطلبات</h1>
            <p style={{ color: MUTED, fontSize: 13, margin: "4px 0 0", letterSpacing: 1 }}>{filtered.length} من {orders.length} طلب</p>
          </div>
          <button onClick={onExport} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: GOLD, color: CARD, fontWeight: 700, cursor: "pointer", fontFamily: FONT, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>📥 تحميل التقرير</button>
        </div>
        {/* Filter bar */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 بحث بالاسم أو الهاتف أو الرقم..."
            style={{ flex: 1, minWidth: 180, padding: "8px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD2, color: TEXT, fontFamily: FONT, fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{ padding: "7px 14px", borderRadius: 999, border: `1.5px solid ${statusFilter === s ? (STATUS_COLORS_ADMIN[s] || GOLD) : BORDER}`, background: statusFilter === s ? `${STATUS_COLORS_ADMIN[s] || GOLD}22` : "transparent", color: statusFilter === s ? (STATUS_COLORS_ADMIN[s] || GOLD) : MUTED, fontSize: 12, fontFamily: FONT, fontWeight: statusFilter === s ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}
              >
                {s} {counts[s] !== undefined ? <span style={{ opacity: 0.7 }}>({counts[s] || 0})</span> : null}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((o: any) => {
          const sc = STATUS_COLORS_ADMIN[o.status];
          return (
            <div key={o.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, cursor: "pointer", transition: "border-color 0.2s" }} onClick={() => onSelect(o)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: `${GOLD}33`, color: GOLD }}>#{o.case_id || "—"}</span>
                  <span style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>{o.customer_name}</span>
                  <span style={{ color: MUTED, fontSize: 12 }}>{o.customer_phone}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: `${GOLD}22`, color: GOLD }}>{getOrderStage(o.items, products)}</span>
                </div>
                <span style={{ color: MUTED, fontSize: 11, whiteSpace: "nowrap" }}>{new Date(o.created_at).toLocaleDateString("ar-IQ")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ color: GOLD, fontSize: 13, fontWeight: 700 }}>{o.total?.toLocaleString("ar-IQ")} د.ع</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <select value={o.assigned_to || ""} onChange={(e) => { e.stopPropagation(); onAssign(o.id, e.target.value); }} style={{ padding: "5px 8px", borderRadius: 6, border: `1px solid ${BORDER}`, background: CARD2, color: TEXT, fontSize: 12, fontFamily: FONT, cursor: "pointer" }}>
                    <option value="">من اشتغل؟</option>
                    {ASSIGNMENT_OPTIONS.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <select value={o.status} onChange={(e) => { e.stopPropagation(); onStatusChange(o.id, e.target.value); }} style={{ padding: "5px 8px", borderRadius: 6, border: `1.5px solid ${sc || BORDER}`, background: sc ? `${sc}18` : CARD2, color: sc || TEXT, fontSize: 12, fontFamily: FONT, cursor: "pointer", fontWeight: 600 }}>
                    <option value="قيد المعالجة">قيد المعالجة</option>
                    <option value="تم">تم 🏆</option>
                  </select>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(o.id); }} style={cardBtnDanger()} title="حذف"><TrashIconSvg /></button>
                </div>
              </div>
              {o.assigned_to && <div style={{ marginTop: 6, fontSize: 11, color: MUTED }}>👤 {o.assigned_to}</div>}
              {o.internal_notes && <div style={{ marginTop: 4, fontSize: 11, color: MUTED }}>📝 {o.internal_notes.length > 60 ? o.internal_notes.slice(0, 60) + "..." : o.internal_notes}</div>}
            </div>
          );
        })}
        {filtered.length === 0 && <div style={emptyBox()}>{search || statusFilter !== "الكل" ? "لا توجد نتائج للبحث" : "لا توجد طلبات بعد"}</div>}
      </div>
    </>
  );
}

function MyCasesTab({ orders, products, onSelect }: { orders: any[]; products: Product[]; onSelect: (o: any) => void }) {
  return (
    <>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ color: TEXT, fontSize: 24, margin: 0, fontFamily: "serif" }}>حالاتي</h1>
        <p style={{ color: MUTED, fontSize: 13, margin: "4px 0 0", letterSpacing: 1 }}>{orders.length} حالة</p>
      </header>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {orders.map((o: any) => (
          <div key={o.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, cursor: "pointer" }} onClick={() => onSelect(o)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: `${GOLD}44`, color: GOLD, marginRight: 8 }}>#{o.case_id || "—"}</span>
                <span style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>{o.customer_name}</span>
                <span style={{ color: MUTED, fontSize: 12, marginRight: 10 }}>{o.customer_phone}</span>
              </div>
              <span style={{ color: MUTED, fontSize: 11 }}>{new Date(o.created_at).toLocaleDateString("ar-IQ")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: GOLD, fontSize: 13 }}>{o.total?.toLocaleString("ar-IQ")} د.ع</span>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: o.status === "تم" ? `${GREEN}33` : `${GOLD}33`, color: o.status === "تم" ? GREEN : GOLD }}>{o.status}</span>
            </div>
            {o.internal_notes && <div style={{ marginTop: 6, fontSize: 11, color: MUTED }}>📝 {o.internal_notes}</div>}
          </div>
        ))}
        {orders.length === 0 && <div style={emptyBox()}>لا توجد حالات بعد</div>}
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
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD2, color: TEXT, fontFamily: FONT, fontSize: 13, outline: "none", width: 200, boxSizing: "border-box" }} />
      </header>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, color: MUTED }}>
              <th style={thStyle()}>الهاتف</th><th style={thStyle()}>الاسم</th><th style={thStyle()}>المرحلة</th><th style={thStyle()}>الطلبات</th><th style={thStyle()}>المشتريات</th><th style={thStyle()}>آخر طلب</th><th style={thStyle()}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.phone} onClick={() => onCustomerClick(c.phone)} style={{ borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}>
                <td style={tdStyle()}>{c.phone}</td>
                <td style={tdStyle()}>{c.name}</td>
                <td style={tdStyle()}><span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: `${GOLD}33`, color: GOLD }}>{c.stages}</span></td>
                <td style={tdStyle()}>{c.orderCount}</td>
                <td style={{ ...tdStyle(), color: GOLD, fontWeight: 600 }}>{c.total.toLocaleString("ar-IQ")} د.ع</td>
                <td style={tdStyle()}>{new Date(c.lastOrder).toLocaleDateString("ar-IQ")}</td>
                <td style={tdStyle()}><button onClick={(e) => { e.stopPropagation(); let p = c.phone.replace(/[^\d]/g, ""); if (p.startsWith("0")) p = "964" + p.slice(1); window.open(`https://wa.me/${p}`, "_blank"); }} style={{ padding: "5px 9px", borderRadius: 6, border: "none", background: "#25D366", color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: FONT }}>💬 واتساب</button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ ...tdStyle(), textAlign: "center", color: MUTED, padding: 40 }}>لا يوجد عملاء</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function thStyle(): React.CSSProperties { return { textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, letterSpacing: 1 }; }
function tdStyle(): React.CSSProperties { return { padding: "12px", color: TEXT }; }

function SettingsTab({ whatsappNumber, onUpdate }: { whatsappNumber: string; onUpdate: (v: string) => Promise<void> }) {
  const [value, setValue] = useState(whatsappNumber);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setValue(whatsappNumber); }, [whatsappNumber]);
  return (
    <>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ color: TEXT, fontSize: 24, margin: 0, fontFamily: "serif" }}>الإعدادات</h1>
      </header>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, maxWidth: 400 }}>
        <label style={fieldLabel()}>رقم واتساب</label>
        <input dir="ltr" value={value} onChange={(e) => setValue(e.target.value)} style={inputStyle()} placeholder="964xxxxxxxxx" />
        <button onClick={async () => { setSaving(true); await onUpdate(value); setSaving(false); }} disabled={saving} style={{ ...primaryBtn(), marginTop: 12, opacity: saving ? 0.6 : 1 }}>
          {saving ? "جارٍ الحفظ..." : "💾 حفظ"}
        </button>
      </div>
    </>
  );
}

function StagesTab({ stages, products, onAdd, onEdit, onDelete }: {
  stages: StageDoc[]; products: Product[];
  onAdd: () => void; onEdit: (s: StageDoc) => void; onDelete: (number: number) => void;
}) {
  const list = stages.length ? stages : [
    { id: "2", number: 2, title: "المرحلة الثانية", sort_order: 1, is_active: true },
    { id: "3", number: 3, title: "المرحلة الثالثة", sort_order: 2, is_active: true },
  ] as StageDoc[];
  return (
    <>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: TEXT, fontSize: 24, margin: 0, fontFamily: "serif" }}>أقسام المنتجات</h1>
          <p style={{ color: MUTED, fontSize: 13, margin: "4px 0 0", letterSpacing: 1 }}>{list.length} قسم — تظهر في الصفحة الرئيسية وقائمة المنتجات</p>
        </div>
        <button onClick={onAdd} style={primaryBtn()}><PlusIconSvg />إضافة قسم</button>
      </header>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map(s => {
          const count = products.filter(p => p.stage === s.number).length;
          return (
            <div key={s.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", opacity: s.is_active ? 1 : 0.6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${GOLD}22`, color: GOLD, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 15 }}>
                  {s.number}
                </div>
                <div>
                  <div style={{ color: TEXT, fontSize: 15, fontWeight: 700 }}>{s.title}</div>
                  <div style={{ color: MUTED, fontSize: 11, marginTop: 2 }}>
                    {count} منتج · ترتيب {s.sort_order} · {s.is_active ? "ظاهر" : "مخفي"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => onEdit(s)} style={cardBtn()}><EditIconSvg />تعديل</button>
                <button onClick={() => onDelete(s.number)} style={cardBtnDanger()}><TrashIconSvg /></button>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <div style={emptyBox()}>لا توجد أقسام بعد</div>}
      </div>
    </>
  );
}

function StageModal({ stage, stages, isSaving, onChange, onClose, onSave }: {
  stage: { number: number; title: string; sort_order: number; is_active: boolean };
  stages: StageDoc[]; isSaving: boolean;
  onChange: (v: { number: number; title: string; sort_order: number; is_active: boolean }) => void;
  onClose: () => void; onSave: () => void;
}) {
  const exists = stages.some(s => s.number === stage.number);
  return (
    <ModalShell title={exists ? "تعديل القسم" : "قسم جديد"} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
        <FieldItem label="الرقم">
          <input dir="ltr" type="number" value={stage.number} disabled={exists} onChange={(e) => onChange({ ...stage, number: Number(e.target.value) })} style={{ ...inputStyle(), opacity: exists ? 0.6 : 1 }} />
        </FieldItem>
        <FieldItem label="العنوان *">
          <input value={stage.title} onChange={(e) => onChange({ ...stage, title: e.target.value })} style={inputStyle()} placeholder="المرحلة الثانية" />
        </FieldItem>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <FieldItem label="الترتيب">
          <input dir="ltr" type="number" value={stage.sort_order} onChange={(e) => onChange({ ...stage, sort_order: Number(e.target.value) })} style={inputStyle()} />
        </FieldItem>
        <FieldItem label="الحالة">
          <select value={stage.is_active ? "1" : "0"} onChange={(e) => onChange({ ...stage, is_active: e.target.value === "1" })} style={inputStyle()}>
            <option value="1">ظاهر في الموقع</option>
            <option value="0">مخفي</option>
          </select>
        </FieldItem>
      </div>
      <ModalFooter onClose={onClose} onSave={onSave} disabled={isSaving} label={isSaving ? "جارٍ الحفظ..." : "حفظ"} />
    </ModalShell>
  );
}

function downloadHTML(html: string, filename: string) {
  const blob = new Blob([html], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename + ".html";
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

function ProductModal({ product, isNew, uploading, isSaving, stages, onChange, onClose, onSave, onUpload }: {
  product: Product | Omit<Product, "id">; isNew: boolean; uploading: boolean; isSaving: boolean; stages: StageDoc[];
  onChange: (v: any) => void; onClose: () => void; onSave: () => void; onUpload: (f: File) => Promise<string | null>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const p = product as Product;
  const imgSrc = localPreview || p.image_url;
  return (
    <ModalShell title={isNew ? "منتج جديد" : "تعديل المنتج"} onClose={onClose}>
      <FieldItem label="رابط الصورة">
        <input dir="ltr" value={p.image_url} onChange={(e) => onChange({ ...p, image_url: e.target.value })} style={inputStyle()} placeholder="https://..." />
      </FieldItem>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        setLocalPreview(URL.createObjectURL(f));
        const url = await onUpload(f);
        setLocalPreview(null);
        if (url) onChange({ ...p, image_url: url });
      }} />
      <button onClick={() => fileRef.current?.click()} style={{ ...secondaryBtn(), marginBottom: 12, width: "100%" }}>{uploading ? "📤 جارٍ الرفع..." : "📷 رفع صورة"}</button>
      {imgSrc && <img src={imgSrc} alt="" onError={(e) => { const t = e.target as HTMLImageElement; if (!t.dataset.err) { t.dataset.err = "1"; t.src = FALLBACK_IMG; } }} style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} />}
      <FieldItem label="الاسم بالعربي *"><input value={p.name_ar} onChange={(e) => onChange({ ...p, name_ar: e.target.value })} style={inputStyle()} /></FieldItem>
      <FieldItem label="الاسم بالإنجليزي"><input dir="ltr" value={p.name} onChange={(e) => onChange({ ...p, name: e.target.value })} style={inputStyle()} /></FieldItem>
      <FieldItem label="المعرّف (slug) *"><input dir="ltr" value={p.slug} onChange={(e) => onChange({ ...p, slug: e.target.value })} style={inputStyle()} placeholder="record-base" /></FieldItem>
      <FieldItem label="الوصف"><textarea value={p.description} onChange={(e) => onChange({ ...p, description: e.target.value })} style={{ ...inputStyle(), minHeight: 70, fontFamily: "inherit" }} /></FieldItem>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <FieldItem label="السعر (د.ع)"><input dir="ltr" type="number" value={p.price} onChange={(e) => onChange({ ...p, price: Number(e.target.value) })} style={inputStyle()} /></FieldItem>
        <FieldItem label="مدة التسليم"><input value={p.delivery_days} onChange={(e) => onChange({ ...p, delivery_days: e.target.value })} style={inputStyle()} /></FieldItem>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <FieldItem label="شارة"><input value={p.badge || ""} onChange={(e) => onChange({ ...p, badge: e.target.value })} style={inputStyle()} /></FieldItem>
        <FieldItem label="الترتيب"><input dir="ltr" type="number" value={p.sort_order} onChange={(e) => onChange({ ...p, sort_order: Number(e.target.value) })} style={inputStyle()} /></FieldItem>
        <FieldItem label="المرحلة">
          <select value={p.stage} onChange={(e) => onChange({ ...p, stage: Number(e.target.value) })} style={inputStyle()}>
            {(stages.length ? stages : [
              { id: "2", number: 2, title: "المرحلة الثانية", sort_order: 1, is_active: true },
              { id: "3", number: 3, title: "المرحلة الثالثة", sort_order: 2, is_active: true },
            ] as StageDoc[]).map(s => (
              <option key={s.id} value={s.number}>{s.title}</option>
            ))}
          </select>
        </FieldItem>
      </div>
      <ModalFooter onClose={onClose} onSave={onSave} disabled={uploading || isSaving} label={uploading ? "جارٍ الرفع..." : isSaving ? "جارٍ الحفظ..." : "حفظ"} />
    </ModalShell>
  );
}

function OrderDetailModal({ order, onClose, onComplete, onDelete, onAssign, onSaveInternalNotes }: { order: any; onClose: () => void; onComplete: (o: any) => void; onDelete: (id: string) => void; onAssign?: (id: string, a: string) => void; onSaveInternalNotes?: (id: string, n: string) => Promise<void> }) {
  if (!order) return null;
  const [internalNotes, setInternalNotes] = useState(order.internal_notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  useEffect(() => { setInternalNotes(order.internal_notes || ""); }, [order.internal_notes]);
  return (
    <ModalShell title={`طلب من ${order.customer_name}`} onClose={onClose}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: MUTED, fontSize: 11, marginBottom: 4 }}>العميل</div>
        <div style={{ color: TEXT, fontSize: 14 }}>{order.customer_name} — {order.customer_phone}</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: MUTED, fontSize: 11, marginBottom: 4 }}>اشتغل عليه</div>
        <select value={order.assigned_to || ""} onChange={(e) => { if (onAssign) onAssign(order.id, e.target.value); }} style={{ ...inputStyle(), padding: "6px 10px" }}>
          <option value="">اختر...</option>
          {ASSIGNMENT_OPTIONS.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: MUTED, fontSize: 11, marginBottom: 4 }}>ملاحظات داخلية</div>
        <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={3} style={{ ...inputStyle(), resize: "vertical" as any }} placeholder="ملاحظات لا تظهر للعميل..." />
        <button onClick={async () => { setSavingNotes(true); if (onSaveInternalNotes) await onSaveInternalNotes(order.id, internalNotes); setSavingNotes(false); }} disabled={savingNotes} style={{ ...primaryBtn(), marginTop: 8, opacity: savingNotes ? 0.6 : 1, fontSize: 12 }}>
          {savingNotes ? "جارٍ الحفظ..." : "💾 حفظ الملاحظات"}
        </button>
      </div>
      {order.notes && <div style={{ marginBottom: 16 }}><div style={{ color: MUTED, fontSize: 11, marginBottom: 4 }}>ملاحظات العميل</div><div style={{ color: TEXT, fontSize: 13 }}>{order.notes}</div></div>}
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
        <span>الإجمالي</span><span>{order.total?.toLocaleString("ar-IQ")} د.ع</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
        {order.status !== "تم" && (
          <button onClick={() => { onComplete(order); onClose(); }} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#27ae60", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: FONT, fontSize: 13 }}>
            ✅ إتمام وإرسال واتساب
          </button>
        )}
        <button onClick={() => { onDelete(order.id); onClose(); }} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: RED, color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: FONT, fontSize: 13 }}>🗑️ حذف</button>
      </div>
      <div style={{ marginTop: 14, color: MUTED, fontSize: 11, textAlign: "center" }}>{new Date(order.created_at).toLocaleString("ar-IQ")}</div>
    </ModalShell>
  );
}

function CustomerOrdersModal({ orders, phone, onClose, onComplete }: { orders: any[]; phone: string; onClose: () => void; onComplete: (o: any) => void }) {
  const customerOrders = orders.filter(o => o.customer_phone === phone);
  const customerName = customerOrders[0]?.customer_name || phone;
  return (
    <ModalShell title={`طلبات ${customerName}`} onClose={onClose}>
      <div style={{ marginBottom: 14, color: MUTED, fontSize: 12 }}>{phone} — {customerOrders.length} طلب</div>
      {customerOrders.map(o => (
        <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 13 }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 99, background: `${GOLD}44`, color: GOLD, marginRight: 6 }}>#{o.case_id || "—"}</span>
            <span style={{ color: TEXT }}>{new Date(o.created_at).toLocaleDateString("ar-IQ")}</span>
            <span style={{ color: MUTED, marginRight: 8, fontSize: 11 }}>{o.status}</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ color: GOLD, fontWeight: 600 }}>{o.total?.toLocaleString("ar-IQ")} د.ع</span>
            {o.status !== "تم" && (
              <button onClick={() => { onComplete(o); onClose(); }} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "#27ae60", color: "#fff", fontSize: 10, cursor: "pointer", fontFamily: FONT }}>✅ تم</button>
            )}
          </div>
        </div>
      ))}
      {customerOrders.length === 0 && <div style={{ color: MUTED, textAlign: "center", padding: 20 }}>لا توجد طلبات</div>}
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
            <button onClick={() => { if (confirm("إنهاء هذه الجلسة؟")) onLogoutSession(s.token); }} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: RED, color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: FONT }}>إنهاء</button>
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
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer" }}><XIconSvg /></button>
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
      <button onClick={onSave} disabled={disabled} style={{ ...primaryBtn(), opacity: disabled ? 0.6 : 1 }}><SaveIconSvg />{label}</button>
    </div>
  );
}

function FieldItem({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}><label style={fieldLabel()}>{label}</label>{children}</div>;
}

const fieldLabel = (): React.CSSProperties => ({ display: "block", fontSize: 11, color: MUTED, marginBottom: 5, letterSpacing: 1, textTransform: "uppercase" });
const inputStyle = (): React.CSSProperties => ({ width: "100%", padding: "9px 11px", borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD2, color: TEXT, fontFamily: "inherit", fontSize: 14, boxSizing: "border-box" });
const primaryBtn = (): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 8, border: "none", background: GOLD, color: CARD, fontWeight: 700, cursor: "pointer", fontFamily: FONT, fontSize: 13 });
const secondaryBtn = (): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT, cursor: "pointer", fontFamily: FONT, fontSize: 13 });
const cardBtn = (): React.CSSProperties => ({ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "7px 8px", borderRadius: 6, border: `1px solid ${BORDER}`, background: CARD2, color: MUTED, cursor: "pointer", fontFamily: FONT, fontSize: 11 });
const cardBtnDanger = (): React.CSSProperties => ({ padding: "7px 10px", borderRadius: 6, border: "1px solid #5a1a1a", background: "transparent", color: RED, cursor: "pointer" });
const hiddenBadge = (): React.CSSProperties => ({ position: "absolute", top: 8, left: 8, background: RED, color: CARD, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, zIndex: 2 });
const emptyBox = (): React.CSSProperties => ({ gridColumn: "1/-1", color: MUTED, textAlign: "center", padding: 60, border: `1px dashed ${BORDER}`, borderRadius: 12 });
