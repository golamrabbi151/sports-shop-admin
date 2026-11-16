import type { Brand, Category, Coupon, Order, OrderStatus, PaymentMethod, PaymentStatus, Product, ProductReview } from './index';

/* ───────────── Access control ───────────── */
export type AdminRole = 'super_admin' | 'manager' | 'support';

export type Permission =
  | 'dashboard.view'
  | 'products.view'
  | 'products.manage'
  | 'catalog.manage'
  | 'orders.view'
  | 'orders.manage'
  | 'customers.view'
  | 'customers.manage'
  | 'coupons.manage'
  | 'reviews.manage'
  | 'settings.manage'
  | 'staff.manage';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export type StaffInput = Pick<AdminUser, 'name' | 'email' | 'role' | 'active'> & { password?: string };

/* ───────────── Catalogue ───────────── */
export type ProductStatus = 'active' | 'draft' | 'archived';

export interface AdminProduct extends Product {
  sku: string;
  status: ProductStatus;
  updatedAt: string;
}

/** Payload for create/update. The server generates id, timestamps and rating. */
export type ProductInput = Omit<AdminProduct, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount' | 'reviews'>;

export type CategoryInput = Omit<Category, 'id' | 'productCount'>;
export type BrandInput = Omit<Brand, 'id'>;

export interface ProductQuery extends ListQuery {
  category?: string;
  status?: ProductStatus;
  /** low = at/below threshold (incl. out of stock), out = zero stock */
  stock?: 'low' | 'out';
}

/* ───────────── Orders ───────────── */
export interface OrderEvent {
  type: 'status' | 'payment' | 'courier' | 'note';
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  note?: string;
  at: string;
  by: string;
}

export const COURIERS = ['Pathao', 'Steadfast', 'RedX', 'Sundarban', 'eCourier', 'Paperfly', 'Own rider'] as const;
export type Courier = (typeof COURIERS)[number];

export interface AdminOrder extends Order {
  customerId?: string;
  transactionId?: string;
  courier?: { name: Courier; trackingId: string };
  timeline: OrderEvent[];
}

export interface OrderQuery extends ListQuery {
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  from?: string;
  to?: string;
}

/* ───────────── Customers ───────────── */
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  status: 'active' | 'blocked';
  ordersCount: number;
  totalSpent: number;
  lastOrderAt?: string;
  createdAt: string;
}

export interface CustomerQuery extends ListQuery {
  status?: Customer['status'];
}

/* ───────────── Coupons & reviews ───────────── */
export interface AdminCoupon extends Coupon {
  id: string;
  active: boolean;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string;
}
export type CouponInput = Omit<AdminCoupon, 'id' | 'usedCount'>;

export type ReviewStatus = 'pending' | 'approved' | 'hidden';
export interface AdminReview extends ProductReview {
  productId: string;
  productName: string;
  productImage: string;
  status: ReviewStatus;
}
export interface ReviewQuery extends ListQuery {
  status?: ReviewStatus;
}

/* ───────────── Settings ───────────── */
export interface StoreSettings {
  storeName: string;
  hotline: string;
  email: string;
  address: string;
  announcement: string;
  delivery: { insideDhaka: number; outsideDhaka: number; freeThreshold: number };
  payments: Record<PaymentMethod, boolean>;
  /** Max order total allowed for Cash on Delivery (fraud control). */
  codMaxAmount: number;
  lowStockThreshold: number;
  flashSaleEndsAt?: string;
  maintenanceMode: boolean;
}

/* ───────────── Dashboard ───────────── */
export interface DashboardStats {
  range: { from: string; to: string };
  revenue: number;
  orders: number;
  newCustomers: number;
  avgOrderValue: number;
  /** % change vs. the previous period of equal length (null when no prior data) */
  change: { revenue: number | null; orders: number | null; newCustomers: number | null; avgOrderValue: number | null };
  series: { date: string; revenue: number; orders: number }[];
  byStatus: { status: OrderStatus; count: number }[];
  byPayment: { method: PaymentMethod; count: number; amount: number }[];
  topProducts: { id: string; name: string; image: string; sold: number; revenue: number }[];
  lowStock: { id: string; name: string; image: string; stock: number; sku: string }[];
  /** Total active products at/below the low-stock threshold (lowStock is the top few). */
  lowStockCount: number;
  recentOrders: AdminOrder[];
  pendingOrders: number;
  pendingReviews: number;
}

/* ───────────── Shared ───────────── */
export interface ListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  /** "field:asc" | "field:desc" */
  sort?: string;
}
