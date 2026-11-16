'use client';

import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { Alert, App, Button, Col, DatePicker, Form, Input, InputNumber, Row, Skeleton, Switch } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { PayChip } from '@/components/common/Badges';
import { PageHeader } from '@/components/common/PageHeader';
import { API_CONFIG } from '@/config/api';
import { PAYMENT_METHODS } from '@/config/site';
import { getErrorMessage } from '@/lib/api/errors';
import { BD_PHONE_REGEX, EMAIL_REGEX, sanitizeText } from '@/lib/utils';
import { settingsService } from '@/services';
import type { PaymentMethod } from '@/types';
import type { StoreSettings } from '@/types/admin';

type FormValues = Omit<StoreSettings, 'flashSaleEndsAt'> & { flashSaleEndsAt?: Dayjs };

export default function SettingsPage() {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const payments = Form.useWatch('payments', form);

  useEffect(() => {
    settingsService
      .get()
      .then((s) => {
        form.setFieldsValue({ ...s, flashSaleEndsAt: s.flashSaleEndsAt ? dayjs(s.flashSaleEndsAt) : undefined });
        setLoaded(true);
      })
      .catch((e) => message.error(getErrorMessage(e)));
  }, [form, message]);

  const onFinish = async (v: FormValues) => {
    if (!Object.values(v.payments).some(Boolean)) {
      message.error('At least one payment method must be enabled.');
      return;
    }
    setSaving(true);
    try {
      await settingsService.update({
        ...v,
        storeName: sanitizeText(v.storeName, 60),
        address: sanitizeText(v.address, 200),
        announcement: sanitizeText(v.announcement, 120),
        flashSaleEndsAt: v.flashSaleEndsAt?.toISOString(),
      });
      message.success('Settings saved');
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <Skeleton active paragraph={{ rows: 12 }} />;

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional" disabled={saving}>
      <PageHeader
        title="Settings"
        subtitle="Store details, delivery charges and payment options."
        extra={
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
            Save settings
          </Button>
        }
      />
      <Row gutter={16}>
        <Col xs={24} xl={12}>
          <div className="section-card">
            <h3>Store details</h3>
            <Form.Item name="storeName" label="Store name" rules={[{ required: true }, { max: 60 }]}>
              <Input maxLength={60} />
            </Form.Item>
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="hotline"
                  label="Hotline"
                  rules={[
                    { required: true },
                    {
                      validator: (_, v: string) =>
                        !v || BD_PHONE_REGEX.test(v.replace(/[\s-]/g, '')) || /^0\d{4}-?\d{6}$/.test(v) ? Promise.resolve() : Promise.reject(new Error('Enter a valid BD phone/hotline')),
                    },
                  ]}
                >
                  <Input maxLength={20} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="email" label="Support email" rules={[{ required: true }, { pattern: EMAIL_REGEX, message: 'Invalid email' }]}>
                  <Input maxLength={120} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="address" label="Address" rules={[{ required: true }, { max: 200 }]}>
              <Input.TextArea rows={2} maxLength={200} />
            </Form.Item>
            <Form.Item name="announcement" label="Announcement bar text" extra="Shown at the very top of the store." rules={[{ max: 120 }]}>
              <Input maxLength={120} showCount />
            </Form.Item>
          </div>

          <div className="section-card">
            <h3>Store status</h3>
            <Form.Item name="maintenanceMode" label="Maintenance mode" valuePropName="checked" extra="Customers see a “back soon” page; staff can still use the admin.">
              <Switch />
            </Form.Item>
            <Form.Item name="flashSaleEndsAt" label="Flash sale ends at" extra="Drives the countdown on the home page.">
              <DatePicker showTime={{ format: 'HH:mm' }} format="D MMM YYYY, HH:mm" />
            </Form.Item>
            <Form.Item name="lowStockThreshold" label="Low-stock alert threshold" rules={[{ required: true }]}>
              <InputNumber min={0} max={1000} precision={0} addonAfter="units" />
            </Form.Item>
          </div>
        </Col>

        <Col xs={24} xl={12}>
          <div className="section-card">
            <h3>Delivery charges</h3>
            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Form.Item name={['delivery', 'insideDhaka']} label="Inside Dhaka" rules={[{ required: true }]}>
                  <InputNumber min={0} max={5000} precision={0} prefix="৳" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name={['delivery', 'outsideDhaka']} label="Outside Dhaka" rules={[{ required: true }]}>
                  <InputNumber min={0} max={5000} precision={0} prefix="৳" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name={['delivery', 'freeThreshold']} label="Free delivery over" rules={[{ required: true }]}>
                  <InputNumber min={0} max={1000000} precision={0} prefix="৳" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="section-card">
            <h3>Payment methods</h3>
            {(Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((m) => (
              <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F1F3EE' }}>
                <PayChip method={m} />
                <span style={{ flex: 1, fontWeight: 600 }}>{PAYMENT_METHODS[m].name}</span>
                <Form.Item name={['payments', m]} valuePropName="checked" noStyle>
                  <Switch aria-label={`Enable ${PAYMENT_METHODS[m].name}`} />
                </Form.Item>
              </div>
            ))}
            {payments && !payments.cod && (
              <Alert type="warning" showIcon style={{ marginTop: 12 }} title="Most Bangladeshi shoppers prefer Cash on Delivery — disabling it may reduce orders." />
            )}
            <Form.Item
              name="codMaxAmount"
              label="Maximum order value for Cash on Delivery"
              extra="Orders above this must be paid online (reduces fake/high-risk COD orders)."
              style={{ marginTop: 16 }}
              rules={[{ required: true }]}
            >
              <InputNumber min={0} max={10000000} precision={0} prefix="৳" style={{ width: 220 }} />
            </Form.Item>
            <Alert
              type="info"
              showIcon
              title="Gateway credentials (bKash app key/secret, SSLCommerz store ID/password) are configured on the server only — never in this panel or the browser."
            />
          </div>

          {API_CONFIG.useMock && (
            <div className="section-card">
              <h3>Demo data</h3>
              <p className="muted" style={{ marginTop: 0 }}>
                The panel is running on sample data saved in this browser. Reset it to the original sample set.
              </p>
              <Button
                icon={<ReloadOutlined />}
                danger
                onClick={() =>
                  modal.confirm({
                    title: 'Reset all demo data?',
                    content: 'Every change you made in this browser will be lost.',
                    okText: 'Reset',
                    okButtonProps: { danger: true },
                    onOk: async () => {
                      await settingsService.resetDemoData();
                      window.location.reload();
                    },
                  })
                }
              >
                Reset demo data
              </Button>
            </div>
          )}
        </Col>
      </Row>
    </Form>
  );
}
