import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _initTried = false;

export function getDb(): Firestore | null {
  if (_db) return _db;
  if (_initTried) return null;
  _initTried = true;
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn("[Firebase] VITE_FIREBASE_* env vars are not set");
    return null;
  }
  try {
    const app = initializeApp(firebaseConfig);
    _db = getFirestore(app);
    _storage = getStorage(app);
    return _db;
  } catch (e) {
    console.warn("[Firebase] init failed", e);
    return null;
  }
}

export function isReady(): boolean {
  return getDb() !== null;
}

function now(): string {
  return new Date().toISOString();
}

async function colAll(name: string): Promise<any[]> {
  const db = getDb();
  if (!db) return [];
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function stripId(p: Record<string, unknown>): Record<string, unknown> {
  const { id: _id, ...rest } = p;
  return rest;
}

/* ── Products ─────────────────────────────────── */

const productCache = new Map<string, any>();
const prefetchInFlight = new Set<string>();

export async function fetchAllProducts(): Promise<any[]> {
  const all = await colAll("products");
  const sorted = all.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  sorted.forEach((p) => {
    const key = p.slug || p.id;
    if (key) productCache.set(key, p);
  });
  return sorted;
}

export async function fetchActiveProducts(): Promise<any[]> {
  return (await fetchAllProducts()).filter((p) => p.is_active !== false);
}

export async function fetchProductBySlug(slug: string): Promise<any | null> {
  if (productCache.has(slug)) return productCache.get(slug);
  const db = getDb();
  if (!db) return null;
  try {
    const byId = await getDoc(doc(db, "products", slug));
    if (byId.exists()) {
      const data = { id: byId.id, ...byId.data() };
      productCache.set(slug, data);
      return data;
    }
  } catch { /* fall through to query */ }
  try {
    const snap = await getDocs(query(collection(db, "products"), where("slug", "==", slug)));
    if (!snap.empty) {
      const d = snap.docs[0];
      const data = { id: d.id, ...d.data() };
      productCache.set(slug, data);
      return data;
    }
  } catch { /* ignore */ }
  return null;
}

/** Warm the product cache on hover so the detail page opens instantly. */
export function prefetchProduct(slug: string): void {
  if (!slug || productCache.has(slug) || prefetchInFlight.has(slug)) return;
  prefetchInFlight.add(slug);
  fetchProductBySlug(slug)
    .catch(() => { /* ignore */ })
    .finally(() => prefetchInFlight.delete(slug));
}

export function invalidateProductCache(slug?: string): void {
  if (slug) productCache.delete(slug);
  else productCache.clear();
}

export async function saveProductDoc(p: any, isNew: boolean): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("قاعدة البيانات غير مهيأة");
  const slug: string = p.slug;
  const data: Record<string, unknown> = { ...stripId(p), slug, updated_at: now() };
  if (isNew) data.created_at = p.created_at || now();
  if (!isNew && p.id && p.id !== slug) {
    await setDoc(doc(db, "products", slug), data, { merge: true });
    await deleteDoc(doc(db, "products", p.id));
    invalidateProductCache(p.id);
    invalidateProductCache(slug);
    return;
  }
  await setDoc(doc(db, "products", slug), data, { merge: !isNew });
  invalidateProductCache(slug);
}

export async function deleteProductDoc(id: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("قاعدة البيانات غير مهيأة");
  await deleteDoc(doc(db, "products", id));
  invalidateProductCache(id);
}

export async function updateProductDoc(id: string, data: Record<string, unknown>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("قاعدة البيانات غير مهيأة");
  await updateDoc(doc(db, "products", id), { ...data, updated_at: now() });
  invalidateProductCache(id);
}

/* ── Stages (product sections) ────────────────── */

export interface StageDoc {
  id: string;
  number: number;
  title: string;
  sort_order: number;
  is_active: boolean;
}

const DEFAULT_STAGES: StageDoc[] = [
  { id: "2", number: 2, title: "المرحلة الثانية", sort_order: 1, is_active: true },
  { id: "3", number: 3, title: "المرحلة الثالثة", sort_order: 2, is_active: true },
];

export async function fetchStages(): Promise<StageDoc[]> {
  const all = await colAll("stages");
  if (!all.length) return [...DEFAULT_STAGES];
  return all
    .map((s) => ({
      id: s.id,
      number: Number(s.number ?? s.id),
      title: String(s.title || `المرحلة ${s.number ?? s.id}`),
      sort_order: Number(s.sort_order ?? Number(s.number ?? 0)),
      is_active: s.is_active !== false,
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function nextStageNumber(): Promise<number> {
  const stages = await fetchStages();
  return stages.reduce((max, s) => Math.max(max, s.number), 1) + 1;
}

export async function saveStageDoc(stage: Omit<StageDoc, "id">): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("قاعدة البيانات غير مهيأة");
  const number = Number(stage.number);
  await setDoc(
    doc(db, "stages", String(number)),
    { ...stage, number, updated_at: now() },
    { merge: true }
  );
}

export async function deleteStageDoc(number: number): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("قاعدة البيانات غير مهيأة");
  await deleteDoc(doc(db, "stages", String(number)));
}

/* ── Testimonials ─────────────────────────────── */

export async function fetchTestimonials(): Promise<any[]> {
  const all = await colAll("testimonials");
  return all.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

/* ── Settings (admin_settings, doc id = key) ──── */

export async function fetchSettingsRows(): Promise<{ key: string; value: string }[]> {
  const all = await colAll("admin_settings");
  return all.map((r) => ({ key: r.key ?? r.id, value: r.value ?? "" }));
}

export async function fetchSettingsMap(): Promise<Record<string, string>> {
  const rows = await fetchSettingsRows();
  const map: Record<string, string> = {};
  rows.forEach((r) => { map[r.key] = r.value; });
  return map;
}

export async function readSetting(key: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, "admin_settings", key));
    if (snap.exists()) {
      const v = snap.data()?.value;
      return typeof v === "string" ? v : null;
    }
  } catch { /* ignore */ }
  return null;
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("قاعدة البيانات غير مهيأة");
  await setDoc(doc(db, "admin_settings", key), { key, value, updated_at: now() }, { merge: true });
}

/* ── Orders ───────────────────────────────────── */

export async function fetchOrders(): Promise<any[]> {
  const all = await colAll("orders");
  return all.sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
}

export async function fetchOrdersByPhone(phone: string): Promise<any[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const snap = await getDocs(query(collection(db, "orders"), where("customer_phone", "==", phone)));
    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) })) as any[];
    return rows.sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
  } catch { return []; }
}

export async function insertOrderDoc(order: { id: string } & Record<string, unknown>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("قاعدة البيانات غير مهيأة");
  await setDoc(doc(db, "orders", order.id), stripId(order));
}

export async function updateOrderDoc(id: string, data: Record<string, unknown>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("قاعدة البيانات غير مهيأة");
  await updateDoc(doc(db, "orders", id), { ...data, updated_at: now() });
}

export async function deleteOrderDoc(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  try { await deleteDoc(doc(db, "orders", id)); } catch { /* ignore */ }
}

export async function migrateLegacyOrderStatus(): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const snap = await getDocs(query(collection(db, "orders"), where("status", "==", "جديد")));
    for (const d of snap.docs) {
      await updateDoc(d.ref, { status: "قيد المعالجة", updated_at: now() });
    }
  } catch { /* ignore */ }
}

export async function migrateMissingCaseIds(generate: (existing: string[]) => string): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const all = await fetchOrders();
    const existing = all.map((o) => o.case_id).filter(Boolean) as string[];
    for (const o of all) {
      if (!o.case_id) {
        const caseId = generate(existing);
        existing.push(caseId);
        await updateDoc(doc(db, "orders", o.id), { case_id: caseId, updated_at: now() });
      }
    }
  } catch { /* ignore */ }
}

export async function collectAllCaseIds(): Promise<string[]> {
  const ids: string[] = [];
  try {
    const orders = await fetchOrders();
    orders.forEach((o) => { if (o.case_id) ids.push(o.case_id); });
  } catch { /* ignore */ }
  return ids;
}

/* ── Storage (product images) ─────────────────── */

export async function uploadProductImage(file: File): Promise<string> {
  const db = getDb();
  if (!db || !_storage) throw new Error("قاعدة البيانات غير مهيأة");
  let upload = file;
  try {
    const { optimizeImage } = await import("../optimize-image");
    upload = await optimizeImage(file);
  } catch { /* use original */ }
  const ext = (upload.name.split(".").pop() || "jpg").toLowerCase();
  const path = `product-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  try {
    const storageRef = ref(_storage, path);
    await uploadBytes(storageRef, upload, { contentType: upload.type });
    return await getDownloadURL(storageRef);
  } catch (e: any) {
    if (upload.size <= 700 * 1024) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("فشل قراءة الملف"));
        reader.readAsDataURL(upload);
      });
      return dataUrl;
    }
    throw new Error(e?.message || "تعذر رفع الصورة — الحد الأقصى بدون تخزين سحابي هو 700KB");
  }
}
