/* ──────────────────────────────────────────────────────────
 * Domain types SHARED with the storefront (khela-bd/src/types/index.ts).
 * Keep both copies identical, or move them into a shared package.
 * ────────────────────────────────────────────────────────── */

export type ID = string;

export interface Category {
  id: ID;
  slug: string;
  name: string;
  tagline: string;
  image: string;
  /** Accent colour used for the category tile */
  color: string;
  productCount: number;
}

export interface Brand {
  id: ID;
  slug: string;
  name: string;
}

export interface ProductReview {
  id: ID;
  author: string;
  location: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Product {
  id: ID;
  slug: string;
  name: string;
  brand: string;
  category: string; // category slug
  price: number; // BDT
  compareAtPrice?: number; // BDT, original price for discounts
  rating: number;
  reviewCount: number;
  stock: number;
  images: string[];
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  shortDescription: string;
  description: string;
  highlights: string[];
  specs: Record<string, string>;
  tags: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  isFlashSale?: boolean;
  reviews?: ProductReview[];
  createdAt: string;
}

export type SortOption = 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';

export interface ProductQuery {
  q?: string;
  category?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CartItem {
  /** Unique line key: productId + size + color */
  key: string;
  productId: ID;
  slug: string;
  name: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  stock: number;
  size?: string;
  color?: string;
}

export type PaymentMethod = 'cod' | 'bkash' | 'rocket' | 'upay' | 'card';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email?: string;
  division: string;
  district: string;
  area: string;
  address: string;
  note?: string;
}

/**
 * What the client sends when placing an order.
 * NOTE: prices are intentionally NOT sent — the server must look up prices,
 * stock, delivery charge and coupon value itself to prevent tampering.
 */
export interface CreateOrderPayload {
  items: { productId: ID; quantity: number; size?: string; color?: string }[];
  shipping: ShippingAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}

export interface OrderItem {
  productId: ID;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface Order {
  id: ID;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shipping: ShippingAddress;
  createdAt: string;
}

export interface PaymentInitResponse {
  paymentId: string;
  /** Hosted payment page (bKash / Rocket / Upay / SSLCommerz etc.) */
  redirectUrl: string;
}

export interface PaymentVerifyResponse {
  orderId: ID;
  paymentStatus: PaymentStatus;
  transactionId?: string;
}

export interface Coupon {
  code: string;
  type: 'percent' | 'flat' | 'free_shipping';
  value: number;
  minOrder: number;
  description: string;
}

export interface User {
  id: ID;
  name: string;
  email: string;
  phone: string;
}

export interface LoginPayload {
  /** Email or phone */
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  /** Only if your backend uses bearer tokens. Prefer HttpOnly cookies. */
  accessToken?: string;
}
