import { ENDPOINTS } from '@/config/api';
import { http } from '@/lib/api/client';
import { withMock } from '@/lib/api/mock';
import { cleanParams, paginate } from '@/lib/utils';
import { db } from '@/mocks/db';
import type { Paginated } from '@/types';
import type { AdminReview, ReviewQuery, ReviewStatus } from '@/types/admin';
import { requirePerm } from './_mock-guard';

export const reviewService = {
  list: (query: ReviewQuery) =>
    withMock<Paginated<AdminReview>>(
      () => {
        requirePerm('reviews.manage');
        let rows = db.read().reviews;
        if (query.status) rows = rows.filter((r) => r.status === query.status);
        return paginate(rows, { sort: 'createdAt:desc', ...query }, [(r) => r.author, (r) => r.productName, (r) => r.comment]);
      },
      () => http.get(ENDPOINTS.reviews.list, { params: cleanParams(query) }),
    ),
  setStatus: (ids: string[], status: ReviewStatus) =>
    withMock(
      () => {
        requirePerm('reviews.manage');
        db.write((d) => d.reviews.forEach((r) => ids.includes(r.id) && (r.status = status)));
        return { ok: true };
      },
      () => Promise.all(ids.map((id) => http.patch(ENDPOINTS.reviews.detail(id), { status }))).then(() => ({ ok: true })),
    ),
  remove: (id: string) =>
    withMock(
      () => {
        requirePerm('reviews.manage');
        db.write((d) => (d.reviews = d.reviews.filter((r) => r.id !== id)));
        return { ok: true };
      },
      () => http.delete<{ ok: boolean }>(ENDPOINTS.reviews.detail(id)),
    ),
};
