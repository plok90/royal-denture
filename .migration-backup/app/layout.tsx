import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Outfit } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AdminProvider } from '@/lib/admin-context'
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const outfit = Outfit({ 
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-outfit"
});

export const metadata: Metadata = {
  title: 'ROYAL DENTURE',
  description: 'مختبر الأسنان الملكي - اختر ما يناسبك والباقي علينا. خدمات طب الأسنان بجودة عالية.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  keywords: ['dental', 'denture', 'مختبر أسنان', 'طب الأسنان', 'العراق'],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a0a05',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className={`bg-[#0d0502] ${outfit.variable}`}>
      <body className="font-sans antialiased bg-[#0d0502]">
        <AdminProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </AdminProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
