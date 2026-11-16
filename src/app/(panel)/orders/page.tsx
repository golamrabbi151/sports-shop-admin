'use client';

import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Input, Select, Table, Tabs } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { OrderStatusTag, PayChip, PaymentStatusTag } from '@/components/common/Badges';
import { PageHeader } from '@/components/common/PageHeader';
import { ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from '@/config/site';
import { useList } from '@/hooks/useList';
import { downloadCsv, formatBDT, formatDateTime } from '@/lib/utils';
import { orderService } from '@/services';
import type { OrderStatus } from '@/types';
import type { AdminOrder, OrderQuery } from '@/types/admin';

export default function OrdersPage() {
  const router = useRouter();
  const params = useSearchParams();
  const list = useList<AdminOrder, OrderQuery>(orderService.list, {
    status: (params.get('status') as OrderStatus) ?? undefined,
  });

  const exportCsv = async () => {
    // Export everything matching the current filters (not just this page).
    const all = await orderService.list({ ...list.query, page: 1, pageSize: 5000 });
    downloadCsv(
      `orders-${dayjs().format('YYYY-MM-DD')}.csv`,
      all.items.map((o) => ({
        Order: o.orderNumber,
        Date: dayjs(o.createdAt).format('YYYY-MM-DD HH:mm'),
        Customer: o.shipping.fullName,
        Phone: o.shipping.phone,
        District: o.shipping.district,
        Address: `${o.shipping.address}, ${o.shipping.area}`,
        Items: o.items.reduce((n, i) => n + i.quantity, 0),
        Subtotal: o.subtotal,
        Discount: o.discount,
        Delivery: o.deliveryCharge,
        Total: o.total,
        'Payment method': PAYMENT_METHODS[o.paymentMethod].name,
        'Payment status': o.paymentStatus,
        'Transaction ID': o.transactionId ?? '',
        Status: o.status,
        Courier: o.courier?.name ?? '',
        Tracking: o.courier?.trackingId ?? '',
      })),
    );
  };

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Confirm, pack, ship and track every order."
        extra={
          <Button icon={<DownloadOutlined />} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />
      <div className="section-card" style={{ padding: 0 }}>
        <Tabs
          activeKey={list.query.status ?? 'all'}
          onChange={(k) => list.update({ status: k === 'all' ? undefined : (k as OrderStatus) })}
          style={{ padding: '0 16px' }}
          items={[{ key: 'all', label: 'All' }, ...Object.entries(ORDER_STATUS).map(([key, s]) => ({ key, label: s.label }))]}
        />
        <div className="toolbar" style={{ padding: '0 16px' }}>
          <Input
            allowClear
            prefix={<SearchOutlined className="muted" />}
            placeholder="Order #, name, phone, TrxID, tracking"
            value={list.search}
            onChange={(e) => list.setSearch(e.target.value)}
            style={{ width: 300 }}
            maxLength={80}
          />
          <Select
            allowClear
            placeholder="Payment method"
            style={{ width: 170 }}
            value={list.query.paymentMethod}
            onChange={(paymentMethod) => list.update({ paymentMethod })}
            options={Object.entries(PAYMENT_METHODS).map(([value, m]) => ({ value, label: m.name }))}
          />
          <Select
            allowClear
            placeholder="Payment status"
            style={{ width: 160 }}
            value={list.query.paymentStatus}
            onChange={(paymentStatus) => list.update({ paymentStatus })}
            options={Object.entries(PAYMENT_STATUS).map(([value, s]) => ({ value, label: s.label }))}
          />
          <DatePicker.RangePicker
            disabledDate={(d) => d.isAfter(dayjs())}
            onChange={(v) =>
              list.update({
                from: v?.[0]?.startOf('day').toISOString(),
                to: v?.[1]?.endOf('day').toISOString(),
              })
            }
          />
        </div>
        <Table<AdminOrder>
          rowKey="id"
          dataSource={list.data.items}
          loading={list.loading}
          pagination={{ ...list.pagination, style: { padding: '0 16px' } }}
          scroll={{ x: 1000 }}
          onRow={(o) => ({ onClick: (e) => !(e.target as HTMLElement).closest('a') && router.push(`/orders/${o.id}`), style: { cursor: 'pointer' } })}
          onChange={(_, __, sorter) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            list.update({ sort: s?.order ? `${String(s.field)}:${s.order === 'ascend' ? 'asc' : 'desc'}` : undefined });
          }}
          columns={[
            {
              title: 'Order',
              dataIndex: 'orderNumber',
              fixed: 'left',
              render: (v, o) => (
                <Link href={`/orders/${o.id}`} style={{ fontWeight: 700 }}>
                  #{v}
                </Link>
              ),
            },
            { title: 'Date', dataIndex: 'createdAt', sorter: true, render: (v: string) => <span className="muted">{formatDateTime(v)}</span> },
            {
              title: 'Customer',
              render: (_, o) => (
                <span>
                  <b style={{ fontWeight: 600 }}>{o.shipping.fullName}</b>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {o.shipping.phone} · {o.shipping.district}
                  </div>
                </span>
              ),
            },
            { title: 'Items', align: 'center', render: (_, o) => o.items.reduce((n, i) => n + i.quantity, 0) },
            { title: 'Total', dataIndex: 'total', sorter: true, align: 'right', render: (v: number) => <b className="num">{formatBDT(v)}</b> },
            {
              title: 'Payment',
              render: (_, o) => (
                <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  <PayChip method={o.paymentMethod} />
                  <PaymentStatusTag status={o.paymentStatus} />
                </span>
              ),
            },
            { title: 'Status', dataIndex: 'status', render: (s: OrderStatus) => <OrderStatusTag status={s} /> },
            {
              title: 'Courier',
              responsive: ['xl'],
              render: (_, o) => (o.courier ? <span className="muted">{o.courier.name}</span> : <span className="muted">—</span>),
            },
          ]}
        />
      </div>
    </>
  );
}
