"use client"

import { useEffect } from "react"
import Image from "next/image"
import { Product } from "@/lib/types"

interface ImageLightboxProps {
  product: Product | null
  onClose: () => void
  darkMode: boolean
}

export function ImageLightbox({ product, onClose, darkMode }: ImageLightboxProps) {
  useEffect(() => {
    if (!product) return
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEscape)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [product, onClose])

  if (!product) return null

  const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%233a1f10" width="400" height="300"/%3E%3C/svg%3E'
  const surface = darkMode ? "#1a0a05" : "#fff"
  const surfaceBorder = darkMode ? "#3a1f10" : "#ddd5c8"
  const textPrimary = darkMode ? "#f5efe6" : "#1a0a05"
  const textMuted = darkMode ? "#8a7060" : "#9a8878"

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[200] p-3 sm:p-6"
      style={{ animation: "fadeIn 0.2s ease" }}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.92) translateY(12px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
      
      <div
        className="relative max-w-3xl w-full rounded-xl sm:rounded-2xl overflow-hidden"
        style={{ 
          background: surface, 
          border: `1px solid ${surfaceBorder}`,
          boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px ${surfaceBorder}33`,
          animation: "scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 hover:scale-105 transition-all shadow-lg"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Badge */}
        {product.badge && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-[#c9a84c] text-[#1a0a05] text-[10px] sm:text-xs font-semibold tracking-wide px-2.5 py-1 sm:px-3 sm:py-1 rounded-full z-20 shadow-md">
            {product.badge}
          </div>
        )}

        {/* Image */}
        <div className="relative w-full max-h-[55vh] min-h-[200px] bg-gradient-to-b from-black/30 via-black/10 to-black/30 flex items-center justify-center p-4 sm:p-6">
          <Image
            fill
            src={product.image_url}
            alt={product.name}
            placeholder="blur"
            blurDataURL={FALLBACK_IMG}
            onError={(e) => { const t = e.target as HTMLImageElement; if (!t.dataset.err) { t.dataset.err = "1"; t.src = FALLBACK_IMG; } }}
            className="object-contain rounded-lg"
            style={{
              filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.3))",
            }}
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${surfaceBorder}, transparent)`, opacity: 0.5 }} />

        {/* Product Details */}
        <div className="p-5 sm:p-7 text-right" dir="rtl">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0">
              <h2 
                className="text-lg sm:text-xl font-semibold mb-0.5 leading-tight truncate"
                style={{ color: textPrimary }}
              >
                {product.name}
              </h2>
              <p className="text-xs sm:text-sm opacity-80" style={{ color: textMuted }}>{product.name_ar}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg sm:text-2xl font-bold text-[#c9a84c] tracking-tight whitespace-nowrap">
                {product.price.toLocaleString("ar-IQ")} <span className="text-xs sm:text-sm font-medium">د.ع</span>
              </p>
              {product.delivery_days && (
                <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: textMuted }}>
                  {product.delivery_days}
                </p>
              )}
            </div>
          </div>

          {product.description && (
            <p 
              className="text-xs sm:text-sm leading-relaxed sm:leading-relaxed"
              style={{ color: textMuted }}
            >
              {product.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
