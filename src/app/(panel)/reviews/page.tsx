'use client';

import { CheckOutlined, DeleteOutlined, EyeInvisibleOutlined, SearchOutlined } from '@ant-design/icons';
import { App, Button, Input, Rate, Space, Table, Tabs, Tag } from 'antd';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Thumb } from '@/components/common/Thumb';
import { useList } from '@/hooks/useList';
import { getErrorMessage } from '@/lib/api/errors';
import { timeAgo } from '@/lib/utils';
import { reviewService } from '@/services';
import type { AdminReview, ReviewQuery, ReviewStatus } from '@/types/admin';

const STATUS: Record<ReviewStatus, { color: string; label: string }> = {
  pending: { color: 'gold', label: 'Pending' },
  approved: { color: 'green', label: 'Published' },
  hidden: { color: 'default', label: 'Hidden' },
};

export default function ReviewsPage() {
  const params = useSearchParams();
  const { message, modal } = App.useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const list = useList<AdminReview, ReviewQuery>(reviewService.list, {
    status: (params.get('status') as ReviewStatus) ?? undefined,
  });

  const setStatus = async (ids: string[], status: ReviewStatus) => {
    try {
      await reviewService.setStatus(ids, status);
      message.success(status === 'approved' ? 'Published' : 'Hidden from store');
      setSelected([]);
      void list.reload();
    } catch (e) {
      message.error(getErrorMessage(e));
    }
  };

  return (
    <>
      <PageHeader title="Reviews" subtitle="Approve new reviews before they appear on product pages." />
      <div className="section-card" style={{ padding: 0 }}>
        <Tabs
          activeKey={list.query.status ?? 'all'}
          onChange={(k) => list.update({ status: k === 'all' ? undefined : (k as ReviewStatus) })}
          style={{ padding: '0 16px' }}
          items={[{ key: 'all', label: 'All' }, ...Object.entries(STATUS).map(([key, s]) => ({ key, label: s.label }))]}
        />
        <div className="toolbar" style={{ padding: '0 16px' }}>
          <Input
            allowClear
            prefix={<SearchOutlined className="muted" />}
            placeholder="Search reviewer, product or text"
            value={list.search}
            onChange={(e) => list.setSearch(e.target.value)}
            style={{ width: 300 }}
          />
          {selected.length > 0 && (
            <Space style={{ marginLeft: 'auto' }}>
              <span className="muted">{selected.length} selected</span>
              <Button icon={<CheckOutlined />} onClick={() => setStatus(selected, 'approved')}>
                Publish
              </Button>
              <Button icon={<EyeInvisibleOutlined />} onClick={() => setStatus(selected, 'hidden')}>
                Hide
              </Button>
            </Space>
          )}
        </div>
        <Table<AdminReview>
          rowKey="id"
          dataSource={list.data.items}
          loading={list.loading}
          pagination={{ ...list.pagination, style: { padding: '0 16px' } }}
          rowSelection={{ selectedRowKeys: selected, onChange: (k) => setSelected(k as string[]) }}
          scroll={{ x: 900 }}
          columns={[
            {
              title: 'Review',
              render: (_, r) => (
                <div style={{ maxWidth: 460 }}>
                  <Rate disabled value={r.rating} style={{ fontSize: 13 }} />
                  {/* React escapes text — reviews are user content, never render as HTML */}
                  <p style={{ margin: '4px 0' }}>{r.comment}</p>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {r.author} · {r.location} · {timeAgo(r.createdAt)}
                  </span>
                </div>
              ),
            },
            {
              title: 'Product',
              render: (_, r) => (
                <Link href={`/products/${r.productId}`} className="cell-product" style={{ minWidth: 200 }}>
                  <Thumb src={r.productImage} size={36} />
                  <span style={{ fontSize: 13 }}>{r.productName}</span>
                </Link>
              ),
            },
            { title: 'Status', dataIndex: 'status', render: (s: ReviewStatus) => <Tag color={STATUS[s].color}>{STATUS[s].label}</Tag> },
            {
              key: 'a',
              align: 'right',
              render: (_, r) => (
                <Space>
                  {r.status !== 'approved' && (
                    <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => setStatus([r.id], 'approved')}>
                      Publish
                    </Button>
                  )}
                  {r.status !== 'hidden' && (
                    <Button size="small" icon={<EyeInvisibleOutlined />} onClick={() => setStatus([r.id], 'hidden')}>
                      Hide
                    </Button>
                  )}
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    aria-label="Delete review"
                    onClick={() =>
                      modal.confirm({
                        title: 'Delete this review permanently?',
                        okText: 'Delete',
                        okButtonProps: { danger: true },
                        onOk: async () => {
                          try {
                            await reviewService.remove(r.id);
                            message.success('Review deleted');
                            void list.reload();
                          } catch (e) {
                            message.error(getErrorMessage(e));
                          }
                        },
                      })
                    }
                  />
                </Space>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}
