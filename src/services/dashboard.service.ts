import { ENDPOINTS } from '@/config/api';
import { http } from '@/lib/api/client';
import { withMock } from '@/lib/api/mock';
import { db } from '@/mocks/db';
import type { OrderStatus, PaymentMethod } from '@/types';
import type { AdminOrder, DashboardStats } from '@/types/admin';
import { requirePerm } from './_mock-guard';

const pct = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

function compute(fromIso: string, toIso: string): DashboardStats {
  const d = db.read();
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  const span = to - from;
  const inRange = (o: AdminOrder, a: number, b: number) => {
    const t = new Date(o.createdAt).getTime();
    return t >= a && t <= b;
  };
  const counted = (o: AdminOrder) => o.status !== 'cancelled';

  const cur = d.orders.filter((o) => inRange(o, from, to));
  const prev = d.orders.filter((o) => inRange(o, from - span, from));
  const curPaid = cur.filter(counted);
  const prevPaid = prev.filter(counted);
  const revenue = curPaid.reduce((s, o) => s + o.total, 0);
  const prevRevenue = prevPaid.reduce((s, o) => s + o.total, 0);
  const aov = curPaid.length ? revenue / curPaid.length : 0;
  const prevAov = prevPaid.length ? prevRevenue / prevPaid.length : 0;
  const newCust = d.customers.filter((c) => +new Date(c.createdAt) >= from && +new Date(c.createdAt) <= to).length;
  const prevNewCust = d.customers.filter(
    (c) => +new Date(c.createdAt) >= from - span && +new Date(c.createdAt) < from,
  ).length;

  // daily series (zero-filled)
  const buckets = new Map<string, { revenue: number; orders: number }>();
  for (let t = from; t <= to; t += 86_400_000) buckets.set(dayKey(new Date(t)), { revenue: 0, orders: 0 });
  for (const o of curPaid) {
    const b = buckets.get(dayKey(new Date(o.createdAt)));
    if (b) {
      b.revenue += o.total;
      b.orders += 1;
    }
  }

  const statuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const methods: PaymentMethod[] = ['cod', 'bkash', 'rocket', 'upay', 'card'];

  const sold = new Map<string, { sold: number; revenue: number }>();
  for (const o of curPaid)
    for (const i of o.items) {
      const s = sold.get(i.productId) ?? { sold: 0, revenue: 0 };
      s.sold += i.quantity;
      s.revenue += i.price * i.quantity;
      sold.set(i.productId, s);
    }

  return {
    range: { from: fromIso, to: toIso },
    revenue,
    orders: cur.length,
    newCustomers: newCust,
    avgOrderValue: aov,
    change: {
      revenue: pct(revenue, prevRevenue),
      orders: pct(cur.length, prev.length),
      newCustomers: pct(newCust, prevNewCust),
      avgOrderValue: pct(aov, prevAov),
    },
    series: [...buckets.entries()].map(([date, v]) => ({ date, ...v })),
    byStatus: statuses.map((status) => ({ status, count: cur.filter((o) => o.status === status).length })),
    byPayment: methods.map((method) => {
      const list = curPaid.filter((o) => o.paymentMethod === method);
      return { method, count: list.length, amount: list.reduce((s, o) => s + o.total, 0) };
    }),
    topProducts: [...sold.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([id, v]) => {
        const p = d.products.find((x) => x.id === id);
        return { id, name: p?.name ?? 'Deleted product', image: p?.images[0] ?? '', ...v };
      }),
    lowStock: d.products
      .filter((p) => p.status === 'active' && p.stock <= d.settings.lowStockThreshold)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6)
      .map((p) => ({ id: p.id, name: p.name, image: p.images[0], stock: p.stock, sku: p.sku })),
    lowStockCount: d.products.filter((p) => p.status === 'active' && p.stock <= d.settings.lowStockThreshold).length,
    recentOrders: d.orders.slice(0, 6),
    pendingOrders: d.orders.filter((o) => o.status === 'pending').length,
    pendingReviews: d.reviews.filter((r) => r.status === 'pending').length,
  };
}

export const dashboardService = {
  stats: (from: string, to: string) =>
    withMock<DashboardStats>(
      () => {
        requirePerm('dashboard.view');
        return compute(from, to);
      },
      () => http.get(ENDPOINTS.dashboard, { params: { from, to } }),
    ),
};
