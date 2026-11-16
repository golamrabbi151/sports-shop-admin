'use client';

import { Result, Skeleton } from 'antd';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ProductForm } from '@/components/products/ProductForm';
import { getErrorMessage } from '@/lib/api/errors';
import { productService } from '@/services';
import type { AdminProduct } from '@/types/admin';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    productService.get(id).then(setProduct).catch((e) => setError(getErrorMessage(e)));
  }, [id]);

  if (error) return <Result status="404" title={error} extra={<Link href="/products">Back to products</Link>} />;
  return (
    <>
      <PageHeader
        title={product?.name ?? 'Loading…'}
        subtitle={product ? `SKU ${product.sku}` : undefined}
        crumbs={[{ label: 'Products', href: '/products' }, { label: 'Edit' }]}
      />
      {product ? <ProductForm key={product.id} product={product} /> : <Skeleton active paragraph={{ rows: 12 }} />}
    </>
  );
}
