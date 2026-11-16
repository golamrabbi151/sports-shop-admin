/**
 * DEMO-ONLY admin "database", persisted in this browser's localStorage so every
 * CRUD screen works before the backend exists. Seeded deterministically.
 * Never used when NEXT_PUBLIC_USE_MOCK_API=false.
 */
import type { Brand, Category, OrderStatus, PaymentMethod, PaymentStatus } from '@/types';
import type {
  AdminCoupon,
  AdminOrder,
  AdminProduct,
  AdminReview,
  AdminUser,
  Courier,
  Customer,
  OrderEvent,
  StoreSettings,
} from '@/types/admin';
import { BRANDS, CATEGORIES, COUPONS, PRODUCTS } from './catalog';
import { BD_LOCATIONS } from './locations';

const STORAGE_KEY = 'kb_admin_demo_db_v1';

export type StaffRecord = AdminUser & { password: string };

export interface DemoDb {
  products: AdminProduct[];
  categories: Category[];
  brands: Brand[];
  orders: AdminOrder[];
  customers: Customer[];
  coupons: AdminCoupon[];
  reviews: AdminReview[];
  staff: StaffRecord[];
  settings: StoreSettings;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ['Rakib', 'Nusrat', 'Tanvir', 'Farhana', 'Sabbir', 'Mehedi', 'Ayesha', 'Imran', 'Sadia', 'Arif', 'Tasnim', 'Rafi', 'Jannat', 'Shakib', 'Mim', 'Fahim', 'Riya', 'Naeem', 'Sumaiya', 'Asif', 'Lamia', 'Zubair', 'Anika', 'Hasib', 'Tania'];
const LAST = ['Hasan', 'Jahan', 'Ahmed', 'Rahman', 'Khan', 'Hossain', 'Siddiqua', 'Mahmud', 'Islam', 'Chowdhury', 'Akter', 'Kabir', 'Sarker', 'Uddin', 'Begum'];
const AREAS = ['Mirpur 10', 'Dhanmondi', 'Uttara Sector 7', 'Banani', 'Mohammadpur', 'Bashundhara R/A', 'Agrabad', 'Zindabazar', 'Shaheb Bazar', 'Sonadanga', 'Kandirpar', 'Gulshan 1'];
const STAFF_NAMES = ['Nadia (Support)', 'Karim (Manager)', 'System'];

function seed(): DemoDb {
  const rnd = mulberry32(20261116);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)];
  const now = Date.now();
  const DAY = 86_400_000;

  const products: AdminProduct[] = PRODUCTS.map((p, i) => ({
    ...p,
    sku: `KB-${p.category.slice(0, 3).toUpperCase()}-${1001 + i}`,
    status: i === PRODUCTS.length - 1 ? 'draft' : 'active',
    stock: i % 7 === 3 ? 0 : i % 5 === 2 ? 4 : p.stock,
    updatedAt: p.createdAt,
  }));

  const allDistricts = Object.values(BD_LOCATIONS).flat();
  const customers: Customer[] = Array.from({ length: 48 }, (_, i) => {
    const name = `${FIRST[i % FIRST.length]} ${pick(LAST)}`;
    return {
      id: `cus_${1000 + i}`,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}${i}@example.com`,
      phone: `01${pick(['3', '5', '6', '7', '8', '9'])}${String(Math.floor(rnd() * 1e8)).padStart(8, '0')}`,
      district: rnd() < 0.5 ? 'Dhaka' : pick(allDistricts),
      status: i === 7 ? 'blocked' : 'active',
      ordersCount: 0,
      totalSpent: 0,
      createdAt: new Date(now - (20 + Math.floor(rnd() * 300)) * DAY).toISOString(),
    };
  });

  const methods: PaymentMethod[] = ['cod', 'cod', 'cod', 'cod', 'cod', 'bkash', 'bkash', 'bkash', 'card', 'rocket', 'upay'];
  const couriers: Courier[] = ['Pathao', 'Steadfast', 'RedX', 'Steadfast', 'Pathao'];
  const flow: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const orders: AdminOrder[] = [];

  for (let i = 0; i < 190; i++) {
    const ageDays = Math.pow(rnd(), 1.35) * 90;
    const created = now - ageDays * DAY;
    const customer = pick(customers);
    const lineCount = rnd() < 0.7 ? 1 : 1 + Math.floor(rnd() * 3);
    const items = Array.from({ length: lineCount }, () => {
      const p = pick(products.filter((x) => x.status === 'active'));
      return {
        productId: p.id,
        name: p.name,
        image: p.images[0],
        price: p.price,
        quantity: rnd() < 0.85 ? 1 : 2,
        size: p.sizes ? pick(p.sizes) : undefined,
        color: p.colors?.[0]?.name,
      };
    });
    const subtotal = items.reduce((s, x) => s + x.price * x.quantity, 0);
    const discount = rnd() < 0.15 ? Math.round(subtotal * 0.1) : 0;
    const deliveryCharge = subtotal >= 5000 ? 0 : customer.district === 'Dhaka' ? 70 : 130;
    const method = pick(methods);

    let status: OrderStatus;
    const r = rnd();
    if (ageDays > 8) status = r < 0.86 ? 'delivered' : 'cancelled';
    else if (ageDays > 3) status = r < 0.5 ? 'delivered' : r < 0.85 ? 'shipped' : r < 0.93 ? 'processing' : 'cancelled';
    else if (ageDays > 1) status = r < 0.4 ? 'shipped' : r < 0.8 ? 'processing' : 'confirmed';
    else status = r < 0.45 ? 'pending' : r < 0.8 ? 'confirmed' : 'processing';

    const online = method !== 'cod';
    const paymentStatus: PaymentStatus =
      status === 'cancelled'
        ? online
          ? 'refunded'
          : 'unpaid'
        : online
          ? status === 'pending' && rnd() < 0.4
            ? 'pending'
            : 'paid'
          : status === 'delivered'
            ? 'paid'
            : 'unpaid';

    const reached = status === 'cancelled' ? (['pending', 'cancelled'] as OrderStatus[]) : flow.slice(0, flow.indexOf(status) + 1);
    const step = (Math.min(ageDays, 6) * DAY) / Math.max(reached.length, 2);
    const timeline: OrderEvent[] = reached.map((s, k) => ({
      type: 'status',
      status: s,
      at: new Date(created + k * step).toISOString(),
      by: k === 0 ? 'Customer' : pick(STAFF_NAMES),
      note: s === 'cancelled' ? pick(['Customer unreachable', 'Customer requested cancellation', 'Duplicate order']) : undefined,
    }));
    const courier = ['shipped', 'delivered'].includes(status)
      ? { name: pick(couriers), trackingId: String(Math.floor(10_000_000 + rnd() * 89_999_999)) }
      : undefined;

    orders.push({
      id: `ord_${(1000 + i).toString(36)}${i}`,
      orderNumber: `KB${String(26_100_000 + i * 37)}`,
      customerId: customer.id,
      items,
      subtotal,
      discount,
      deliveryCharge,
      total: subtotal - discount + deliveryCharge,
      status,
      paymentMethod: method,
      paymentStatus,
      transactionId:
        online && paymentStatus !== 'pending' ? `TRX${Math.floor(rnd() * 1e12).toString(36).toUpperCase()}` : undefined,
      courier,
      shipping: {
        fullName: customer.name,
        phone: customer.phone,
        email: customer.email,
        division: Object.entries(BD_LOCATIONS).find(([, ds]) => ds.includes(customer.district))?.[0] ?? 'Dhaka',
        district: customer.district,
        area: pick(AREAS),
        address: `House ${1 + Math.floor(rnd() * 80)}, Road ${1 + Math.floor(rnd() * 20)}`,
        note: rnd() < 0.15 ? 'Please call before delivery' : undefined,
      },
      timeline,
      createdAt: new Date(created).toISOString(),
    });
  }
  orders.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  for (const c of customers) {
    const mine = orders.filter((o) => o.customerId === c.id && o.status !== 'cancelled');
    c.ordersCount = mine.length;
    c.totalSpent = mine.reduce((s, o) => s + o.total, 0);
    c.lastOrderAt = mine[0]?.createdAt;
  }

  const reviews: AdminReview[] = products.flatMap((p) =>
    (p.reviews ?? []).map((rv) => ({
      ...rv,
      productId: p.id,
      productName: p.name,
      productImage: p.images[0],
      status: 'approved' as const,
    })),
  );
  [
    'Delivery took longer than expected but the product is fine.',
    'Is this original? The logo looks slightly different from the website.',
    'Excellent! Exactly as described. Will order again.',
    'Size runs small — order one size up.',
    'Best price in BD for this item. Thanks KhelaBD!',
  ].forEach((comment, i) => {
    const p = products[(i * 5) % products.length];
    reviews.unshift({
      id: `rv_new_${i}`,
      author: `${FIRST[(i * 3) % FIRST.length]} ${LAST[i].charAt(0)}.`,
      location: ['Dhaka', 'Sylhet', 'Khulna', 'Rajshahi', 'Cumilla'][i],
      rating: [3, 2, 5, 4, 5][i],
      comment,
      createdAt: new Date(now - i * 0.6 * DAY).toISOString(),
      productId: p.id,
      productName: p.name,
      productImage: p.images[0],
      status: 'pending',
    });
  });

  const coupons: AdminCoupon[] = [
    ...COUPONS.map((c, i) => ({
      ...c,
      id: `cp_${i + 1}`,
      active: true,
      usedCount: [142, 58, 233][i],
      usageLimit: i === 1 ? 500 : undefined,
    })),
    {
      id: 'cp_4',
      code: 'EID2026',
      type: 'percent',
      value: 15,
      minOrder: 3000,
      description: 'Eid special — 15% off over ৳3,000',
      active: false,
      usedCount: 412,
      usageLimit: 1000,
      expiresAt: new Date(now - 30 * DAY).toISOString(),
    },
  ];

  const staff: StaffRecord[] = [
    { id: 'adm_1', name: 'Rafiq Ahmed', email: 'admin@khelabd.com', role: 'super_admin', active: true, password: 'Admin@123', createdAt: new Date(now - 400 * DAY).toISOString(), lastLoginAt: new Date(now - 2 * 3_600_000).toISOString() },
    { id: 'adm_2', name: 'Karim Uddin', email: 'manager@khelabd.com', role: 'manager', active: true, password: 'Manager@123', createdAt: new Date(now - 200 * DAY).toISOString(), lastLoginAt: new Date(now - DAY).toISOString() },
    { id: 'adm_3', name: 'Nadia Islam', email: 'support@khelabd.com', role: 'support', active: true, password: 'Support@123', createdAt: new Date(now - 90 * DAY).toISOString(), lastLoginAt: new Date(now - 5 * 3_600_000).toISOString() },
  ];

  const settings: StoreSettings = {
    storeName: 'KhelaBD',
    hotline: '09612-345678',
    email: 'support@khelabd.com',
    address: 'House 12, Road 7, Dhanmondi, Dhaka 1205',
    announcement: 'Cash on Delivery across all 64 districts',
    delivery: { insideDhaka: 70, outsideDhaka: 130, freeThreshold: 5000 },
    payments: { cod: true, bkash: true, rocket: true, upay: true, card: true },
    codMaxAmount: 25000,
    lowStockThreshold: 10,
    flashSaleEndsAt: new Date(now + DAY).toISOString(),
    maintenanceMode: false,
  };

  return {
    products,
    categories: CATEGORIES.map((c) => ({ ...c })),
    brands: BRANDS.map((b) => ({ ...b })),
    orders,
    customers,
    coupons,
    reviews,
    staff,
    settings,
  };
}

let cache: DemoDb | null = null;

function load(): DemoDb {
  if (cache) return cache;
  if (typeof window === 'undefined') return seed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return (cache = JSON.parse(raw) as DemoDb);
  } catch {
    /* corrupted → reseed */
  }
  cache = seed();
  persist();
  return cache;
}

function persist() {
  if (typeof window === 'undefined' || !cache) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Quota exceeded (e.g. many uploaded images) — keep working in memory.
  }
}

export const db = {
  read: (): DemoDb => load(),
  write<T>(fn: (d: DemoDb) => T): T {
    const d = load();
    const out = fn(d);
    persist();
    return out;
  },
  reset() {
    cache = seed();
    persist();
  },
};

export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
