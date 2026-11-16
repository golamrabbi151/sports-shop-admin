'use client';

import { MailOutlined, PhoneOutlined, StopOutlined, UnlockOutlined } from '@ant-design/icons';
import { App, Avatar, Button, Col, Result, Row, Skeleton, Table, Tag } from 'antd';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { OrderStatusTag, PayChip } from '@/components/common/Badges';
import { Can } from '@/components/common/Can';
import { PageHeader } from '@/components/common/PageHeader';
import { getErrorMessage } from '@/lib/api/errors';
import { formatBDT, formatDate, formatDateTime } from '@/lib/utils';
import { customerService } from '@/services';
import type { AdminOrder, Customer } from '@/types/admin';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { message, modal } = App.useApp();
  const [data, setData] = useState<{ customer: Customer; orders: AdminOrder[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customerService.get(id).then(setData).catch((e) => setError(getErrorMessage(e)));
  }, [id]);

  if (error) return <Result status="404" title={error} extra={<Link href="/customers">Back to customers</Link>} />;
  if (!data) return <Skeleton active avatar paragraph={{ rows: 10 }} />;
  const { customer: c, orders } = data;
  const cancelled = orders.filter((o) => o.status === 'cancelled').length;
  const blocked = c.status === 'blocked';

  const toggleBlock = () =>
    modal.confirm({
      title: blocked ? `Unblock ${c.name}?` : `Block ${c.name}?`,
      content: blocked
        ? 'They will be able to place orders again.'
        : 'Blocked customers can’t sign in or place new orders (useful for repeated fake COD orders).',
      okText: blocked ? 'Unblock' : 'Block',
      okButtonProps: { danger: !blocked },
      onOk: async () => {
        try {
          const updated = await customerService.setStatus(c.id, blocked ? 'active' : 'blocked');
          setData({ customer: updated, orders });
          message.success(blocked ? 'Customer unblocked' : 'Customer blocked');
        } catch (e) {
          message.error(getErrorMessage(e));
        }
      },
    });

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Customers', href: '/customers' }, { label: c.name }]}
        title={c.name}
        subtitle={`Customer since ${formatDate(c.createdAt)}`}
        extra={
          <Can perm="customers.manage">
            <Button danger={!blocked} icon={blocked ? <UnlockOutlined /> : <StopOutlined />} onClick={toggleBlock}>
              {blocked ? 'Unblock customer' : 'Block customer'}
            </Button>
          </Can>
        }
      />
      <Row gutter={16}>
        <Col xs={24} xl={8}>
          <div className="section-card" style={{ textAlign: 'center' }}>
            <Avatar size={72} style={{ background: '#0B1220', color: '#C6F432', fontSize: 28, fontWeight: 800 }}>
              {c.name[0]}
            </Avatar>
            <h2 style={{ margin: '12px 0 4px' }}>{c.name}</h2>
            {blocked ? <Tag color="red">Blocked</Tag> : <Tag color="green">Active</Tag>}
            <div style={{ display: 'grid', gap: 6, marginTop: 16, textAlign: 'left' }}>
              <a href={`tel:${c.phone}`} style={{ color: '#0A7C4A' }}>
                <PhoneOutlined /> {c.phone}
              </a>
              <a href={`mailto:${c.email}`} style={{ color: '#0A7C4A' }}>
                <MailOutlined /> {c.email}
              </a>
              <span className="muted">📍 {c.district}</span>
            </div>
          </div>
          <div className="kpi-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 16 }}>
            <div className="kpi">
              <div className="kpi__label">Total spent</div>
              <div className="kpi__value" style={{ fontSize: 22 }}>
                {formatBDT(c.totalSpent)}
              </div>
            </div>
            <div className="kpi">
              <div className="kpi__label">Orders</div>
              <div className="kpi__value" style={{ fontSize: 22 }}>
                {c.ordersCount}
              </div>
              {cancelled > 0 && <span className="kpi__delta kpi__delta--down">{cancelled} cancelled</span>}
            </div>
          </div>
        </Col>
        <Col xs={24} xl={16}>
          <div className="section-card" style={{ padding: 0 }}>
            <h3 style={{ padding: '20px 20px 0' }}>Order history</h3>
            <Table<AdminOrder>
              rowKey="id"
              dataSource={orders}
              pagination={{ pageSize: 8, hideOnSinglePage: true }}
              scroll={{ x: 620 }}
              columns={[
                { title: 'Order', render: (_, o) => <Link href={`/orders/${o.id}`} style={{ fontWeight: 700 }}>#{o.orderNumber}</Link> },
                { title: 'Date', render: (_, o) => <span className="muted">{formatDateTime(o.createdAt)}</span> },
                { title: 'Payment', render: (_, o) => <PayChip method={o.paymentMethod} /> },
                { title: 'Status', render: (_, o) => <OrderStatusTag status={o.status} /> },
                { title: 'Total', align: 'right', render: (_, o) => <b className="num">{formatBDT(o.total)}</b> },
              ]}
            />
          </div>
        </Col>
      </Row>
    </>
  );
}
