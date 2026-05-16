import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    await supabase.from("products").select("id", { count: "exact", head: true })
    return new Response("ok", { status: 200 })
  } catch {
    return new Response("ok", { status: 200 })
  }
}
