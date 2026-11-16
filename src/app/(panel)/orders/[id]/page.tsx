'use client';

import {
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CommentOutlined,
  CreditCardOutlined,
  PhoneOutlined,
  PrinterOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { App, Button, Col, Empty, Form, Input, Result, Row, Select, Skeleton, Space, Table, Timeline } from 'antd';
import Link from 'next/link';
import { use, useCallback, useEffect, useState } from 'react';
import { OrderStatusTag, PayChip, PaymentStatusTag } from '@/components/common/Badges';
import { PageHeader } from '@/components/common/PageHeader';
import { Thumb } from '@/components/common/Thumb';
import { ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS, STATUS_FLOW } from '@/config/site';
import { usePermission } from '@/hooks/usePermission';
import { getErrorMessage } from '@/lib/api/errors';
import { formatBDT, formatDateTime, sanitizeText } from '@/lib/utils';
import { orderService } from '@/services';
import { COURIERS, type AdminOrder, type Courier, type OrderEvent } from '@/types/admin';
import type { OrderStatus, PaymentStatus } from '@/types';

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  confirmed: 'Confirm order',
  processing: 'Start packing',
  shipped: 'Mark as shipped',
  delivered: 'Mark as delivered',
};

function eventText(e: OrderEvent) {
  if (e.type === 'status' && e.status) return `Status → ${ORDER_STATUS[e.status].label}`;
  if (e.type === 'payment' && e.paymentStatus) return `Payment → ${PAYMENT_STATUS[e.paymentStatus].label}`;
  if (e.type === 'courier') return 'Courier assigned';
  return 'Note';
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { message, modal } = App.useApp();
  const canManage = usePermission('orders.manage');
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [courierForm] = Form.useForm<{ name: Courier; trackingId: string }>();

  const load = useCallback(() => {
    orderService
      .get(id)
      .then((o) => {
        setOrder(o);
        courierForm.setFieldsValue({ name: o.courier?.name, trackingId: o.courier?.trackingId });
      })
      .catch((e) => setError(getErrorMessage(e)));
  }, [id, courierForm]);
  useEffect(load, [load]);

  const act = async (key: string, fn: () => Promise<AdminOrder>, ok: string) => {
    setBusy(key);
    try {
      setOrder(await fn());
      message.success(ok);
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  if (error) return <Result status="404" title={error} extra={<Link href="/orders">Back to orders</Link>} />;
  if (!order) return <Skeleton active paragraph={{ rows: 14 }} />;

  const next = STATUS_FLOW[order.status].filter((s) => s !== 'cancelled');
  const canCancel = STATUS_FLOW[order.status].includes('cancelled');
  const itemsCount = order.items.reduce((n, i) => n + i.quantity, 0);

  const cancel = () => {
    let reason = '';
    modal.confirm({
      title: `Cancel order #${order.orderNumber}?`,
      content: (
        <div>
          <p>Stock will be returned to inventory. {order.paymentStatus === 'paid' && 'Remember to refund the customer and mark the payment as refunded.'}</p>
          <Input.TextArea rows={2} placeholder="Reason (shown in the timeline)" maxLength={200} onChange={(e) => (reason = e.target.value)} />
        </div>
      ),
      okText: 'Cancel order',
      okButtonProps: { danger: true },
      cancelText: 'Keep order',
      onOk: () => act('cancel', () => orderService.updateStatus(order.id, 'cancelled', sanitizeText(reason, 200) || undefined), 'Order cancelled'),
    });
  };

  return (
    <>
      <div className="no-print">
        <PageHeader
          crumbs={[{ label: 'Orders', href: '/orders' }, { label: `#${order.orderNumber}` }]}
          title={
            <Space wrap size={10}>
              <span>#{order.orderNumber}</span>
              <OrderStatusTag status={order.status} />
              <PaymentStatusTag status={order.paymentStatus} />
            </Space>
          }
          subtitle={`Placed ${formatDateTime(order.createdAt)} · ${itemsCount} item${itemsCount > 1 ? 's' : ''}`}
          extra={
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
              Print invoice
            </Button>
          }
        />

        <Row gutter={16}>
          <Col xs={24} xl={16}>
            {canManage && (next.length > 0 || canCancel) && (
              <div className="section-card" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                <span style={{ fontWeight: 700, marginRight: 'auto' }}>
                  Next step
                  <div className="muted" style={{ fontWeight: 500, fontSize: 13 }}>
                    {order.status === 'pending' && 'Call the customer to verify, then confirm.'}
                    {order.status === 'confirmed' && 'Pick and pack the items.'}
                    {order.status === 'processing' && 'Assign a courier and tracking number, then ship.'}
                    {order.status === 'shipped' && 'Mark delivered once the courier confirms.'}
                  </div>
                </span>
                {next.map((s) => (
                  <Button
                    key={s}
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={busy === s}
                    onClick={() => act(s, () => orderService.updateStatus(order.id, s), `Order ${ORDER_STATUS[s].label.toLowerCase()}`)}
                  >
                    {NEXT_LABEL[s] ?? ORDER_STATUS[s].label}
                  </Button>
                ))}
                {canCancel && (
                  <Button danger icon={<CloseCircleOutlined />} loading={busy === 'cancel'} onClick={cancel}>
                    Cancel
                  </Button>
                )}
              </div>
            )}

            <div className="section-card" style={{ padding: 0 }}>
              <h3 style={{ padding: '20px 20px 0' }}>Items</h3>
              <Table
                rowKey={(i) => `${i.productId}-${i.size}-${i.color}`}
                dataSource={order.items}
                pagination={false}
                scroll={{ x: 560 }}
                columns={[
                  {
                    title: 'Product',
                    render: (_, i) => (
                      <Link href={`/products/${i.productId}`} className="cell-product">
                        <Thumb src={i.image} />
                        <span>
                          <b>{i.name}</b>
                          <span className="muted" style={{ fontSize: 12 }}>
                            {[i.size && `Size ${i.size}`, i.color].filter(Boolean).join(' · ') || '—'}
                          </span>
                        </span>
                      </Link>
                    ),
                  },
                  { title: 'Price', align: 'right', render: (_, i) => <span className="num">{formatBDT(i.price)}</span> },
                  { title: 'Qty', dataIndex: 'quantity', align: 'center' },
                  { title: 'Total', align: 'right', render: (_, i) => <b className="num">{formatBDT(i.price * i.quantity)}</b> },
                ]}
              />
              <div style={{ padding: '12px 20px 20px', display: 'grid', justifyContent: 'end', gap: 6, fontSize: 14 }}>
                {[
                  ['Subtotal', formatBDT(order.subtotal)],
                  ...(order.discount ? [['Discount', `−${formatBDT(order.discount)}`]] : []),
                  ['Delivery', order.deliveryCharge ? formatBDT(order.deliveryCharge) : 'Free'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 48 }}>
                    <span className="muted">{k}</span>
                    <span className="num">{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 48, fontWeight: 800, fontSize: 17, borderTop: '1px dashed #D4D8CF', paddingTop: 8 }}>
                  <span>Total</span>
                  <span className="num">{formatBDT(order.total)}</span>
                </div>
                {order.paymentMethod === 'cod' && order.paymentStatus !== 'paid' && order.status !== 'cancelled' && (
                  <div style={{ color: '#B45309', fontWeight: 700, fontSize: 13 }}>Collect {formatBDT(order.total)} in cash on delivery</div>
                )}
              </div>
            </div>

            <div className="section-card">
              <h3>Timeline</h3>
              <Timeline
                items={[...order.timeline].reverse().map((e) => ({
                  color: e.status === 'cancelled' ? 'red' : e.type === 'note' ? 'gray' : e.type === 'payment' ? 'blue' : 'green',
                  children: (
                    <div>
                      <b>{eventText(e)}</b>
                      {e.note && <div style={{ margin: '2px 0' }}>{e.note}</div>}
                      <div className="muted" style={{ fontSize: 12 }}>
                        {formatDateTime(e.at)} · {e.by}
                      </div>
                    </div>
                  ),
                }))}
              />
              {canManage && (
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    prefix={<CommentOutlined className="muted" />}
                    placeholder="Add an internal note (e.g. customer asked for evening delivery)"
                    value={note}
                    maxLength={300}
                    onChange={(e) => setNote(e.target.value)}
                    onPressEnter={() => note.trim() && act('note', () => orderService.addNote(order.id, sanitizeText(note, 300)), 'Note added').then(() => setNote(''))}
                  />
                  <Button
                    loading={busy === 'note'}
                    disabled={!note.trim()}
                    onClick={() => act('note', () => orderService.addNote(order.id, sanitizeText(note, 300)), 'Note added').then(() => setNote(''))}
                  >
                    Add note
                  </Button>
                </Space.Compact>
              )}
            </div>
          </Col>

          <Col xs={24} xl={8}>
            <div className="section-card">
              <h3>Customer</h3>
              <dl className="kv">
                <dt>Name</dt>
                <dd>
                  {order.customerId ? <Link href={`/customers/${order.customerId}`} style={{ color: '#0A7C4A' }}>{order.shipping.fullName}</Link> : order.shipping.fullName}
                </dd>
                <dt>Phone</dt>
                <dd>
                  <a href={`tel:${order.shipping.phone}`} style={{ color: '#0A7C4A' }}>
                    <PhoneOutlined /> {order.shipping.phone}
                  </a>
                </dd>
                {order.shipping.email && (
                  <>
                    <dt>Email</dt>
                    <dd>{order.shipping.email}</dd>
                  </>
                )}
                <dt>Address</dt>
                <dd>
                  {order.shipping.address}, {order.shipping.area}
                  <br />
                  {order.shipping.district}, {order.shipping.division}
                </dd>
                {order.shipping.note && (
                  <>
                    <dt>Delivery note</dt>
                    <dd style={{ color: '#B45309' }}>{order.shipping.note}</dd>
                  </>
                )}
              </dl>
            </div>

            <div className="section-card">
              <h3>
                <CreditCardOutlined /> Payment
              </h3>
              <dl className="kv" style={{ marginBottom: 14 }}>
                <dt>Method</dt>
                <dd>
                  <PayChip method={order.paymentMethod} /> {PAYMENT_METHODS[order.paymentMethod].name}
                </dd>
                <dt>Status</dt>
                <dd>
                  <PaymentStatusTag status={order.paymentStatus} />
                </dd>
                {order.transactionId && (
                  <>
                    <dt>Transaction ID</dt>
                    <dd style={{ fontFamily: 'monospace' }}>{order.transactionId}</dd>
                  </>
                )}
              </dl>
              {canManage && (
                <Select<PaymentStatus>
                  value={order.paymentStatus}
                  style={{ width: '100%' }}
                  loading={busy === 'payment'}
                  options={Object.entries(PAYMENT_STATUS).map(([value, s]) => ({ value: value as PaymentStatus, label: `Mark as ${s.label.toLowerCase()}` }))}
                  onChange={(v) =>
                    modal.confirm({
                      title: `Change payment status to “${PAYMENT_STATUS[v].label}”?`,
                      content:
                        order.paymentMethod !== 'cod'
                          ? 'Online payments are normally updated automatically by the gateway. Only change this after checking the merchant dashboard.'
                          : undefined,
                      onOk: () => act('payment', () => orderService.updatePayment(order.id, v), 'Payment status updated'),
                    })
                  }
                />
              )}
            </div>

            <div className="section-card">
              <h3>
                <CarOutlined /> Courier
              </h3>
              {order.courier && (
                <p style={{ marginTop: 0 }}>
                  <b>{order.courier.name}</b> · <span style={{ fontFamily: 'monospace' }}>{order.courier.trackingId}</span>
                </p>
              )}
              {canManage && order.status !== 'cancelled' && order.status !== 'delivered' ? (
                <Form
                  form={courierForm}
                  layout="vertical"
                  onFinish={(v) => act('courier', () => orderService.updateCourier(order.id, v.name, v.trackingId.trim()), 'Courier saved')}
                >
                  <Form.Item name="name" label="Courier" rules={[{ required: true }]}>
                    <Select options={COURIERS.map((c) => ({ value: c, label: c }))} placeholder="Select courier" />
                  </Form.Item>
                  <Form.Item name="trackingId" label="Tracking / consignment ID" rules={[{ required: true }, { pattern: /^[A-Za-z0-9-]{4,40}$/, message: '4–40 letters/numbers' }]}>
                    <Input maxLength={40} />
                  </Form.Item>
                  <Button htmlType="submit" icon={<SyncOutlined />} loading={busy === 'courier'} block>
                    {order.courier ? 'Update courier' : 'Assign courier'}
                  </Button>
                </Form>
              ) : (
                !order.courier && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No courier assigned" />
              )}
            </div>
          </Col>
        </Row>
      </div>

      {/* Printable invoice */}
      <div className="print-only" style={{ fontSize: 13, color: '#000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0 }}>KhelaBD</h1>
            <div>House 12, Road 7, Dhanmondi, Dhaka 1205 · 09612-345678</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0 }}>INVOICE</h2>
            <div>#{order.orderNumber}</div>
            <div>{formatDateTime(order.createdAt)}</div>
          </div>
        </div>
        <hr />
        <p>
          <b>Ship to:</b> {order.shipping.fullName}, {order.shipping.phone}
          <br />
          {order.shipping.address}, {order.shipping.area}, {order.shipping.district}
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Item', 'Qty', 'Price', 'Total'].map((h) => (
                <th key={h} style={{ textAlign: h === 'Item' ? 'left' : 'right', borderBottom: '1px solid #000', padding: 6 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={`${i.productId}-${i.size}-${i.color}`}>
                <td style={{ padding: 6 }}>
                  {i.name} {[i.size, i.color].filter(Boolean).join(' / ')}
                </td>
                <td style={{ padding: 6, textAlign: 'right' }}>{i.quantity}</td>
                <td style={{ padding: 6, textAlign: 'right' }}>{formatBDT(i.price)}</td>
                <td style={{ padding: 6, textAlign: 'right' }}>{formatBDT(i.price * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ textAlign: 'right', marginTop: 10, lineHeight: 1.8 }}>
          Subtotal: {formatBDT(order.subtotal)}
          <br />
          {order.discount > 0 && (
            <>
              Discount: −{formatBDT(order.discount)}
              <br />
            </>
          )}
          Delivery: {formatBDT(order.deliveryCharge)}
          <br />
          <b style={{ fontSize: 16 }}>Total: {formatBDT(order.total)}</b>
          <br />
          Payment: {PAYMENT_METHODS[order.paymentMethod].name} ({PAYMENT_STATUS[order.paymentStatus].label})
          {order.paymentMethod === 'cod' && order.paymentStatus !== 'paid' && (
            <>
              <br />
              <b>COLLECT {formatBDT(order.total)} IN CASH</b>
            </>
          )}
        </div>
      </div>
    </>
  );
}
