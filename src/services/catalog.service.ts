import { ENDPOINTS } from '@/config/api';
import { http } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { withMock } from '@/lib/api/mock';
import { db, newId } from '@/mocks/db';
import type { Brand, Category } from '@/types';
import type { BrandInput, CategoryInput } from '@/types/admin';
import { requirePerm } from './_mock-guard';

export const categoryService = {
  list: () =>
    withMock<Category[]>(
      () => {
        const d = db.read();
        return d.categories.map((c) => ({ ...c, productCount: d.products.filter((p) => p.category === c.slug).length }));
      },
      () => http.get(ENDPOINTS.categories.list),
    ),
  create: (input: CategoryInput) =>
    withMock<Category>(
      () => {
        requirePerm('catalog.manage');
        if (db.read().categories.some((c) => c.slug === input.slug))
          throw new ApiError('Slug already exists', 422, 'conflict', { slug: 'This slug is already used' });
        const cat: Category = { ...input, id: newId('c'), productCount: 0 };
        db.write((d) => d.categories.push(cat));
        return cat;
      },
      () => http.post(ENDPOINTS.categories.list, input),
    ),
  update: (id: string, input: CategoryInput) =>
    withMock<Category>(
      () => {
        requirePerm('catalog.manage');
        if (db.read().categories.some((c) => c.slug === input.slug && c.id !== id))
          throw new ApiError('Slug already exists', 422, 'conflict', { slug: 'This slug is already used' });
        return db.write((d) => {
          const c = d.categories.find((x) => x.id === id)!;
          if (c.slug !== input.slug) d.products.forEach((p) => p.category === c.slug && (p.category = input.slug));
          Object.assign(c, input);
          return c;
        });
      },
      () => http.put(ENDPOINTS.categories.detail(id), input),
    ),
  remove: (id: string) =>
    withMock(
      () => {
        requirePerm('catalog.manage');
        const d = db.read();
        const c = d.categories.find((x) => x.id === id);
        const used = d.products.filter((p) => p.category === c?.slug).length;
        if (used) throw new ApiError(`Move or delete the ${used} product(s) in this category first.`, 409);
        db.write((x) => (x.categories = x.categories.filter((y) => y.id !== id)));
        return { ok: true };
      },
      () => http.delete<{ ok: boolean }>(ENDPOINTS.categories.detail(id)),
    ),
};

export const brandService = {
  list: () =>
    withMock<(Brand & { productCount: number })[]>(
      () => {
        const d = db.read();
        return d.brands.map((b) => ({ ...b, productCount: d.products.filter((p) => p.brand === b.name).length }));
      },
      () => http.get(ENDPOINTS.brands.list),
    ),
  create: (input: BrandInput) =>
    withMock<Brand>(
      () => {
        requirePerm('catalog.manage');
        if (db.read().brands.some((b) => b.slug === input.slug || b.name.toLowerCase() === input.name.toLowerCase()))
          throw new ApiError('Brand already exists', 422, 'conflict', { name: 'A brand with this name already exists' });
        const brand = { ...input, id: newId('b') };
        db.write((d) => d.brands.push(brand));
        return brand;
      },
      () => http.post(ENDPOINTS.brands.list, input),
    ),
  update: (id: string, input: BrandInput) =>
    withMock<Brand>(
      () => {
        requirePerm('catalog.manage');
        return db.write((d) => {
          const b = d.brands.find((x) => x.id === id)!;
          if (b.name !== input.name) d.products.forEach((p) => p.brand === b.name && (p.brand = input.name));
          Object.assign(b, input);
          return b;
        });
      },
      () => http.put(ENDPOINTS.brands.detail(id), input),
    ),
  remove: (id: string) =>
    withMock(
      () => {
        requirePerm('catalog.manage');
        const d = db.read();
        const b = d.brands.find((x) => x.id === id);
        const used = d.products.filter((p) => p.brand === b?.name).length;
        if (used) throw new ApiError(`${used} product(s) still use this brand.`, 409);
        db.write((x) => (x.brands = x.brands.filter((y) => y.id !== id)));
        return { ok: true };
      },
      () => http.delete<{ ok: boolean }>(ENDPOINTS.brands.detail(id)),
    ),
};
