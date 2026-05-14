export interface Product {
  id: string
  name: string
  name_ar: string
  description: string
  price: number
  delivery_days: string
  badge?: string | null
  image_url: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Testimonial {
  id: string
  text: string
  author?: string | null
  sort_order: number
  created_at: string
}

export interface AdminSetting {
  id: string
  key: string
  value: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  productId: string
  quantity: number
}

export interface Order {
  id: string
  customer_name: string
  customer_phone: string
  notes: string
  items: { product_id: string; name: string; name_ar: string; quantity: number; price: number }[]
  total: number
  status: string
  created_at: string
  updated_at: string
}

export interface FormErrors {
  name?: string
  phone?: string
  products?: string
}
