import { ENDPOINTS } from '@/config/api';
import { http } from '@/lib/api/client';
import { withMock } from '@/lib/api/mock';
import { cleanParams, paginate } from '@/lib/utils';
import { db } from '@/mocks/db';
import type { Paginated } from '@/types';
import type { AdminOrder, Customer, CustomerQuery } from '@/types/admin';
import { notFound, requirePerm } from './_mock-guard';

export const customerService = {
  list: (query: CustomerQuery) =>
    withMock<Paginated<Customer>>(
      () => {
        requirePerm('customers.view');
        let rows = db.read().customers;
        if (query.status) rows = rows.filter((c) => c.status === query.status);
        return paginate(rows, { sort: 'totalSpent:desc', ...query }, [(c) => c.name, (c) => c.email, (c) => c.phone, (c) => c.district]);
      },
      () => http.get(ENDPOINTS.customers.list, { params: cleanParams(query) }),
    ),

  get: (id: string) =>
    withMock<{ customer: Customer; orders: AdminOrder[] }>(
      () => {
        requirePerm('customers.view');
        const d = db.read();
        const customer = d.customers.find((c) => c.id === id) ?? notFound('Customer');
        return { customer, orders: d.orders.filter((o) => o.customerId === id) };
      },
      () => http.get(ENDPOINTS.customers.detail(id)),
    ),

  setStatus: (id: string, status: Customer['status']) =>
    withMock<Customer>(
      () => {
        requirePerm('customers.manage');
        return db.write((d) => {
          const c = d.customers.find((x) => x.id === id) ?? notFound('Customer');
          c.status = status;
          return c;
        });
      },
      () => http.patch(ENDPOINTS.customers.status(id), { status }),
    ),
};
