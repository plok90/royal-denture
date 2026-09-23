import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    const envUser = process.env.ADMIN_USERNAME
    const envPass = process.env.ADMIN_PASSWORD
    const envName = process.env.ADMIN_NAME || "مدير"

    if (!envUser || !envPass) {
      return NextResponse.json(
        { success: false, error: "لم يتم إعداد بيانات الدخول على الخادم" },
        { status: 500 }
      )
    }

    if (username === envUser && password === envPass) {
      return NextResponse.json({
        success: true,
        name: envName,
        username,
      })
    }

    return NextResponse.json(
      { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
      { status: 401 }
    )
  } catch {
    return NextResponse.json(
      { success: false, error: "خطأ في الاتصال بالخادم" },
      { status: 500 }
    )
  }
}