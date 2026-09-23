export interface Product {
  id: string;
  slug: string;
  name: string;
  name_ar: string;
  description: string;
  price: number;
  delivery_days: string;
  badge?: string | null;
  image_url: string;
  sort_order: number;
  stage?: number;
}

export interface Testimonial {
  id: string;
  text: string;
  author?: string | null;
  sort_order: number;
}

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  case_id?: string;
  customer_name: string;
  customer_phone: string;
  notes: string;
  items: { product_id: string; name: string; name_ar: string; quantity: number; price: number }[];
  total: number;
  status: string;
  assigned_to?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
}
