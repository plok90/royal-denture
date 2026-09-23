// Seed Firestore with the Vite app schema (products with slug/stage/is_active,
// testimonials, admin_settings). Also purges old-schema product docs.
const projectId = "royal-8f319"
const apiKey = "AIzaSyApMwJXzNTfYvev_7UGEnifOu0FbX6A1vI"
const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`

function fsValue(v) {
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
  if (typeof v === "boolean") return { booleanValue: v }
  if (v === null || v === undefined) return { nullValue: null }
  return { stringValue: String(v) }
}

function toFields(data) {
  const fields = {}
  for (const [k, v] of Object.entries(data)) fields[k] = fsValue(v)
  return { fields }
}

async function listDocs(collectionId) {
  const res = await fetch(`${base}/${collectionId}?pageSize=300&key=${apiKey}`)
  if (!res.ok) return []
  const json = await res.json()
  return (json.documents || []).map(d => d.name)
}

function docUrl(name) {
  return name.startsWith("http") ? name : `https://firestore.googleapis.com/v1/${name}`
}

async function deleteDoc(name) {
  const res = await fetch(`${docUrl(name)}?key=${apiKey}`, { method: "DELETE" })
  return res.ok || res.status === 404
}

async function setDoc(collectionId, docId, data) {
  const res = await fetch(`${base}/${collectionId}/${docId}?key=${apiKey}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toFields(data)),
  })
  if (!res.ok) {
    console.error(`FAIL ${collectionId}/${docId}:`, res.status, (await res.text()).slice(0, 300))
    return false
  }
  return true
}

const now = new Date().toISOString()

const products = [
  {
    slug: "complete-dentures",
    name: "Complete Dentures",
    name_ar: "أطقم الأسنان الكاملة",
    description: "أطقم أسنان كاملة مصنوعة من مواد عالية الجودة بملاءمة مثالية ومظهر طبيعي، مع ضمان الراحة الكاملة أثناء الاستخدام.",
    price: 250000,
    delivery_days: "7 أيام",
    badge: "الأكثر طلباً",
    image_url: "/images/arrangement.jpg",
    sort_order: 1,
    is_active: true,
    stage: 2,
    created_at: now,
    updated_at: now,
  },
  {
    slug: "partial-dentures",
    name: "Partial Dentures",
    name_ar: "الأطقم الجزئية",
    description: "أطقم جزئية مرنة أو معدنية لتعويض الأسنان المفقودة مع الحفاظ على الأسنان المتبقية، بتصميم خفي ومريح.",
    price: 180000,
    delivery_days: "5 أيام",
    badge: null,
    image_url: "/images/record-base.jpg",
    sort_order: 2,
    is_active: true,
    stage: 2,
    created_at: now,
    updated_at: now,
  },
  {
    slug: "zirconia-crown",
    name: "Zirconia Crown",
    name_ar: "تاج زركونيا",
    description: "تاج أسنان زركونيا عالي الجودة والمتانة بدقة عالية وتطابق تام مع باقي الأسنان.",
    price: 150000,
    delivery_days: "3-5 أيام",
    badge: null,
    image_url: "/images/product.jpg",
    sort_order: 3,
    is_active: true,
    stage: 2,
    created_at: now,
    updated_at: now,
  },
  {
    slug: "pfm-crown",
    name: "PFM Crown",
    name_ar: "تاج معدني خزفي",
    description: "تاج معدني مغطى بالخزف بجودة ممتازة وثبات عالٍ، مناسب لجميع الحالات.",
    price: 90000,
    delivery_days: "3-5 أيام",
    badge: null,
    image_url: "/images/mounting.jpg",
    sort_order: 4,
    is_active: true,
    stage: 2,
    created_at: now,
    updated_at: now,
  },
  {
    slug: "crowns-bridges",
    name: "Crowns & Bridges",
    name_ar: "التيجان والجسور",
    description: "تيجان وجسور زيركون ومعدنية بدقة عالية وتطابق تام، مصنوعة بأحدث التقنيات الرقمية لنتائج مثالية.",
    price: 100000,
    delivery_days: "3 أيام",
    badge: null,
    image_url: "/images/mounting.jpg",
    sort_order: 5,
    is_active: true,
    stage: 3,
    created_at: now,
    updated_at: now,
  },
  {
    slug: "veneers",
    name: "Veneers",
    name_ar: "فينير الأسنان",
    description: "قشور فينير خزفية رقيقة لتصحيح لون وشكل الأسنان الأمامية، بلمسة تجميلية احترافية تمنحك ابتسامة مثالية.",
    price: 150000,
    delivery_days: "5 أيام",
    badge: "جديد",
    image_url: "/images/product.jpg",
    sort_order: 6,
    is_active: true,
    stage: 3,
    created_at: now,
    updated_at: now,
  },
  {
    slug: "dental-implants",
    name: "Dental Implants",
    name_ar: "زراعة الأسنان",
    description: "تعويض فوري للأسنان المزروعة بتقنيات متقدمة، مع تيجان مخصصة تدوم لسنوات طويلة بأعلى معايير الجودة.",
    price: 450000,
    delivery_days: "14 يوم",
    badge: null,
    image_url: "/images/bite-rim.jpg",
    sort_order: 7,
    is_active: true,
    stage: 3,
    created_at: now,
    updated_at: now,
  },
]

const testimonials = [
  {
    id: "t1",
    text: "خدمة ممتازة وطقم أسنان بمقاسات مضبوطة تماماً، العمل دقيق والتسليم كان بالموعد المحدد. أنصح بهم بقوة.",
    author: "د. أحمد - عيادة أسنان",
    sort_order: 1,
    created_at: now,
  },
  {
    id: "t2",
    text: "أفضل مختبر تعاملت معه، الجودة عالية والأسعار مناسبة والتعامل راقي جداً. شكراً مختبر الأسنان الملكي.",
    author: "أبو محمد",
    sort_order: 2,
    created_at: now,
  },
  {
    id: "t3",
    text: "طلبت تيجان زيركون للمريض وطلعت النتيجة فوق التوقع، الملاءمة كانت ممتازة بدون أي تعديلات.",
    author: "د. سارة",
    sort_order: 3,
    created_at: now,
  },
]

const settings = [
  { key: "whatsapp_number", value: "9647766463735" },
  { key: "site_title", value: "ROYAL DENTURE" },
  { key: "site_subtitle", value: "مختبر الأسنان الملكي" },
  { key: "site_tagline", value: "اختر ما يناسبك والباقي علينا" },
]

const stages = [
  { number: 2, title: "المرحلة الثانية", sort_order: 1, is_active: true, updated_at: now },
  { number: 3, title: "المرحلة الثالثة", sort_order: 2, is_active: true, updated_at: now },
]

let ok = true

// Purge old-schema products (missing slug/stage/is_active)
const oldProducts = await listDocs("products")
for (const name of oldProducts) {
  const id = name.split("/").pop()
  if (!products.some(p => p.slug === id)) {
    const did = await deleteDoc(name)
    if (!did) ok = false
    console.log("deleted old product", id)
  }
}

// Purge old non-Vite testimonials with auto ids t1..t3 will be overwritten; remove unknown ones
const oldTestimonials = await listDocs("testimonials")
for (const name of oldTestimonials) {
  const id = name.split("/").pop()
  if (!testimonials.some(t => t.id === id)) {
    await deleteDoc(name)
    console.log("deleted old testimonial", id)
  }
}

// Legacy `settings` collection from Next.js app -> migrate into admin_settings
try {
  const legacy = await listDocs("settings")
  for (const name of legacy) {
    const res = await fetch(`${docUrl(name)}?key=${apiKey}`)
    if (!res.ok) continue
    const doc = await res.json()
    const k = doc.fields?.key?.stringValue || name.split("/").pop()
    const v = doc.fields?.value?.stringValue || ""
    if (!settings.some(s => s.key === k)) settings.push({ key: k, value: v })
    await deleteDoc(name)
    console.log("migrated legacy setting", k)
  }
} catch { /* ignore */ }

for (const p of products) ok = (await setDoc("products", p.slug, p)) && ok
for (const t of testimonials) ok = (await setDoc("testimonials", t.id, t)) && ok
for (const s of settings) ok = (await setDoc("admin_settings", s.key, { ...s, updated_at: now })) && ok
for (const st of stages) ok = (await setDoc("stages", String(st.number), st)) && ok

console.log(ok ? "SEED DONE ✔" : "SEED FAILED ✘")
