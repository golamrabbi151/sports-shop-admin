import { ENDPOINTS } from '@/config/api';
import { http } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { withMock } from '@/lib/api/mock';
import { db, newId } from '@/mocks/db';
import type { AdminCoupon, CouponInput } from '@/types/admin';
import { requirePerm } from './_mock-guard';

const checkCode = (code: string, ignoreId?: string) => {
  if (db.read().coupons.some((c) => c.code === code && c.id !== ignoreId))
    throw new ApiError('Code already exists', 422, 'conflict', { code: 'This code is already in use' });
};

export const couponService = {
  list: () =>
    withMock<AdminCoupon[]>(
      () => {
        requirePerm('coupons.manage');
        return db.read().coupons;
      },
      () => http.get(ENDPOINTS.coupons.list),
    ),
  create: (input: CouponInput) =>
    withMock<AdminCoupon>(
      () => {
        requirePerm('coupons.manage');
        checkCode(input.code);
        const c = { ...input, id: newId('cp'), usedCount: 0 };
        db.write((d) => d.coupons.unshift(c));
        return c;
      },
      () => http.post(ENDPOINTS.coupons.list, input),
    ),
  update: (id: string, input: CouponInput) =>
    withMock<AdminCoupon>(
      () => {
        requirePerm('coupons.manage');
        checkCode(input.code, id);
        return db.write((d) => Object.assign(d.coupons.find((c) => c.id === id)!, input));
      },
      () => http.put(ENDPOINTS.coupons.detail(id), input),
    ),
  remove: (id: string) =>
    withMock(
      () => {
        requirePerm('coupons.manage');
        db.write((d) => (d.coupons = d.coupons.filter((c) => c.id !== id)));
        return { ok: true };
      },
      () => http.delete<{ ok: boolean }>(ENDPOINTS.coupons.detail(id)),
    ),
};
