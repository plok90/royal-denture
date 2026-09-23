import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "./supabase";
import { Order } from "./types";

const LOCAL_ORDERS_KEY = "rd_orders_fallback";

function generateCaseId(existingIds: string[]): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 100; i++) {
    const id =
      chars[Math.floor(Math.random() * chars.length)] +
      chars[Math.floor(Math.random() * chars.length)];
    if (!existingIds.includes(id)) return id;
  }
  return Date.now().toString(36).toUpperCase().slice(-2);
}

function buildOrder(
  name: string,
  phone: string,
  notes: string,
  items: { product_id: string; name: string; name_ar: string; quantity: number; price: number }[],
  total: number,
  caseId: string
): Order {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    case_id: caseId,
    customer_name: name,
    customer_phone: phone,
    notes,
    items,
    total,
    status: "قيد المعالجة",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function getLocalOrders(): Promise<Order[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveOrderToLocal(order: Order) {
  try {
    const existing = await getLocalOrders();
    existing.unshift(order);
    await AsyncStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(existing));
  } catch {
    /* ignore */
  }
}

export async function saveOrder(
  name: string,
  phone: string,
  notes: string,
  items: { product_id: string; name: string; name_ar: string; quantity: number; price: number }[],
  total: number
): Promise<void> {
  const supabase = createClient();
  let existingIds: string[] = [];
  if (supabase) {
    const { data } = await supabase.from("orders").select("case_id");
    if (data) existingIds = (data as any[]).map((o) => o.case_id).filter(Boolean);
  }
  const local = await getLocalOrders();
  local.forEach((o) => {
    if (o.case_id) existingIds.push(o.case_id);
  });
  const caseId = generateCaseId(existingIds);
  const order = buildOrder(name, phone, notes, items, total, caseId);

  if (supabase) {
    const { error } = await supabase.from("orders").insert(order);
    if (!error) {
      await saveOrderToLocal(order);
      return;
    }
  }
  await saveOrderToLocal(order);
}

export async function fetchOrdersByPhone(phone: string): Promise<Order[]> {
  const supabase = createClient();
  const all: Order[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_phone", phone)
      .order("created_at", { ascending: false });
    if (data) all.push(...(data as any[]));
  }
  const local = await getLocalOrders();
  all.push(...local.filter((o) => o.customer_phone === phone));
  const seen = new Set<string>();
  return all.filter((o) => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });
}

export function buildWhatsAppMessage(
  selectedItems: { productId: string; quantity: number }[],
  products: { id: string; name: string; price: number }[],
  total: number,
  name: string,
  phone: string,
  notes: string
): string {
  const lines = selectedItems.map((item, i) => {
    const p = products.find((p) => p.id === item.productId)!;
    return `${i + 1}. ${p.name} × ${item.quantity} — ${(p.price * item.quantity).toLocaleString("ar-IQ")} د.ع`;
  });
  let msg = `مرحباً Royal Denture\n\nأرغب بطلب المنتجات التالية:\n\n${lines.join("\n")}\n\n`;
  msg += `الإجمالي: ${total.toLocaleString("ar-IQ")} د.ع\n\n`;
  msg += `الاسم: ${name}\nالهاتف: ${phone}`;
  if (notes.trim()) msg += `\n\nملاحظات:\n${notes}`;
  msg += "\n\nشكراً لكم";
  return msg;
}
