"use client"

import { useState } from "react"
import { Product } from "@/lib/types"
import { ClockIcon, ZoomIcon } from "./icons"

interface ProductCardProps {
  product: Product
  quantity: number
  onToggle: () => void
  onQuantityChange: (qty: number) => void
  onImageClick: () => void
  darkMode: boolean
}

export function ProductCard({ product, quantity, onToggle, onQuantityChange, onImageClick, darkMode }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const isSelected = quantity > 0

  const surface = darkMode ? "#1a0a05" : "#fff"
  const surfaceBorder = darkMode ? "#3a1f10" : "#ddd5c8"
  const textPrimary = darkMode ? "#f5efe6" : "#1a0a05"
  const textMuted = darkMode ? "#8a7060" : "#9a8878"

  const handleToggle = () => {
    if (quantity === 0) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 400)
    }
    onToggle()
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: surface,
        border: isSelected ? "1.5px solid #c9a84c" : `0.5px solid ${isHovered ? "#b8a898" : surfaceBorder}`,
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        boxShadow: isSelected ? "0 4px 20px rgba(201,168,76,0.15)" : isHovered ? "0 6px 24px rgba(26,10,5,0.1)" : "0 2px 12px rgba(26,10,5,0.05)",
        transform: isAnimating ? "scale(1.03)" : isHovered ? "translateY(-3px)" : "none",
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {product.badge && (
        <div className="absolute top-2.5 right-2.5 bg-[#c9a84c] text-[#1a0a05] text-[9px] font-semibold tracking-wide px-2 py-0.5 rounded-full z-10">
          {product.badge}
        </div>
      )}
      {isSelected && (
        <div className="absolute top-2.5 left-2.5 bg-[#c9a84c] text-[#1a0a05] text-[10px] font-semibold tracking-wider px-2.5 py-0.5 rounded-full z-10">
          ✓ مختار
        </div>
      )}

      <div
        className="relative group"
        style={{
          height: 120,
          background: isSelected ? "#251208" : darkMode ? "#1a0a05" : "#f9f5f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: `0.5px solid ${isSelected ? "#3a1f10" : surfaceBorder}`,
          transition: "background 0.2s",
          overflow: "hidden"
        }}
      >
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            onImageClick()
          }}
        />
        {/* Zoom overlay on hover */}
        <div 
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            onImageClick()
          }}
        >
          <ZoomIcon className="text-white w-8 h-8" />
        </div>
      </div>

      <div className="p-4">
        <p style={{ fontSize: 13, fontWeight: 600, color: textPrimary, letterSpacing: 0.5, marginBottom: 1 }}>{product.name}</p>
        <p style={{ fontSize: 11, color: textMuted, marginBottom: 6 }}>{product.name_ar}</p>
        <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.65, marginBottom: 8 }}>{product.description}</p>

        <div
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 mb-2.5"
          style={{ background: darkMode ? "#251208" : "#f4f0ea", border: `0.5px solid ${surfaceBorder}` }}
        >
          <ClockIcon className="text-[#9a8878]" />
          <span className="text-[10px]" style={{ color: textMuted }}>{product.delivery_days}</span>
        </div>

        <p className="text-[15px] font-semibold text-[#c9a84c] mb-3">{product.price.toLocaleString("ar-IQ")} د.ع</p>

        {isSelected ? (
          <div className="flex items-center border border-[#c9a84c] rounded-lg overflow-hidden">
            <button
              onClick={() => onQuantityChange(quantity - 1)}
              className="flex-1 py-2 bg-transparent text-[#c9a84c] text-lg hover:bg-[#c9a84c]/10 transition-colors"
            >
              −
            </button>
            <span className="flex-1 text-center text-sm font-semibold" style={{ color: textPrimary }}>{quantity}</span>
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              className="flex-1 py-2 bg-transparent text-[#c9a84c] text-lg hover:bg-[#c9a84c]/10 transition-colors"
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={handleToggle}
            className="w-full py-2.5 rounded-lg text-xs tracking-wide transition-colors"
            style={{ border: `0.5px solid ${surfaceBorder}`, background: "transparent", color: textMuted }}
          >
            إضافة إلى الطلب
          </button>
        )}
      </div>
    </div>
  )
}
