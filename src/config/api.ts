/**
 * ════════════════════════════════════════════════════════════════
 *  API CONFIGURATION — the only file you need to touch when the
 *  backend is ready.
 *
 *  1. Set NEXT_PUBLIC_API_BASE_URL in .env.local
 *  2. Set NEXT_PUBLIC_USE_MOCK_API=false
 *  3. Adjust the paths below to match your backend routes
 *  4. If your backend wraps responses differently, edit
 *     `unwrapResponse` in src/lib/api/client.ts
 * ════════════════════════════════════════════════════════════════
 */

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  useMock: (process.env.NEXT_PUBLIC_USE_MOCK_API ?? 'true') !== 'false',
  timeout: 20_000,
  mockLatency: 250,
} as const;

const id = (v: string) => encodeURIComponent(v);

export const ENDPOINTS = {
  auth: {
    login: '/admin/auth/login', // POST { email, password } -> { user, accessToken? }
    logout: '/admin/auth/logout', // POST
    me: '/admin/auth/me', // GET -> AdminUser
    password: '/admin/auth/password', // PUT { currentPassword, newPassword }
  },
  dashboard: '/admin/dashboard', // GET ?from=&to= -> DashboardStats
  uploads: '/admin/uploads', // POST multipart/form-data { file } -> { url }
  products: {
    list: '/admin/products', // GET ?q=&category=&status=&stock=low|out&page=&pageSize=&sort=field:dir
    create: '/admin/products', // POST ProductInput
    detail: (pid: string) => `/admin/products/${id(pid)}`, // GET | PUT ProductInput | DELETE
    bulk: '/admin/products/bulk', // PATCH { ids, patch } | POST /bulk-delete { ids }
    bulkDelete: '/admin/products/bulk-delete',
  },
  categories: {
    list: '/admin/categories', // GET | POST
    detail: (cid: string) => `/admin/categories/${id(cid)}`, // PUT | DELETE
  },
  brands: {
    list: '/admin/brands',
    detail: (bid: string) => `/admin/brands/${id(bid)}`,
  },
  orders: {
    list: '/admin/orders', // GET ?q=&status=&paymentMethod=&paymentStatus=&from=&to=&page=&pageSize=&sort=
    detail: (oid: string) => `/admin/orders/${id(oid)}`,
    status: (oid: string) => `/admin/orders/${id(oid)}/status`, // PATCH { status, note }
    payment: (oid: string) => `/admin/orders/${id(oid)}/payment`, // PATCH { paymentStatus, note }
    courier: (oid: string) => `/admin/orders/${id(oid)}/courier`, // PATCH { name, trackingId }
    notes: (oid: string) => `/admin/orders/${id(oid)}/notes`, // POST { note }
  },
  customers: {
    list: '/admin/customers', // GET ?q=&status=&page=&pageSize=&sort=
    detail: (cid: string) => `/admin/customers/${id(cid)}`, // GET -> { customer, orders }
    status: (cid: string) => `/admin/customers/${id(cid)}/status`, // PATCH { status }
  },
  coupons: {
    list: '/admin/coupons', // GET | POST
    detail: (cid: string) => `/admin/coupons/${id(cid)}`, // PUT | DELETE
  },
  reviews: {
    list: '/admin/reviews', // GET ?status=&q=&page=&pageSize=
    detail: (rid: string) => `/admin/reviews/${id(rid)}`, // PATCH { status } | DELETE
  },
  settings: '/admin/settings', // GET | PUT StoreSettings
  staff: {
    list: '/admin/staff', // GET | POST { name, email, role, password }
    detail: (sid: string) => `/admin/staff/${id(sid)}`, // PUT | DELETE
  },
} as const;
