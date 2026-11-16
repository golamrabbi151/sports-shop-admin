import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/types';

export const ADMIN = {
  name: 'KhelaBD Admin',
  storeUrl: process.env.NEXT_PUBLIC_STORE_URL ?? 'https://sports-shop-henna.vercel.app/',
  idleTimeoutMinutes: Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES ?? 30),
} as const;

export const PAYMENT_METHODS: Record<PaymentMethod, { name: string; short: string; color: string; textColor: string }> = {
  cod: { name: 'Cash on Delivery', short: 'COD', color: '#0F172A', textColor: '#fff' },
  bkash: { name: 'bKash', short: 'bKash', color: '#E2136E', textColor: '#fff' },
  rocket: { name: 'Rocket', short: 'Rocket', color: '#8C3494', textColor: '#fff' },
  upay: { name: 'Upay', short: 'Upay', color: '#FFC20E', textColor: '#0B2A5B' },
  card: { name: 'Card', short: 'Card', color: '#1E3A8A', textColor: '#fff' },
};

export const ORDER_STATUS: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'gold' },
  confirmed: { label: 'Confirmed', color: 'blue' },
  processing: { label: 'Processing', color: 'geekblue' },
  shipped: { label: 'Shipped', color: 'purple' },
  delivered: { label: 'Delivered', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; color: string }> = {
  unpaid: { label: 'Unpaid', color: 'default' },
  pending: { label: 'Pending', color: 'gold' },
  paid: { label: 'Paid', color: 'green' },
  failed: { label: 'Failed', color: 'red' },
  refunded: { label: 'Refunded', color: 'purple' },
};

/** Allowed order status transitions (the backend must enforce the same). */
export const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};
