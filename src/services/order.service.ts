import { ENDPOINTS } from '@/config/api';
import { STATUS_FLOW } from '@/config/site';
import { http } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { withMock } from '@/lib/api/mock';
import { cleanParams, paginate } from '@/lib/utils';
import { db, type DemoDb } from '@/mocks/db';
import type { OrderStatus, Paginated, PaymentStatus } from '@/types';
import type { AdminOrder, Courier, OrderQuery } from '@/types/admin';
import { actorName, notFound, requirePerm } from './_mock-guard';

function mutateOrder(id: string, fn: (o: AdminOrder, d: DemoDb) => void): AdminOrder {
  return db.write((d) => {
    const o = d.orders.find((x) => x.id === id);
    if (!o) notFound('Order');
    fn(o, d);
    return o;
  });
}

export const orderService = {
  list: (query: OrderQuery) =>
    withMock<Paginated<AdminOrder>>(
      () => {
        requirePerm('orders.view');
        let rows = db.read().orders;
        if (query.status) rows = rows.filter((o) => o.status === query.status);
        if (query.paymentMethod) rows = rows.filter((o) => o.paymentMethod === query.paymentMethod);
        if (query.paymentStatus) rows = rows.filter((o) => o.paymentStatus === query.paymentStatus);
        if (query.from) rows = rows.filter((o) => o.createdAt >= query.from!);
        if (query.to) rows = rows.filter((o) => o.createdAt <= query.to!);
        return paginate(rows, { sort: 'createdAt:desc', ...query }, [
          (o) => o.orderNumber,
          (o) => o.shipping.fullName,
          (o) => o.shipping.phone,
          (o) => o.transactionId,
          (o) => o.courier?.trackingId,
        ]);
      },
      () => http.get(ENDPOINTS.orders.list, { params: cleanParams(query) }),
    ),

  get: (id: string) =>
    withMock<AdminOrder>(
      () => {
        requirePerm('orders.view');
        return db.read().orders.find((o) => o.id === id) ?? notFound('Order');
      },
      () => http.get(ENDPOINTS.orders.detail(id)),
    ),

  updateStatus: (id: string, status: OrderStatus, note?: string) =>
    withMock<AdminOrder>(
      () => {
        requirePerm('orders.manage');
        return mutateOrder(id, (o, d) => {
          if (!STATUS_FLOW[o.status].includes(status))
            throw new ApiError(`Can’t change an order from “${o.status}” to “${status}”.`, 409);
          if (status === 'shipped' && !o.courier) throw new ApiError('Add the courier and tracking number before shipping.', 422);
          const at = new Date().toISOString();
          o.status = status;
          o.timeline.push({ type: 'status', status, note, at, by: actorName() });
          // Business rules the backend should also apply:
          if (status === 'delivered' && o.paymentMethod === 'cod' && o.paymentStatus !== 'paid') {
            o.paymentStatus = 'paid';
            o.timeline.push({ type: 'payment', paymentStatus: 'paid', note: 'Cash collected by rider', at, by: 'System' });
          }
          if (status === 'cancelled') {
            // restock
            o.items.forEach((i) => {
              const p = d.products.find((x) => x.id === i.productId);
              if (p) p.stock += i.quantity;
            });
          }
        });
      },
      () => http.patch(ENDPOINTS.orders.status(id), { status, note }),
    ),

  updatePayment: (id: string, paymentStatus: PaymentStatus, note?: string) =>
    withMock<AdminOrder>(
      () => {
        requirePerm('orders.manage');
        return mutateOrder(id, (o) => {
          o.paymentStatus = paymentStatus;
          o.timeline.push({ type: 'payment', paymentStatus, note, at: new Date().toISOString(), by: actorName() });
        });
      },
      () => http.patch(ENDPOINTS.orders.payment(id), { paymentStatus, note }),
    ),

  updateCourier: (id: string, name: Courier, trackingId: string) =>
    withMock<AdminOrder>(
      () => {
        requirePerm('orders.manage');
        return mutateOrder(id, (o) => {
          o.courier = { name, trackingId };
          o.timeline.push({ type: 'courier', note: `${name} · ${trackingId}`, at: new Date().toISOString(), by: actorName() });
        });
      },
      () => http.patch(ENDPOINTS.orders.courier(id), { name, trackingId }),
    ),

  addNote: (id: string, note: string) =>
    withMock<AdminOrder>(
      () => {
        requirePerm('orders.manage');
        return mutateOrder(id, (o) => {
          o.timeline.push({ type: 'note', note, at: new Date().toISOString(), by: actorName() });
        });
      },
      () => http.post(ENDPOINTS.orders.notes(id), { note }),
    ),
};
