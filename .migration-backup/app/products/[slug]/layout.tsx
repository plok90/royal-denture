import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data } = await supabase
      .from("products")
      .select("name, name_ar, description, image_url")
      .eq("slug", slug)
      .single()

    if (!data) {
      return { title: "Ø§Ù„Ù…Ù†ØªØ¬ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯ | ROYAL DENTURE" }
    }

    return {
      title: `${data.name_ar} | ROYAL DENTURE`,
      description: data.description,
      openGraph: {
        title: data.name_ar,
        description: data.description,
        images: [{ url: data.image_url }],
      },
      twitter: {
        card: "summary_large_image",
        title: data.name_ar,
        description: data.description,
      },
    }
  } catch {
    return { title: "ROYAL DENTURE" }
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children
}
