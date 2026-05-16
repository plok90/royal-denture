import { FormErrors, Order } from "./types"
import { createClient } from "./supabase/client"

export function validateOrder(
  selectedItems: { productId: string; quantity: number }[],
  name: string,
  phone: string
): FormErrors {
  const errs: FormErrors = {}
  if (selectedItems.length === 0) errs.products = "اختر منتجاً واحداً على الأقل"
  if (!name.trim()) errs.name = "الاسم مطلوب"
  if (!phone.trim()) {
    errs.phone = "رقم الهاتف مطلوب"
  } else {
    const digits = phone.trim().replace(/[^\d]/g, "")
    if (digits.length < 9 || digits.length > 15) errs.phone = "رقم الهاتف غير صحيح"
  }
  return errs
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
    const p = products.find((p) => p.id === item.productId)!
    return `${i + 1}. ${p.name} × ${item.quantity} — ${(p.price * item.quantity).toLocaleString("ar-IQ")} د.ع`
  })

  let msg = `مرحباً Royal Denture\n\nأرغب بطلب المنتجات التالية:\n\n${lines.join("\n")}\n\n`
  msg += `الإجمالي: ${total.toLocaleString("ar-IQ")} د.ع\n\n`
  msg += `الاسم: ${name}\nالهاتف: ${phone}`
  if (notes.trim()) msg += `\n\nملاحظات:\n${notes}`
  msg += "\n\nشكراً لكم"

  return msg
}

export function buildCompletionMessage(
  customerName: string,
  items: { name?: string; name_ar?: string; quantity: number }[],
  total: number,
): string {
  let msg = `عزيزي ${customerName}، تم اكتمال طلبكم في Royal Denture ✅\n\n`
  items.forEach((item, i) => {
    msg += `${i + 1}. ${item.name_ar || item.name} × ${item.quantity}\n`
  })
  msg += `\nالإجمالي: ${total.toLocaleString("ar-IQ")} د.ع`
  msg += `\n\nشكراً لتعاملكم معنا 🙏`
  return msg
}

const LOCAL_ORDERS_KEY = "rd_orders_fallback"
const SETTINGS_KEY = "rd_orders"

export async function saveOrder(
  name: string,
  phone: string,
  notes: string,
  items: { product_id: string; name: string; name_ar: string; quantity: number; price: number }[],
  total: number,
): Promise<void> {
  const order = buildOrder(name, phone, notes, items, total)
  const supabase = createClient()
  if (supabase) {
    const { error } = await supabase.from("orders").insert(order)
    if (!error) {
      saveOrderToLocal(order)
      return
    }
    console.warn("orders insert:", error.code, error.message)
    const saved = await saveOrderToSettings(supabase, order)
    if (saved) { saveOrderToLocal(order); return }
  }
  saveOrderToLocal(order)
}

async function saveOrderToSettings(supabase: ReturnType<typeof createClient>, order: Order): Promise<boolean> {
  try {
    const { data } = await supabase.from("admin_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle()
    const orders: Order[] = data?.value ? JSON.parse(data.value) : []
    orders.unshift(order)
    const { error } = await supabase.from("admin_settings").upsert(
      { key: SETTINGS_KEY, value: JSON.stringify(orders) },
      { onConflict: "key", ignoreDuplicates: false }
    )
    return !error
  } catch { return false }
}

export async function getSettingsOrders(): Promise<Order[]> {
  const supabase = createClient()
  if (!supabase) return []
  try {
    const { data } = await supabase.from("admin_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle()
    return data?.value ? JSON.parse(data.value) : []
  } catch { return [] }
}

function buildOrder(
  name: string,
  phone: string,
  notes: string,
  items: { product_id: string; name: string; name_ar: string; quantity: number; price: number }[],
  total: number,
): Order {
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    customer_name: name,
    customer_phone: phone,
    notes,
    items,
    total,
    status: "قيد المعالجة",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function saveOrderToLocal(order: Order) {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY)
    const existing: Order[] = raw ? JSON.parse(raw) : []
    existing.unshift(order)
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(existing))
  } catch { /* ignore storage errors */ }
}

export function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY)
    let orders: Order[] = raw ? JSON.parse(raw) : []
    // Migrate old "جديد" status to "قيد المعالجة"
    let changed = false
    orders = orders.map(o => {
      if (o.status === "جديد") { changed = true; return { ...o, status: "قيد المعالجة" } }
      return o
    })
    if (changed) localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders))
    return orders
  } catch { return [] }
}

export function removeLocalOrder(id: string) {
  try {
    const orders = getLocalOrders().filter(o => o.id !== id)
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders))
  } catch { /* ignore */ }
}

export async function removeSettingsOrder(id: string): Promise<void> {
  const supabase = createClient()
  if (!supabase) return
  try {
    const { data } = await supabase.from("admin_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle()
    if (!data?.value) return
    const orders: Order[] = JSON.parse(data.value).filter((o: Order) => o.id !== id)
    await supabase.from("admin_settings").upsert(
      { key: SETTINGS_KEY, value: JSON.stringify(orders) },
      { onConflict: "key", ignoreDuplicates: false }
    )
  } catch { /* ignore */ }
}

export async function updateSettingsOrderStatus(id: string, status: string): Promise<void> {
  const supabase = createClient()
  if (!supabase) return
  try {
    const { data } = await supabase.from("admin_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle()
    if (!data?.value) return
    const orders: Order[] = JSON.parse(data.value).map((o: Order) =>
      o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o
    )
    await supabase.from("admin_settings").upsert(
      { key: SETTINGS_KEY, value: JSON.stringify(orders) },
      { onConflict: "key", ignoreDuplicates: false }
    )
  } catch { /* ignore */ }
}

export async function updateSettingsOrderAssignment(id: string, assignedTo: string): Promise<void> {
  const supabase = createClient()
  if (!supabase) return
  try {
    const { data } = await supabase.from("admin_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle()
    if (!data?.value) return
    const orders: Order[] = JSON.parse(data.value).map((o: Order) =>
      o.id === id ? { ...o, assigned_to: assignedTo, updated_at: new Date().toISOString() } : o
    )
    await supabase.from("admin_settings").upsert(
      { key: SETTINGS_KEY, value: JSON.stringify(orders) },
      { onConflict: "key", ignoreDuplicates: false }
    )
  } catch { /* ignore */ }
}

export async function updateSupabaseOrderAssignment(id: string, assignedTo: string): Promise<void> {
  const supabase = createClient()
  if (!supabase) return
  const { error } = await supabase.from("orders").update({ assigned_to: assignedTo }).eq("id", id)
  if (error) {
    await updateSettingsOrderAssignment(id, assignedTo)
  }
}

export async function updateSettingsOrderInternalNotes(id: string, notes: string): Promise<void> {
  const supabase = createClient()
  if (!supabase) return
  try {
    const { data } = await supabase.from("admin_settings").select("value").eq("key", SETTINGS_KEY).maybeSingle()
    if (!data?.value) return
    const orders: Order[] = JSON.parse(data.value).map((o: Order) =>
      o.id === id ? { ...o, internal_notes: notes, updated_at: new Date().toISOString() } : o
    )
    await supabase.from("admin_settings").upsert(
      { key: SETTINGS_KEY, value: JSON.stringify(orders) },
      { onConflict: "key", ignoreDuplicates: false }
    )
  } catch { /* ignore */ }
}

export function getCustomerData(orders: any[], products?: any[]): { phone: string; name: string; orderCount: number; total: number; lastOrder: string; stages: string }[] {
  const map = new Map<string, { name: string; orderCount: number; total: number; lastOrder: string; stages: Set<number> }>()
  for (const o of orders) {
    const phone = o.customer_phone || "unknown"
    const existing = map.get(phone) || { name: o.customer_name || "", orderCount: 0, total: 0, lastOrder: "", stages: new Set<number>() }
    existing.orderCount++
    existing.total += Number(o.total) || 0
    if (!existing.lastOrder || o.created_at > existing.lastOrder) existing.lastOrder = o.created_at
    if (!existing.name) existing.name = o.customer_name || ""
    if (products && Array.isArray(o.items)) {
      for (const item of o.items) {
        let p = products.find((pp: any) => pp.id === item.product_id)
        if (!p) p = products.find((pp: any) => pp.name === item.name || pp.name_ar === item.name_ar)
        if (p) existing.stages.add(p.stage)
      }
    }
    map.set(phone, existing)
  }
  return Array.from(map.entries()).map(([phone, data]) => {
    let stages = "الثالثة"
    if (data.stages.has(2) && data.stages.has(3)) stages = "مختلط"
    else if (data.stages.has(2)) stages = "الثانية"
    return { phone, name: data.name, orderCount: data.orderCount, total: data.total, lastOrder: data.lastOrder, stages }
  })
}

export function getOrderStats(orders: any[]) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  let today = 0, week = 0, month = 0, totalRevenue = 0
  const productCount = new Map<string, number>()

  for (const o of orders) {
    const date = new Date(o.created_at)
    if (date >= todayStart) today++
    if (date >= weekStart) week++
    if (date >= monthStart) month++
    totalRevenue += Number(o.total) || 0
    if (Array.isArray(o.items)) {
      for (const item of o.items) {
        const name = item.name_ar || item.name || "unknown"
        productCount.set(name, (productCount.get(name) || 0) + (item.quantity || 1))
      }
    }
  }

  const topProducts = Array.from(productCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  return { today, week, month, totalRevenue, topProducts }
}

export function exportOrdersToHTML(orders: any[], products?: any[]): string {
  const rows = orders.map(o => {
    const items = Array.isArray(o.items)
      ? o.items.map((i: any) => `${i.name_ar || i.name} ×${i.quantity}`).join("<br>")
      : ""
    let stage = "—"
    if (products && Array.isArray(o.items)) {
      const stages = new Set<number>()
      for (const item of o.items) {
        let p = products.find((pp: any) => pp.id === item.product_id)
        if (!p) p = products.find((pp: any) => pp.name === item.name || pp.name_ar === item.name_ar)
        if (p) stages.add(p.stage)
      }
      if (stages.has(2) && stages.has(3)) stage = "مختلط"
      else if (stages.has(2)) stage = "الثانية"
      else if (stages.has(3)) stage = "الثالثة"
    }
    return `<tr>
      <td style="padding:8px 10px;border:1px solid #3a1f10;font-size:12px">${o.id?.slice(0, 8) || "—"}</td>
      <td style="padding:8px 10px;border:1px solid #3a1f10;font-size:12px">${o.customer_name || ""}</td>
      <td style="padding:8px 10px;border:1px solid #3a1f10;font-size:12px;direction:ltr">${o.customer_phone || ""}</td>
      <td style="padding:8px 10px;border:1px solid #3a1f10;font-size:12px">${items}</td>
      <td style="padding:8px 10px;border:1px solid #3a1f10;font-size:12px">${stage}</td>
      <td style="padding:8px 10px;border:1px solid #3a1f10;font-size:12px">${(o.total || 0).toLocaleString("ar-IQ")} د.ع</td>
      <td style="padding:8px 10px;border:1px solid #3a1f10;font-size:12px">${o.assigned_to || "—"}</td>
      <td style="padding:8px 10px;border:1px solid #3a1f10;font-size:12px">${o.status || ""}</td>
      <td style="padding:8px 10px;border:1px solid #3a1f10;font-size:12px">${o.created_at ? new Date(o.created_at).toLocaleDateString("ar-IQ") : ""}</td>
    </tr>`
  }).join("")
  return `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>الطلبات</title></head><body style="font-family:'Cairo',sans-serif;background:#0d0502;color:#f5efe6;padding:20px">
    <h1 style="color:#c9a84c;text-align:center;font-family:serif">ROYAL DENTURE — الطلبات</h1>
    <table style="width:100%;border-collapse:collapse;margin-top:16px">
      <thead><tr style="background:#1a0a05;color:#8a7060">
        <th style="padding:10px;border:1px solid #3a1f10;font-size:11px">رقم الطلب</th>
        <th style="padding:10px;border:1px solid #3a1f10;font-size:11px">العميل</th>
        <th style="padding:10px;border:1px solid #3a1f10;font-size:11px">الهاتف</th>
        <th style="padding:10px;border:1px solid #3a1f10;font-size:11px">المنتجات</th>
        <th style="padding:10px;border:1px solid #3a1f10;font-size:11px">المرحلة</th>
        <th style="padding:10px;border:1px solid #3a1f10;font-size:11px">الإجمالي</th>
        <th style="padding:10px;border:1px solid #3a1f10;font-size:11px">العامل</th>
        <th style="padding:10px;border:1px solid #3a1f10;font-size:11px">الحالة</th>
        <th style="padding:10px;border:1px solid #3a1f10;font-size:11px">التاريخ</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></body></html>`
}
