# PROJECT MAP — Royal Denture

## TECH_STACK

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router (static SPA) | 16.2.6 (LTS) |
| Language | TypeScript | 5.7.3 |
| Rendering | `use client` (homepage + admin) | — |
| Styling | Tailwind CSS v4 + inline style props | 4.2.0 |
| Backend | Supabase (direct client-side via @supabase/ssr) | ^2.105.4 |
| Storage | Supabase Storage (bucket: `product-images`) | — |
| Auth | Custom React context (hardcoded admin creds) for login; Supabase Auth only for data fetching | — |
| Icons | 20 custom SVG components in `components/icons.tsx` | — |
| Fonts | Geist, Geist Mono, Outfit (next/font) | — |
| Analytics | @vercel/analytics (production only) | 1.6.1 |
| Testing | vitest | 4.1.6 |

### Production Dependencies (6 packages)
`next`, `react`, `react-dom`, `@supabase/ssr`, `@supabase/supabase-js`, `@vercel/analytics`

### Dev Dependencies (7 packages)
`@tailwindcss/postcss`, `tailwindcss`, `tw-animate-css`, `postcss`, `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `vitest`

---

## SYSTEM_FLOW

```
User opens / → layout.tsx wraps with AdminProvider + ErrorBoundary
  → page.tsx mounts
    → useEffect: localStorage.getItem("rd_name","rd_phone")
    → useEffect: Promise.all([
        supabase.from("products").select("*").order("sort_order"),
        supabase.from("testimonials").select("*").order("sort_order"),
        supabase.from("admin_settings").eq("key","whatsapp_number").single()
      ])
    → isLoading=false → render full UI

User interacts:
  [Card click anywhere] → toggleProduct(id) → select if unselected, deselect if selected
    → orderItems[] updated → progress bar + total recalculated
    (Image click opens lightbox instead of toggling; +/- buttons change qty without toggling)
  [Error state] → if Supabase fetch fails, red error banner shown above products
  [Quantity +/-] → setQty(id, qty) → upsert/remove from orderItems
  [Dark mode toggle] → setDarkMode(!darkMode) → inline theme variables switch
  [Admin btn] → isAdmin? Link(/admin) : setShowLoginModal(true)
  [Submit] → validateOrder() from lib/order → errors? inline : setShowPreview(true)
  [Preview confirm] → buildWhatsAppMessage() from lib/order → window.open(wa.me/{number}?text=...)
  [Error] → ErrorBoundary (component) or error.tsx (page-level) catches → Arabic fallback UI

Admin page mount:
  [Full page load] → AdminProvider: isInitialized=false, isAdmin=false
    → useEffect fires → localStorage check → setIsAdmin/setIsInitialized
    → Admin page effect waits for isInitialized (no early redirect)
    → isAdmin=true? setAuthChecked=true, fetchData() → Dashboard renders
    → isAdmin=false? router.push("/") → redirected to home
  [Client nav after login] → AdminProvider already has isAdmin=true, isInitialized=true
    → page mounts: effect runs, !isAdmin is false → setAuthChecked=true → Dashboard
```

### Data Tables (Supabase)
- **products**: id, name, name_ar, description, price, delivery_days, badge?, image_url, sort_order, created_at, updated_at
- **testimonials**: id, text, author?, sort_order, created_at
- **admin_settings**: id, key (unique), value, created_at, updated_at

---

## ARCHITECTURE

```
dental-lab-app/
├── app/
│   ├── layout.tsx           ← Root: AdminProvider, ErrorBoundary, fonts, globals.css, metadata, PWA manifest
│   ├── globals.css          ← Tailwind v4 @theme tokens + tw-animate-css + dark variant
│   ├── page.tsx             ← HOME SPA: ~500 LoC, single `use client` default export
│   ├── error.tsx            ← Next.js error boundary (catches page-level render errors)
│   ├── products/
│   │   └── [slug]/
│   │       └── page.tsx     ← Product detail page (standalone, deep-link from WhatsApp/share)
│   └── admin/
│       └── page.tsx         ← ADMIN dashboard: ~800 LoC, 6 inline tab components (dashboard, products, orders, customers, + modals)
│
├── components/
│   ├── error-boundary.tsx   ← React class-based error boundary (catches layout-level errors)
│   ├── product-card.tsx     ← [ORPHAN] Unused, importable card component
│   ├── image-lightbox.tsx   ← Full-screen overlay, ESC to close, product detail + price
│   ├── admin-login-modal.tsx ← Credential form → validateAdmin() → redirect to /admin
│   ├── confirm-modal.tsx    ← Custom confirm dialog (gold/dark theme), replaces browser confirm()
│   └── icons.tsx            ← 20 SVG icon components (CrownIcon, WhatsAppIcon, etc.)
│
├── public/
│   ├── manifest.json        ← PWA manifest for installable app
│   └── icon.svg             ← App icon (SVG)
│
├── lib/
│   ├── types.ts             ← Product, Testimonial, AdminSetting, Order, OrderItem, FormErrors
│   ├── order.ts             ← Pure functions: validateOrder(), buildWhatsAppMessage(), buildCompletionMessage(), getCustomerData(), getOrderStats(), exportOrdersToHTML(), saveOrderToSettings(), getSettingsOrders(), removeSettingsOrder(), updateSettingsOrderStatus()
│   ├── admin-context.tsx    ← AdminProvider (Context), useAdmin hook, validateAdmin(), isInitialized flag, logout
│   ├── __tests__/
│   │   └── order.test.ts    ← Unit tests: 16 tests for validation + message builders + customer data + stats + HTML export
│   └── supabase/
│       └── client.ts       ← createBrowserClient with env var validation; returns null if missing; singleton pattern
│
├── .env.example             ← Template for Supabase credentials
├── vitest.config.ts         ← Vitest config with @/ alias resolution
├── postcss.config.mjs       ← @tailwindcss/postcss plugin
├── next.config.mjs          ← Next.js config
├── tsconfig.json            ← TypeScript config
└── package.json             ← 6 production + 9 dev dependencies
```

### Data Flow (no API routes — all client-side)
```
[Supabase DB] ──(supabase.from().select())──→ [useState in page.tsx]
                                                    ↓
[Supabase Storage] ←(admin uploads image)── [Admin ProductModal]
                                                    ↓
[localStorage] ←(useEffect on name/phone/orderItems change)── [persist form fields + cart]
                                                    ↓
[WhatsApp URL] ←(buildWhatsAppMessage → encodeURIComponent)── [Preview Modal → window.open]
                                                    ↓
[Supabase orders] ←(fire-and-forget insert after WhatsApp)── [save order to DB]
```

### Theme System
- `themePref` state ("light" | "dark" | "system") + `systemDark` from matchMedia → derived `darkMode` boolean
- 6 inline style variables: `bg`, `surface`, `surfaceBorder`, `textPrimary`, `textMuted`, `inputBg`
- Hero section always dark (`heroBg` #0d0502 in dark, #1a0a05 in light)
- No Tailwind `dark:` variants — all dynamic colors via inline `style={}` props
- Toggle button cycles: 🌙 (light) → ☀️ (dark) → 💻 (system) → light

---

## ORPHANS & PENDING

| Item | Status | Notes |
|---|---|---|
| `product-card.tsx` | 🗑️ Orphan | Not imported anywhere; inline card rendering in `page.tsx` is the active code. Safe to delete. |
| `.env.local` | 🔲 User action | Copy `.env.example` → `.env.local` and fill Supabase credentials. Admin page now handles missing config gracefully: shows error notification for all CRUD operations instead of crashing or silent failure. |
| Admin credentials | 🔒 By design | Hardcoded in `lib/admin-context.tsx:16-17` (`moamel@2005` / `plokplok09`). Admin page auth guard uses `useAdmin().isAdmin` (localStorage) — not Supabase Auth. |
| `isInitialized` flag | ✅ Added | `AdminProvider` now exposes `isInitialized` that goes `true` only after localStorage session check completes. Admin page auth guard waits for it before redirecting, fixing a race condition on hard page loads (Vercel production). |
| Supabase Storage bucket | 🔲 User action | Create `product-images` bucket (public) in Supabase dashboard |
| `styles/globals.css` | ✅ Resolved | Deleted (was duplicate of `app/globals.css`) |
| Unused deps | ✅ Resolved | Removed 33 unused packages (radix, shadcn, lucide, etc.) |
| Error boundary | ✅ Resolved | `components/error-boundary.tsx` + `app/error.tsx` with Arabic fallback UI |
| Image upload | ✅ Resolved | Now uses Supabase Storage `product-images` bucket |
| Phone validation | ✅ Resolved | Strips formatting chars, validates digit count (9–15) |
| Tests | ✅ Added | `lib/__tests__/order.test.ts` — 8 tests for `validateOrder` + `buildWhatsAppMessage` |
| Loading states | ✅ Complete | CrownIcon + animate-pulse |
| Form validation | ✅ Complete | Arabic error messages, field-level clearing on change |
| WhatsApp preview | ✅ Complete | Modal with items, total, customer info, notes |
| RTL layout | ✅ Complete | `direction:rtl`, Arabic UI throughout |
| Responsive grid | ✅ Complete | 1/2/4 cols products, 1/2/3 testimonials |
| Drag & Drop reorder (admin) | ✅ Complete | HTML5 DnD, swaps sort_order in Supabase |
| Custom confirm modal | ✅ Complete | Replaces browser confirm() for delete actions |
| Admin search/filter | ✅ Complete | Filters products by name/name_ar in real-time |
| Next.js Image | ✅ Complete | All product images use next/image (fill/width+height); unoptimized in config |
| Fetch error banner | ✅ Complete | Red error banner on main page when Supabase fetch fails |
| Cart persistence (localStorage) | ✅ Complete | orderItems saved/restored from rd_cart key; restore via useEffect to avoid hydration mismatch |
| Image fallback | ✅ Complete | onError handler replaces broken image with dark SVG |
| Image preview before upload | ✅ Complete | Local preview via URL.createObjectURL while uploading |
| Dark mode toggle (main + admin) | ✅ Complete | Simple boolean toggle button (🌙/☀️) in main page header and admin sidebar; dynamic theme via module-level `let` vars + getter style objects |
| Hamburger menu | ✅ Complete | ☰ button top-right opens dropdown with "تتبع طلبي" and "إدارة" links; replaces standalone admin link in header |
| Orders system | ✅ Complete | orders table (needs creation), fire-and-forget save on submit, admin tab with status management + detail modal, **delete order**, **complete order with WhatsApp message** (via `buildCompletionMessage` in `lib/order.ts`), **PDF export** (via `exportOrdersToHTML` لـ"قيد المعالجة" فقط), **customer grouping** (via `getCustomerData`), statuses: قيد المعالجة + تم فقط |
| Admin dashboard | ✅ Complete | Default tab showing product/order counts and recent orders |
| PWA | ✅ Complete | manifest.json with gold/dark theme; manifest link in metadata |
| Product detail page | ✅ Complete | /products/[slug] with full details, blur placeholder, add-to-order link with query param |
| Track order page | ✅ Complete | /track — phone lookup, shows ALL orders (completed ✓ + pending), auto-refresh every 30s, fetches from Supabase + localStorage fallback |
| Blur placeholder | ✅ Complete | blurDataURL on all product images (dark SVG placeholder) |
| **Orders table SQL** | 🔲 User action | Create `orders` table in Supabase dashboard using: `CREATE TABLE orders (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, customer_name TEXT NOT NULL, customer_phone TEXT NOT NULL, notes TEXT DEFAULT '', items JSONB NOT NULL, total NUMERIC NOT NULL, status TEXT DEFAULT 'قيد المعالجة', created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());` |
| Order save fallback | ✅ Complete | `saveOrder()` in `lib/order.ts` tries: 1) Supabase `orders` table 2) Supabase `admin_settings` (shared multi-device fallback via key `rd_orders`) 3) localStorage `rd_orders_fallback`. Admin page reads in same order. Cross-device order visibility guaranteed via `admin_settings` even when `orders` table is missing. Functions: `saveOrderToSettings()`, `getSettingsOrders()`. |
| Type cleanup | ✅ Complete | `lib/order.ts` no longer depends on `Product`/`OrderItem` from `lib/types`; uses inline types compatible with both `page.tsx` and `admin/page.tsx` local interfaces. |
| Removed testimonials & settings from admin | ✅ Complete | Removed nav buttons, tabs, CRUD functions, modals, types (`Testimonial`, `AdminSetting`), state, icon components (`MessageIcon`, `SettingsIcon`), and related data fetching from admin page. |
| **Customers tab** | ✅ Complete | جدول العملاء (هاتف، اسم، المرحلة، عدد الطلبات، إجمالي المشتريات، آخر طلب)، زر واتساب لكل عميل، ضغط ← يعرض طلبات العميل في نافذة منبثقة |
| **Dashboard statistics** | ✅ Complete | بطاقات عمودية (عدد المنتجات، المرحلة الثانية، الثالثة، الطلبات، اليوم/الأسبوع/الشهر، الإيرادات)، رسم بياني لأكثر 5 منتجات طلباً |
| **مرحلة الطلب** | ✅ Complete | شارة المرحلة (الثانية/الثالثة/مختلط) في بطاقات الطلبات، جدول العملاء، وتصدير HTML |
| **PDF export** | ✅ Complete | زر "تحميل التقرير" ينزّل ملف HTML بكل الطلبات (جميع الحالات) بكل التفاصيل |
| `exportOrdersToHTML` | ✅ Complete | في `lib/order.ts` — تحويل الطلبات إلى HTML مع عمود المرحلة 
| **حذف "جديد" من الحالات** | ✅ Complete | حالات الطلب الآن: "قيد المعالجة" و"تم" فقط |
| **تتبع الطلبات** | ✅ Complete | صفحة `/track` تعرض ALL طلبات الرقم (قديمة/جديدة، مكتملة/غير مكتملة) مع ✅ للمكتمل |
| **Admin افتراضي فاتح** | ✅ Complete | `darkMode` يبدأ بـ `false` (الوضع الصباحي) عند فتح صفحة الأدمن |
| `downloadHTML` | ✅ Complete | في `app/admin/page.tsx` — تحميل HTML كملف بدلاً من فتح نافذة منبثقة |
| `CustomerOrdersModal` | ✅ Complete | نافذة منبثقة تعرض جميع طلبات عميل مع إمكانية إكمال الطلب |
| Chart (top products) | ✅ Complete | رسم بياني بأشرطة HTML في DashboardTab، بدون مكتبات خارجية |
