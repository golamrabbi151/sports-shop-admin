'use client';

import { DeleteOutlined, DownloadOutlined, EditOutlined, ExportOutlined, MoreOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { App, Button, Dropdown, Input, Select, Space, Table, Tag, type TableProps } from 'antd';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Can } from '@/components/common/Can';
import { PageHeader } from '@/components/common/PageHeader';
import { Thumb } from '@/components/common/Thumb';
import { ADMIN } from '@/config/site';
import { useList } from '@/hooks/useList';
import { usePermission } from '@/hooks/usePermission';
import { getErrorMessage } from '@/lib/api/errors';
import { downloadCsv, formatBDT, formatDate } from '@/lib/utils';
import { categoryService, productService } from '@/services';
import type { Category } from '@/types';
import type { AdminProduct, ProductQuery, ProductStatus } from '@/types/admin';

const STATUS: Record<ProductStatus, { color: string; label: string }> = {
  active: { color: 'green', label: 'Active' },
  draft: { color: 'default', label: 'Draft' },
  archived: { color: 'orange', label: 'Archived' },
};

export default function ProductsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { message, modal } = App.useApp();
  const canManage = usePermission('products.manage');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const list = useList<AdminProduct, ProductQuery>(productService.list, {
    stock: (params.get('stock') as ProductQuery['stock']) ?? undefined,
    category: params.get('category') ?? undefined,
  });

  useEffect(() => {
    categoryService.list().then(setCategories).catch(() => undefined);
  }, []);

  const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

  const run = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      message.success(success);
      setSelected([]);
      void list.reload();
    } catch (e) {
      message.error(getErrorMessage(e));
    }
  };

  const confirmDelete = (ids: string[], label: string) =>
    modal.confirm({
      title: `Delete ${label}?`,
      content: 'This permanently removes the product from the store. Past orders keep their copy. Consider archiving instead.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => run(() => (ids.length === 1 ? productService.remove(ids[0]) : productService.bulkDelete(ids)), 'Deleted'),
    });

  const columns: TableProps<AdminProduct>['columns'] = [
    {
      title: 'Product',
      key: 'name',
      fixed: 'left',
      render: (_, p) => (
        <Link href={`/products/${p.id}`} className="cell-product">
          <Thumb src={p.images[0]} alt={p.name} />
          <span>
            <b>{p.name}</b>
            <span className="muted" style={{ fontSize: 12 }}>
              {p.sku} · {p.brand}
            </span>
          </span>
        </Link>
      ),
    },
    { title: 'Category', dataIndex: 'category', render: (v: string) => catName(v), responsive: ['md'] },
    {
      title: 'Price',
      dataIndex: 'price',
      sorter: true,
      align: 'right',
      render: (_, p) => (
        <span className="num">
          <b>{formatBDT(p.price)}</b>
          {p.compareAtPrice ? (
            <div className="muted" style={{ textDecoration: 'line-through', fontSize: 12 }}>
              {formatBDT(p.compareAtPrice)}
            </div>
          ) : null}
        </span>
      ),
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      sorter: true,
      align: 'center',
      render: (v: number) =>
        v <= 0 ? <Tag color="red">Out</Tag> : v <= 10 ? <Tag color="orange">{v} left</Tag> : <span className="num">{v}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (v: ProductStatus, p) => (
        <Space size={4} wrap>
          <Tag color={STATUS[v].color} style={{ margin: 0 }}>
            {STATUS[v].label}
          </Tag>
          {p.isFeatured && <Tag style={{ margin: 0 }}>Featured</Tag>}
          {p.isFlashSale && <Tag color="volcano" style={{ margin: 0 }}>Flash sale</Tag>}
        </Space>
      ),
    },
    { title: 'Updated', dataIndex: 'updatedAt', sorter: true, responsive: ['lg'], render: (v: string) => <span className="muted">{formatDate(v)}</span> },
    {
      key: 'actions',
      width: 56,
      fixed: 'right',
      render: (_, p) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'edit', icon: <EditOutlined />, label: canManage ? 'Edit' : 'View', onClick: () => router.push(`/products/${p.id}`) },
              {
                key: 'store',
                icon: <ExportOutlined />,
                label: (
                  <a href={`${ADMIN.storeUrl}/products/${p.slug}`} target="_blank" rel="noopener noreferrer">
                    View on store
                  </a>
                ),
              },
              ...(canManage
                ? [
                    { type: 'divider' as const },
                    { key: 'del', icon: <DeleteOutlined />, label: 'Delete', danger: true, onClick: () => confirmDelete([p.id], `“${p.name}”`) },
                  ]
                : []),
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} aria-label={`Actions for ${p.name}`} />
        </Dropdown>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${list.data.total} products in this view`}
        extra={
          <>
            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                downloadCsv(
                  `products-${new Date().toISOString().slice(0, 10)}.csv`,
                  list.data.items.map((p) => ({
                    SKU: p.sku,
                    Name: p.name,
                    Brand: p.brand,
                    Category: catName(p.category),
                    Price: p.price,
                    'Compare at': p.compareAtPrice ?? '',
                    Stock: p.stock,
                    Status: p.status,
                  })),
                )
              }
            >
              Export
            </Button>
            <Can perm="products.manage">
              <Link href="/products/new">
                <Button type="primary" icon={<PlusOutlined />}>
                  Add product
                </Button>
              </Link>
            </Can>
          </>
        }
      />
      <div className="section-card" style={{ padding: 0 }}>
        <div className="toolbar" style={{ padding: '16px 16px 0' }}>
          <Input
            allowClear
            prefix={<SearchOutlined className="muted" />}
            placeholder="Search name, SKU or brand"
            value={list.search}
            onChange={(e) => list.setSearch(e.target.value)}
            style={{ width: 280 }}
            maxLength={80}
          />
          <Select
            allowClear
            placeholder="Category"
            style={{ width: 170 }}
            value={list.query.category}
            onChange={(category) => list.update({ category })}
            options={categories.map((c) => ({ value: c.slug, label: c.name }))}
          />
          <Select
            allowClear
            placeholder="Status"
            style={{ width: 140 }}
            value={list.query.status}
            onChange={(status) => list.update({ status })}
            options={Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))}
          />
          <Select
            allowClear
            placeholder="Stock"
            style={{ width: 150 }}
            value={list.query.stock}
            onChange={(stock) => list.update({ stock })}
            options={[
              { value: 'low', label: 'Low or out of stock' },
              { value: 'out', label: 'Out of stock' },
            ]}
          />
          {selected.length > 0 && canManage && (
            <Space style={{ marginLeft: 'auto' }} wrap>
              <span className="muted">{selected.length} selected</span>
              <Dropdown
                menu={{
                  items: [
                    { key: 'a', label: 'Set active', onClick: () => run(() => productService.bulkUpdate(selected, { status: 'active' }), 'Products activated') },
                    { key: 'd', label: 'Set draft', onClick: () => run(() => productService.bulkUpdate(selected, { status: 'draft' }), 'Moved to draft') },
                    { key: 'r', label: 'Archive', onClick: () => run(() => productService.bulkUpdate(selected, { status: 'archived' }), 'Archived') },
                    { type: 'divider' },
                    { key: 'f', label: 'Add to flash sale', onClick: () => run(() => productService.bulkUpdate(selected, { isFlashSale: true }), 'Added to flash sale') },
                    { key: 'nf', label: 'Remove from flash sale', onClick: () => run(() => productService.bulkUpdate(selected, { isFlashSale: false }), 'Removed from flash sale') },
                  ],
                }}
              >
                <Button>Bulk actions</Button>
              </Dropdown>
              <Button danger icon={<DeleteOutlined />} onClick={() => confirmDelete(selected, `${selected.length} products`)}>
                Delete
              </Button>
            </Space>
          )}
        </div>
        <Table<AdminProduct>
          rowKey="id"
          columns={columns}
          dataSource={list.data.items}
          loading={list.loading}
          pagination={{ ...list.pagination, style: { padding: '0 16px' } }}
          scroll={{ x: 900 }}
          rowSelection={canManage ? { selectedRowKeys: selected, onChange: (k) => setSelected(k as string[]) } : undefined}
          onChange={(_, __, sorter) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            list.update({ sort: s?.order ? `${String(s.field)}:${s.order === 'ascend' ? 'asc' : 'desc'}` : undefined });
          }}
        />
      </div>
    </>
  );
}
