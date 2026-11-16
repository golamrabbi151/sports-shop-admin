'use client';

import { CheckOutlined, DeleteOutlined, EditOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Avatar, Button, Form, Input, Modal, Radio, Space, Switch, Table, Tag } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ROLE_LABEL, ROLE_PERMISSIONS } from '@/config/permissions';
import { ApiError, getErrorMessage } from '@/lib/api/errors';
import { EMAIL_REGEX, sanitizeText, STRONG_PASSWORD_REGEX, timeAgo } from '@/lib/utils';
import { staffService } from '@/services';
import { useAdminAuth } from '@/store/auth';
import type { AdminRole, AdminUser, Permission, StaffInput } from '@/types/admin';

const PERM_LABEL: Record<Permission, string> = {
  'dashboard.view': 'View dashboard',
  'products.view': 'View products',
  'products.manage': 'Edit products',
  'catalog.manage': 'Categories & brands',
  'orders.view': 'View orders',
  'orders.manage': 'Process orders',
  'customers.view': 'View customers',
  'customers.manage': 'Block customers',
  'coupons.manage': 'Coupons',
  'reviews.manage': 'Moderate reviews',
  'settings.manage': 'Store settings',
  'staff.manage': 'Manage staff',
};
const ROLES = Object.keys(ROLE_LABEL) as AdminRole[];

export default function StaffPage() {
  const { message, modal } = App.useApp();
  const me = useAdminAuth((s) => s.user);
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminUser | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<StaffInput>();

  // Initial `loading` is true; reloads after edits refresh silently.
  const load = useCallback(() => {
    staffService
      .list()
      .then(setRows)
      .catch((e) => message.error(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [message]);
  useEffect(load, [load]);

  const open = (u: AdminUser | 'new') => {
    setEditing(u);
    form.setFieldsValue(u === 'new' ? { name: '', email: '', role: 'support', active: true, password: '' } : { ...u, password: '' });
  };

  const save = async () => {
    const v = await form.validateFields();
    const input: StaffInput = { ...v, name: sanitizeText(v.name, 60), email: v.email.trim().toLowerCase(), password: v.password || undefined };
    setSaving(true);
    try {
      if (editing === 'new') await staffService.create(input);
      else await staffService.update((editing as AdminUser).id, input);
      message.success('Staff member saved');
      setEditing(null);
      load();
    } catch (e) {
      const err = ApiError.from(e);
      if (err.fieldErrors) form.setFields(Object.entries(err.fieldErrors).map(([name, m]) => ({ name: name as keyof StaffInput, errors: [m] })));
      else message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const allPerms = Object.keys(PERM_LABEL) as Permission[];

  return (
    <>
      <PageHeader
        title="Staff & roles"
        subtitle="Who can access the admin console, and what they can do."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => open('new')}>
            Add staff
          </Button>
        }
      />
      <div className="section-card" style={{ padding: 0 }}>
        <Table<AdminUser>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          pagination={false}
          scroll={{ x: 720 }}
          columns={[
            {
              title: 'Name',
              render: (_, u) => (
                <span className="cell-product">
                  <Avatar style={{ background: '#0B1220', color: '#C6F432', fontWeight: 800 }}>{u.name[0]}</Avatar>
                  <span>
                    <b>
                      {u.name} {u.id === me?.id && <Tag style={{ marginLeft: 4 }}>You</Tag>}
                    </b>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {u.email}
                    </span>
                  </span>
                </span>
              ),
            },
            { title: 'Role', dataIndex: 'role', render: (r: AdminRole) => <Tag color={ROLE_LABEL[r].color}>{ROLE_LABEL[r].label}</Tag> },
            { title: 'Last sign-in', dataIndex: 'lastLoginAt', render: (v?: string) => <span className="muted">{v ? timeAgo(v) : 'Never'}</span> },
            { title: 'Status', dataIndex: 'active', render: (a: boolean) => (a ? <Tag color="green">Active</Tag> : <Tag>Disabled</Tag>) },
            {
              key: 'a',
              align: 'right',
              render: (_, u) => (
                <Space>
                  <Button icon={<EditOutlined />} onClick={() => open(u)} aria-label={`Edit ${u.name}`} />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    disabled={u.id === me?.id}
                    aria-label={`Remove ${u.name}`}
                    onClick={() =>
                      modal.confirm({
                        title: `Remove ${u.name}?`,
                        content: 'They will lose access immediately.',
                        okText: 'Remove',
                        okButtonProps: { danger: true },
                        onOk: async () => {
                          try {
                            await staffService.remove(u.id);
                            message.success('Staff member removed');
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

      <div className="section-card" style={{ padding: 0, marginTop: 16 }}>
        <h3 style={{ padding: '20px 20px 0' }}>What each role can do</h3>
        <Table
          rowKey="perm"
          pagination={false}
          size="small"
          scroll={{ x: 560 }}
          dataSource={allPerms.map((perm) => ({ perm }))}
          columns={[
            { title: 'Permission', dataIndex: 'perm', render: (p: Permission) => PERM_LABEL[p] },
            ...ROLES.map((r) => ({
              title: ROLE_LABEL[r].label,
              key: r,
              align: 'center' as const,
              render: (_: unknown, row: { perm: Permission }) =>
                ROLE_PERMISSIONS[r].includes(row.perm) ? (
                  <CheckOutlined style={{ color: '#0A7C4A' }} aria-label="Allowed" />
                ) : (
                  <MinusOutlined style={{ color: '#CBD5E1' }} aria-label="Not allowed" />
                ),
            })),
          ]}
        />
      </div>

      <Modal
        title={editing === 'new' ? 'Add staff member' : 'Edit staff member'}
        open={editing != null}
        onCancel={() => setEditing(null)}
        onOk={save}
        okText="Save"
        confirmLoading={saving}
        destroyOnHidden
        width={560}
      >
        <Form form={form} layout="vertical" requiredMark="optional" autoComplete="off">
          <Form.Item name="name" label="Full name" rules={[{ required: true }, { min: 2, max: 60 }]}>
            <Input maxLength={60} />
          </Form.Item>
          <Form.Item name="email" label="Work email" rules={[{ required: true }, { pattern: EMAIL_REGEX, message: 'Invalid email' }]}>
            <Input maxLength={120} autoComplete="off" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Radio.Group style={{ display: 'grid', gap: 8 }}>
              {ROLES.map((r) => (
                <Radio key={r} value={r}>
                  <b>{ROLE_LABEL[r].label}</b> <span className="muted">— {ROLE_LABEL[r].description}</span>
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="password"
            label={editing === 'new' ? 'Temporary password' : 'Reset password'}
            extra={editing === 'new' ? 'Share it securely; ask them to change it after first sign-in.' : 'Leave empty to keep the current password.'}
            rules={[
              { required: editing === 'new', message: 'Set a temporary password' },
              { pattern: STRONG_PASSWORD_REGEX, message: '10+ chars with upper, lower, number and symbol' },
            ]}
          >
            <Input.Password maxLength={128} autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="active" label="Account active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
