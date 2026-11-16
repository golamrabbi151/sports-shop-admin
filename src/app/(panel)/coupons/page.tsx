'use client';

import { CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, DatePicker, Form, Input, InputNumber, Modal, Progress, Select, Space, Switch, Table, Tag } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ApiError, getErrorMessage } from '@/lib/api/errors';
import { formatBDT, formatDate, sanitizeText } from '@/lib/utils';
import { couponService } from '@/services';
import type { AdminCoupon, CouponInput } from '@/types/admin';

type FormValues = Omit<CouponInput, 'expiresAt'> & { expiresAt?: Dayjs };

const describe = (c: Pick<AdminCoupon, 'type' | 'value'>) =>
  c.type === 'percent' ? `${c.value}% off` : c.type === 'flat' ? `${formatBDT(c.value)} off` : 'Free delivery';

export default function CouponsPage() {
  const { message, modal } = App.useApp();
  const [rows, setRows] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminCoupon | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const type = Form.useWatch('type', form);

  // Initial `loading` is true; reloads after edits refresh silently.
  const load = useCallback(() => {
    couponService
      .list()
      .then(setRows)
      .catch((e) => message.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [message]);
  useEffect(load, [load]);

  const open = (c: AdminCoupon | 'new') => {
    setEditing(c);
    form.setFieldsValue(
      c === 'new'
        ? { code: '', type: 'percent', value: 10, minOrder: 0, description: '', active: true, usageLimit: undefined, expiresAt: undefined }
        : { ...c, expiresAt: c.expiresAt ? dayjs(c.expiresAt) : undefined },
    );
  };

  const save = async () => {
    const v = await form.validateFields();
    const input: CouponInput = {
      ...v,
      code: v.code.trim().toUpperCase(),
      description: sanitizeText(v.description, 120),
      value: v.type === 'free_shipping' ? 0 : v.value,
      expiresAt: v.expiresAt?.endOf('day').toISOString(),
    };
    setSaving(true);
    try {
      if (editing === 'new') await couponService.create(input);
      else await couponService.update((editing as AdminCoupon).id, input);
      message.success('Coupon saved');
      setEditing(null);
      load();
    } catch (e) {
      const err = ApiError.from(e);
      if (err.fieldErrors) form.setFields(Object.entries(err.fieldErrors).map(([name, m]) => ({ name: name as keyof FormValues, errors: [m] })));
      else message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: AdminCoupon, active: boolean) => {
    try {
      const { id: _id, usedCount: _u, ...input } = c;
      void _id;
      void _u;
      await couponService.update(c.id, { ...input, active });
      load();
    } catch (e) {
      message.error(getErrorMessage(e));
    }
  };

  return (
    <>
      <PageHeader
        title="Coupons"
        subtitle="Discount codes customers can enter at checkout."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => open('new')}>
            Create coupon
          </Button>
        }
      />
      <div className="section-card" style={{ padding: 0 }}>
        <Table<AdminCoupon>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          pagination={false}
          scroll={{ x: 860 }}
          columns={[
            {
              title: 'Code',
              render: (_, c) => (
                <span>
                  <Tag style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>{c.code}</Tag>
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    aria-label={`Copy ${c.code}`}
                    onClick={() => navigator.clipboard.writeText(c.code).then(() => message.success('Copied'))}
                  />
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {c.description}
                  </div>
                </span>
              ),
            },
            { title: 'Discount', render: (_, c) => <b>{describe(c)}</b> },
            { title: 'Min. order', dataIndex: 'minOrder', render: (v: number) => (v ? formatBDT(v) : '—') },
            {
              title: 'Usage',
              render: (_, c) =>
                c.usageLimit ? (
                  <div style={{ minWidth: 120 }}>
                    <span className="num">
                      {c.usedCount} / {c.usageLimit}
                    </span>
                    <Progress percent={Math.round((c.usedCount / c.usageLimit) * 100)} showInfo={false} size="small" strokeColor="#0A7C4A" />
                  </div>
                ) : (
                  <span className="num">{c.usedCount} used</span>
                ),
            },
            {
              title: 'Expires',
              dataIndex: 'expiresAt',
              render: (v?: string) =>
                !v ? <span className="muted">Never</span> : dayjs(v).isBefore(dayjs()) ? <Tag color="red">Expired {formatDate(v)}</Tag> : formatDate(v),
            },
            { title: 'Active', render: (_, c) => <Switch checked={c.active} onChange={(a) => toggle(c, a)} aria-label={`Toggle ${c.code}`} /> },
            {
              key: 'a',
              align: 'right',
              render: (_, c) => (
                <Space>
                  <Button icon={<EditOutlined />} onClick={() => open(c)} aria-label={`Edit ${c.code}`} />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    aria-label={`Delete ${c.code}`}
                    onClick={() =>
                      modal.confirm({
                        title: `Delete coupon ${c.code}?`,
                        okText: 'Delete',
                        okButtonProps: { danger: true },
                        onOk: async () => {
                          try {
                            await couponService.remove(c.id);
                            message.success('Coupon deleted');
                            load();
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

      <Modal
        title={editing === 'new' ? 'Create coupon' : 'Edit coupon'}
        open={editing != null}
        onCancel={() => setEditing(null)}
        onOk={save}
        okText="Save"
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item
            name="code"
            label="Code"
            normalize={(v: string) => v.toUpperCase().replace(/\s/g, '')}
            rules={[{ required: true }, { pattern: /^[A-Z0-9]{3,20}$/, message: '3–20 letters or numbers' }]}
          >
            <Input maxLength={20} placeholder="e.g. WINTER20" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="type" label="Type" rules={[{ required: true }]}>
              <Select
                style={{ width: 180 }}
                options={[
                  { value: 'percent', label: 'Percentage off' },
                  { value: 'flat', label: 'Fixed amount off' },
                  { value: 'free_shipping', label: 'Free delivery' },
                ]}
              />
            </Form.Item>
            {type !== 'free_shipping' && (
              <Form.Item
                name="value"
                label={type === 'percent' ? 'Percent' : 'Amount (৳)'}
                rules={[{ required: true }, { type: 'number', min: 1, max: type === 'percent' ? 90 : 100000 }]}
              >
                <InputNumber min={1} max={type === 'percent' ? 90 : 100000} precision={0} suffix={type === 'percent' ? '%' : undefined} prefix={type === 'flat' ? '৳' : undefined} style={{ width: 140 }} />
              </Form.Item>
            )}
          </Space>
          <Form.Item name="description" label="Description (shown to customer)" rules={[{ required: true }, { max: 120 }]}>
            <Input maxLength={120} placeholder="e.g. 20% off winter sportswear" />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start" wrap>
            <Form.Item name="minOrder" label="Minimum order (৳)">
              <InputNumber min={0} max={1000000} precision={0} prefix="৳" style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="usageLimit" label="Usage limit" extra="Empty = unlimited">
              <InputNumber min={1} max={1000000} precision={0} style={{ width: 130 }} />
            </Form.Item>
            <Form.Item name="expiresAt" label="Expires on">
              <DatePicker disabledDate={(d) => d.isBefore(dayjs().startOf('day'))} />
            </Form.Item>
          </Space>
          <Form.Item name="active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
