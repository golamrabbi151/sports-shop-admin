import { Tag } from 'antd';
import { ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from '@/config/site';
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/types';

export function PayChip({ method }: { method: PaymentMethod }) {
  const m = PAYMENT_METHODS[method];
  return (
    <span className="pay-chip" style={{ background: m.color, color: m.textColor }} title={m.name}>
      {m.short}
    </span>
  );
}

export function OrderStatusTag({ status }: { status: OrderStatus }) {
  return (
    <Tag color={ORDER_STATUS[status].color} style={{ margin: 0 }}>
      {ORDER_STATUS[status].label}
    </Tag>
  );
}

export function PaymentStatusTag({ status }: { status: PaymentStatus }) {
  return (
    <Tag color={PAYMENT_STATUS[status].color} style={{ margin: 0 }} variant="outlined">
      {PAYMENT_STATUS[status].label}
    </Tag>
  );
}
