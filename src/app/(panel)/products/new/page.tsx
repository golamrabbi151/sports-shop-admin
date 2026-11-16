'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { ProductForm } from '@/components/products/ProductForm';

export default function NewProductPage() {
  return (
    <>
      <PageHeader title="Add product" crumbs={[{ label: 'Products', href: '/products' }, { label: 'New' }]} />
      <ProductForm />
    </>
  );
}
