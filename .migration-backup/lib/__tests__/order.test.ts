import { describe, it, expect } from "vitest"
import { validateOrder, buildWhatsAppMessage, buildCompletionMessage, getCustomerData, getOrderStats, exportOrdersToHTML } from "@/lib/order"
import { Product, OrderItem } from "@/lib/types"

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Record Base",
    name_ar: "ريكورد بيس",
    description: "قاعدة شمعية",
    price: 25000,
    delivery_days: "2–3 أيام",
    badge: "جديد",
    image_url: "/test.jpg",
    sort_order: 1,
    created_at: "",
    updated_at: "",
  },
  {
    id: "2",
    name: "Bite Block",
    name_ar: "بايت بلوك",
    description: "قالب إطباق",
    price: 15000,
    delivery_days: "1–2 أيام",
    badge: null,
    image_url: "/test2.jpg",
    sort_order: 2,
    created_at: "",
    updated_at: "",
  },
]

describe("validateOrder", () => {
  it("returns all errors when nothing provided", () => {
    const errs = validateOrder([], "", "")
    expect(errs.products).toBe("اختر منتجاً واحداً على الأقل")
    expect(errs.name).toBe("الاسم مطلوب")
    expect(errs.phone).toBe("رقم الهاتف مطلوب")
  })

  it("returns empty errors for valid input", () => {
    const items: OrderItem[] = [{ productId: "1", quantity: 2 }]
    const errs = validateOrder(items, "أحمد", "07761234567")
    expect(Object.keys(errs)).toHaveLength(0)
  })

  it("rejects short phone number", () => {
    const items: OrderItem[] = [{ productId: "1", quantity: 1 }]
    const errs = validateOrder(items, "أحمد", "123")
    expect(errs.phone).toBe("رقم الهاتف غير صحيح")
  })

  it("accepts phone with spaces, plus, dashes", () => {
    const items: OrderItem[] = [{ productId: "1", quantity: 1 }]
    const errs = validateOrder(items, "أحمد", "+964 776 646 3735")
    expect(errs.phone).toBeUndefined()
  })

  it("returns only products error when only products missing", () => {
    const errs = validateOrder([], "أحمد", "07761234567")
    expect(errs.products).toBeTruthy()
    expect(errs.name).toBeUndefined()
    expect(errs.phone).toBeUndefined()
  })
})

describe("buildWhatsAppMessage", () => {
  it("builds message with selected items", () => {
    const items: OrderItem[] = [
      { productId: "1", quantity: 2 },
      { productId: "2", quantity: 1 },
    ]
    const total = 25000 * 2 + 15000 * 1 // 65000
    const msg = buildWhatsAppMessage(items, mockProducts, total, "أحمد", "07761234567", "")

    expect(msg).toContain("مرحباً Royal Denture")
    expect(msg).toContain("Record Base × 2")
    expect(msg).toContain("Bite Block × 1")
    expect(msg).toContain("أحمد")
    expect(msg).toContain("07761234567")
    expect(msg).toContain("شكراً لكم")
    expect(msg).toContain("٦٥٬٠٠٠")
  })

  it("includes notes when provided", () => {
    const items: OrderItem[] = [{ productId: "1", quantity: 1 }]
    const msg = buildWhatsAppMessage(items, mockProducts, 25000, "أحمد", "07761234567", "عاجل من فضلك")
    expect(msg).toContain("عاجل من فضلك")
    expect(msg).toContain("ملاحظات")
  })

  it("does not include notes section when notes empty", () => {
    const items: OrderItem[] = [{ productId: "1", quantity: 1 }]
    const msg = buildWhatsAppMessage(items, mockProducts, 25000, "أحمد", "07761234567", "")
    expect(msg).not.toContain("ملاحظات")
  })
})

describe("buildCompletionMessage", () => {
  it("builds completion message with customer name, items, total, and thank you", () => {
    const items = [
      { name_ar: "ريكورد بيس", name: "Record Base", quantity: 2 },
      { name_ar: "بايت بلوك", name: "Bite Block", quantity: 1 },
    ]
    const msg = buildCompletionMessage("أحمد", items, 65000)

    expect(msg).toContain("أحمد")
    expect(msg).toContain("تم اكتمال طلبكم")
    expect(msg).toContain("Royal Denture")
    expect(msg).toContain("ريكورد بيس × 2")
    expect(msg).toContain("بايت بلوك × 1")
    expect(msg).toContain("شكراً لتعاملكم")
    expect(msg).toContain("٦٥٬٠٠٠")
  })

  it("falls back to name when name_ar is missing", () => {
    const items = [
      { name: "Record Base", quantity: 1 },
    ]
    const msg = buildCompletionMessage("أحمد", items, 25000)
    expect(msg).toContain("Record Base × 1")
  })

  it("handles empty items array", () => {
    const msg = buildCompletionMessage("أحمد", [], 0)
    expect(msg).toContain("أحمد")
    expect(msg).toContain("تم اكتمال طلبكم")
    expect(msg).not.toContain("×")
  })
})

const mockOrders = [
  { id: "1", customer_name: "أحمد", customer_phone: "07761234567", items: [{ name_ar: "ريكورد بيس", quantity: 2 }], total: 50000, status: "جديد", created_at: new Date().toISOString() },
  { id: "2", customer_name: "أحمد", customer_phone: "07761234567", items: [{ name_ar: "بايت بلوك", quantity: 1 }], total: 15000, status: "تم", created_at: new Date().toISOString() },
  { id: "3", customer_name: "سارة", customer_phone: "07901234567", items: [{ name_ar: "ريكورد بيس", quantity: 1 }], total: 25000, status: "جديد", created_at: new Date().toISOString() },
]

describe("getCustomerData", () => {
  it("groups orders by phone and computes stats", () => {
    const data = getCustomerData(mockOrders)
    expect(data).toHaveLength(2)
    const ahmed = data.find(d => d.phone === "07761234567")
    expect(ahmed).toBeDefined()
    expect(ahmed!.name).toBe("أحمد")
    expect(ahmed!.orderCount).toBe(2)
    expect(ahmed!.total).toBe(65000)
    const sara = data.find(d => d.phone === "07901234567")
    expect(sara).toBeDefined()
    expect(sara!.orderCount).toBe(1)
  })
})

describe("getOrderStats", () => {
  it("computes today/week/month counts and revenue", () => {
    const stats = getOrderStats(mockOrders)
    expect(stats.today).toBeGreaterThanOrEqual(3)
    expect(stats.week).toBeGreaterThanOrEqual(3)
    expect(stats.month).toBeGreaterThanOrEqual(3)
    expect(stats.totalRevenue).toBe(90000)
  })

  it("returns top products sorted by count", () => {
    const stats = getOrderStats(mockOrders)
    expect(stats.topProducts.length).toBeGreaterThan(0)
    const top = stats.topProducts[0]
    expect(top.name).toBe("ريكورد بيس")
    expect(top.count).toBe(3)
  })
})

describe("exportOrdersToHTML", () => {
  it("generates HTML table with order data", () => {
    const html = exportOrdersToHTML(mockOrders)
    expect(html).toContain("ROYAL DENTURE")
    expect(html).toContain("07761234567")
    expect(html).toContain("ريكورد بيس ×2")
    expect(html).toContain("<!DOCTYPE html>")
    expect(html).toContain("</table>")
  })

  it("returns HTML with empty table when no orders", () => {
    const html = exportOrdersToHTML([])
    expect(html).toContain("ROYAL DENTURE")
    expect(html).not.toContain("07761234567")
  })
})
