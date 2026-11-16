import { ENDPOINTS } from '@/config/api';
import { http } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { withMock } from '@/lib/api/mock';
import { blobToDataUrl, cleanParams, paginate, resizeImage } from '@/lib/utils';
import { db, newId } from '@/mocks/db';
import type { Paginated } from '@/types';
import type { AdminProduct, ProductInput, ProductQuery } from '@/types/admin';
import { notFound, requirePerm } from './_mock-guard';

function assertUnique(input: Pick<ProductInput, 'slug' | 'sku'>, ignoreId?: string) {
  const clash = db.read().products.find((p) => p.id !== ignoreId && (p.slug === input.slug || p.sku === input.sku));
  if (clash)
    throw new ApiError('Please fix the highlighted fields', 422, 'conflict', {
      ...(clash.slug === input.slug ? { slug: 'This URL slug is already used by another product' } : {}),
      ...(clash.sku === input.sku ? { sku: 'This SKU is already used' } : {}),
    });
}

export const productService = {
  list: (query: ProductQuery) =>
    withMock<Paginated<AdminProduct>>(
      () => {
        requirePerm('products.view');
        const { lowStockThreshold } = db.read().settings;
        let rows = db.read().products;
        if (query.category) rows = rows.filter((p) => p.category === query.category);
        if (query.status) rows = rows.filter((p) => p.status === query.status);
        if (query.stock === 'out') rows = rows.filter((p) => p.stock <= 0);
        if (query.stock === 'low') rows = rows.filter((p) => p.stock <= lowStockThreshold); // includes out of stock
        return paginate(rows, { sort: 'updatedAt:desc', ...query }, [(p) => p.name, (p) => p.sku, (p) => p.brand]);
      },
      () => http.get(ENDPOINTS.products.list, { params: cleanParams(query) }),
    ),

  get: (id: string) =>
    withMock<AdminProduct>(
      () => {
        requirePerm('products.view');
        return db.read().products.find((p) => p.id === id) ?? notFound('Product');
      },
      () => http.get(ENDPOINTS.products.detail(id)),
    ),

  create: (input: ProductInput) =>
    withMock<AdminProduct>(
      () => {
        requirePerm('products.manage');
        assertUnique(input);
        const now = new Date().toISOString();
        const product: AdminProduct = { ...input, id: newId('p'), rating: 0, reviewCount: 0, reviews: [], createdAt: now, updatedAt: now };
        db.write((d) => d.products.unshift(product));
        return product;
      },
      () => http.post(ENDPOINTS.products.create, input),
    ),

  update: (id: string, input: ProductInput) =>
    withMock<AdminProduct>(
      () => {
        requirePerm('products.manage');
        assertUnique(input, id);
        return db.write((d) => {
          const i = d.products.findIndex((p) => p.id === id);
          if (i < 0) notFound('Product');
          d.products[i] = { ...d.products[i], ...input, updatedAt: new Date().toISOString() };
          return d.products[i];
        });
      },
      () => http.put(ENDPOINTS.products.detail(id), input),
    ),

  remove: (id: string) =>
    withMock(
      () => {
        requirePerm('products.manage');
        db.write((d) => (d.products = d.products.filter((p) => p.id !== id)));
        return { ok: true };
      },
      () => http.delete<{ ok: boolean }>(ENDPOINTS.products.detail(id)),
    ),

  bulkUpdate: (ids: string[], patch: Partial<Pick<AdminProduct, 'status' | 'isFeatured' | 'isFlashSale'>>) =>
    withMock(
      () => {
        requirePerm('products.manage');
        db.write((d) =>
          d.products.forEach((p) => {
            if (ids.includes(p.id)) Object.assign(p, patch, { updatedAt: new Date().toISOString() });
          }),
        );
        return { ok: true };
      },
      () => http.patch<{ ok: boolean }>(ENDPOINTS.products.bulk, { ids, patch }),
    ),

  bulkDelete: (ids: string[]) =>
    withMock(
      () => {
        requirePerm('products.manage');
        db.write((d) => (d.products = d.products.filter((p) => !ids.includes(p.id))));
        return { ok: true };
      },
      () => http.post<{ ok: boolean }>(ENDPOINTS.products.bulkDelete, { ids }),
    ),

  /** Upload one product image. Resized & re-encoded client-side (also strips EXIF/GPS). */
  uploadImage: async (file: File): Promise<string> => {
    const blob = await resizeImage(file);
    return withMock(
      async () => {
        requirePerm('products.manage');
        return blobToDataUrl(blob); // demo: embed as data URL
      },
      async () => {
        const form = new FormData();
        form.append('file', blob, file.name.replace(/\.[^.]+$/, '') + '.webp');
        const res = await http.post<{ url: string }>(ENDPOINTS.uploads, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.url;
      },
    );
  },
};
