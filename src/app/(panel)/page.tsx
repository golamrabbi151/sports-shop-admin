'use client';

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  UserAddOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Alert, Card, DatePicker, Empty, Segmented, Skeleton, Table, Tag } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AreaChart } from '@/components/charts/AreaChart';
import { BarList } from '@/components/charts/BarList';
import { OrderStatusTag, PayChip } from '@/components/common/Badges';
import { PageHeader } from '@/components/common/PageHeader';
import { Thumb } from '@/components/common/Thumb';
import { ORDER_STATUS, PAYMENT_METHODS } from '@/config/site';
import { getErrorMessage } from '@/lib/api/errors';
import { formatBDT, formatBDTCompact, formatNumber, timeAgo } from '@/lib/utils';
import { dashboardService } from '@/services';
import { useAdminAuth } from '@/store/auth';
import type { AdminOrder, DashboardStats } from '@/types/admin';

type Preset = '7d' | '30d' | '90d' | 'custom';
const PRESET_DAYS: Record<Exclude<Preset, 'custom'>, number> = { '7d': 7, '30d': 30, '90d': 90 };

function Delta({ value }: { value: number | null }) {
  if (value == null) return <span className="kpi__delta muted">No prior data</span>;
  const up = value >= 0;
  return (
    <span className={`kpi__delta ${up ? 'kpi__delta--up' : 'kpi__delta--down'}`}>
      {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(value).toFixed(1)}%
      <span className="muted" style={{ fontWeight: 500 }}>
        vs previous period
      </span>
    </span>
  );
}

export default function DashboardPage() {
  const user = useAdminAuth((s) => s.user);
  const [preset, setPreset] = useState<Preset>('30d');
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [dayjs().subtract(29, 'day').startOf('day'), dayjs().endOf('day')]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<'Revenue' | 'Orders'>('Revenue');

  useEffect(() => {
    let alive = true;
    dashboardService
      .stats(range[0].toISOString(), range[1].toISOString())
      .then((s) => alive && (setStats(s), setError(null)))
      .catch((e) => alive && setError(getErrorMessage(e)));
    return () => {
      alive = false;
    };
  }, [range]);

  const series = useMemo(
    () =>
      (stats?.series ?? []).map((d) => ({
        label: dayjs(d.date).format('D MMM'),
        value: metric === 'Revenue' ? d.revenue : d.orders,
      })),
    [stats, metric],
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <PageHeader
        title={`${greeting}, ${user?.name.split(' ')[0] ?? ''}`}
        subtitle="Here’s how KhelaBD is doing."
        extra={
          <>
            <Segmented<Preset>
              value={preset}
              options={[
                { label: '7 days', value: '7d' },
                { label: '30 days', value: '30d' },
                { label: '90 days', value: '90d' },
                { label: 'Custom', value: 'custom' },
              ]}
              onChange={(p) => {
                setPreset(p);
                if (p !== 'custom') setRange([dayjs().subtract(PRESET_DAYS[p] - 1, 'day').startOf('day'), dayjs().endOf('day')]);
              }}
            />
            {preset === 'custom' && (
              <DatePicker.RangePicker
                value={range}
                allowClear={false}
                disabledDate={(d) => d.isAfter(dayjs())}
                onChange={(v) => v?.[0] && v[1] && setRange([v[0].startOf('day'), v[1].endOf('day')])}
              />
            )}
          </>
        }
      />

      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}

      {stats && (stats.pendingOrders > 0 || stats.lowStockCount > 0) && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16, borderRadius: 12 }}
          title={
            <span>
              {stats.pendingOrders > 0 && (
                <>
                  <Link href="/orders?status=pending" style={{ fontWeight: 700, textDecoration: 'underline' }}>
                    {stats.pendingOrders} orders
                  </Link>{' '}
                  waiting for confirmation.{' '}
                </>
              )}
              {stats.lowStockCount > 0 && (
                <>
                  <Link href="/products?stock=low" style={{ fontWeight: 700, textDecoration: 'underline' }}>
                    {stats.lowStockCount} products
                  </Link>{' '}
                  are low or out of stock.
                </>
              )}
            </span>
          }
        />
      )}

      <div className="kpi-grid">
        {[
          { label: 'Revenue', icon: <DollarOutlined />, value: stats && formatBDT(stats.revenue), delta: stats?.change.revenue },
          { label: 'Orders', icon: <ShoppingCartOutlined />, value: stats && formatNumber(stats.orders), delta: stats?.change.orders },
          { label: 'Avg. order value', icon: <ShoppingOutlined />, value: stats && formatBDT(stats.avgOrderValue), delta: stats?.change.avgOrderValue },
          { label: 'New customers', icon: <UserAddOutlined />, value: stats && formatNumber(stats.newCustomers), delta: stats?.change.newCustomers },
        ].map((k) => (
          <div className="kpi" key={k.label}>
            <div className="kpi__label">
              {k.icon} {k.label}
            </div>
            {stats ? (
              <>
                <div className="kpi__value">{k.value}</div>
                <Delta value={k.delta ?? null} />
              </>
            ) : (
              <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
            )}
          </div>
        ))}
      </div>

      <div className="dash-grid dash-grid--2-1" style={{ marginBottom: 16 }}>
        <Card
          title={metric === 'Revenue' ? 'Revenue over time' : 'Orders over time'}
          extra={<Segmented size="small" value={metric} options={['Revenue', 'Orders']} onChange={(v) => setMetric(v as typeof metric)} />}
        >
          {stats ? (
            <AreaChart
              data={series}
              name={metric}
              format={metric === 'Revenue' ? formatBDT : (v) => `${v} orders`}
              axisFormat={metric === 'Revenue' ? formatBDTCompact : (v) => String(v)}
            />
          ) : (
            <Skeleton active paragraph={{ rows: 7 }} />
          )}
          <p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>
            Excludes cancelled orders.
          </p>
        </Card>
        <Card title="Orders by status">
          {stats ? (
            <BarList
              rows={stats.byStatus.map((s) => ({
                key: s.status,
                label: ORDER_STATUS[s.status].label,
                value: s.count,
                display: formatNumber(s.count),
                tooltip: `${s.count} ${ORDER_STATUS[s.status].label.toLowerCase()} orders`,
              }))}
            />
          ) : (
            <Skeleton active paragraph={{ rows: 6 }} />
          )}
        </Card>
      </div>

      <div className="dash-grid dash-grid--1-1" style={{ marginBottom: 16 }}>
        <Card title="Payment methods" extra={<span className="muted">by revenue</span>}>
          {stats ? (
            <BarList
              rows={stats.byPayment.map((p) => ({
                key: p.method,
                label: PAYMENT_METHODS[p.method].name,
                value: p.amount,
                display: formatBDTCompact(p.amount),
                tooltip: `${formatBDT(p.amount)} from ${p.count} orders`,
              }))}
            />
          ) : (
            <Skeleton active paragraph={{ rows: 5 }} />
          )}
        </Card>
        <Card title="Top products" extra={<Link href="/products">All products</Link>}>
          {stats ? (
            stats.topProducts.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {stats.topProducts.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="muted num" style={{ width: 16, fontWeight: 700 }}>
                      {i + 1}
                    </span>
                    <Thumb src={p.image} size={40} />
                    <Link href={`/products/${p.id}`} style={{ flex: 1, fontWeight: 600, fontSize: 13.5, lineHeight: 1.3 }}>
                      {p.name}
                      <div className="muted" style={{ fontWeight: 500, fontSize: 12 }}>
                        {p.sold} sold
                      </div>
                    </Link>
                    <b className="num">{formatBDT(p.revenue)}</b>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="No sales in this period" />
            )
          ) : (
            <Skeleton active avatar paragraph={{ rows: 4 }} />
          )}
        </Card>
      </div>

      <div className="dash-grid dash-grid--2-1">
        <Card title="Recent orders" extra={<Link href="/orders">View all</Link>} styles={{ body: { padding: 0 } }}>
          <Table<AdminOrder>
            rowKey="id"
            loading={!stats}
            dataSource={stats?.recentOrders}
            pagination={false}
            scroll={{ x: 640 }}
            size="middle"
            columns={[
              { title: 'Order', dataIndex: 'orderNumber', render: (v, o) => <Link href={`/orders/${o.id}`} style={{ fontWeight: 700 }}>#{v}</Link> },
              { title: 'Customer', render: (_, o) => o.shipping.fullName },
              { title: 'Payment', render: (_, o) => <PayChip method={o.paymentMethod} /> },
              { title: 'Status', render: (_, o) => <OrderStatusTag status={o.status} /> },
              { title: 'Total', align: 'right', render: (_, o) => <b className="num">{formatBDT(o.total)}</b> },
              { title: 'Placed', render: (_, o) => <span className="muted">{timeAgo(o.createdAt)}</span> },
            ]}
          />
        </Card>
        <Card title="Stock alerts" extra={<Link href="/products?stock=low">Manage</Link>}>
          {stats ? (
            stats.lowStock.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {stats.lowStock.map((p) => (
                  <Link key={p.id} href={`/products/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Thumb src={p.image} size={40} />
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>
                      {p.name}
                      <div className="muted" style={{ fontSize: 12, fontWeight: 500 }}>
                        {p.sku}
                      </div>
                    </span>
                    {p.stock <= 0 ? <Tag color="red">Out of stock</Tag> : <Tag color="orange">{p.stock} left</Tag>}
                  </Link>
                ))}
              </div>
            ) : (
              <Empty description="All products are well stocked" />
            )
          ) : (
            <Skeleton active avatar paragraph={{ rows: 4 }} />
          )}
        </Card>
      </div>
    </>
  );
}
