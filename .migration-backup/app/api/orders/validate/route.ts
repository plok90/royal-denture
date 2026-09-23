import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { items, name, phone } = await request.json()

    const errors: Record<string, string> = {}

    if (!items || !Array.isArray(items) || items.length === 0) {
      errors.products = "اختر منتجاً واحداً على الأقل"
    }
    if (!name?.trim()) {
      errors.name = "الاسم مطلوب"
    }
    if (!phone?.trim()) {
      errors.phone = "رقم الهاتف مطلوب"
    } else {
      const digits = phone.trim().replace(/[^\d]/g, "")
      if (digits.length < 9 || digits.length > 15) {
        errors.phone = "رقم الهاتف غير صحيح"
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ valid: false, errors }, { status: 400 })
    }

    return NextResponse.json({ valid: true })
  } catch {
    return NextResponse.json(
      { valid: false, errors: { general: "خطأ في الخادم" } },
      { status: 500 }
    )
  }
}