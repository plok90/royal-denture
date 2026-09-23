import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react"

export interface CartItem {
  productId: string
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  setQty: (id: string, qty: number) => void
  toggle: (id: string) => void
  addItem: (id: string) => void
  removeItem: (id: string) => void
  clear: () => void
  count: number
  totalQty: number
  isOpen: boolean
  setOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)
const STORAGE_KEY = "rd_cart"

function readInitial(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((i: any) => i && i.productId && Number(i.quantity) > 0)
      : []
  } catch { return [] }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readInitial)
  const [isOpen, setOpen] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { /* ignore */ }
  }, [items])

  const setQty = useCallback((id: string, qty: number) => {
    setItems(prev => {
      if (qty <= 0) return prev.filter(i => i.productId !== id)
      const exists = prev.find(i => i.productId === id)
      if (exists) return prev.map(i => i.productId === id ? { ...i, quantity: qty } : i)
      return [...prev, { productId: id, quantity: qty }]
    })
  }, [])

  const addItem = useCallback((id: string) => {
    setItems(prev => {
      const exists = prev.find(i => i.productId === id)
      if (exists) return prev.map(i => i.productId === id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { productId: id, quantity: 1 }]
    })
  }, [])

  const toggle = useCallback((id: string) => {
    setItems(prev => {
      const exists = prev.find(i => i.productId === id)
      if (exists) return prev.filter(i => i.productId !== id)
      return [...prev, { productId: id, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.productId !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const count = items.length
  const totalQty = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])

  const value = useMemo(() => ({
    items, setQty, toggle, addItem, removeItem, clear, count, totalQty, isOpen, setOpen,
  }), [items, setQty, toggle, addItem, removeItem, clear, count, totalQty, isOpen])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
