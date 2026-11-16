'use client';

import { App, Form, Input, Modal } from 'antd';
import { useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import { STRONG_PASSWORD_REGEX } from '@/lib/utils';
import { authService } from '@/services';
import { useAdminAuth } from '@/store/auth';

type Values = { current: string; next: string; confirm: string };

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { message } = App.useApp();
  const user = useAdminAuth((s) => s.user);
  const [form] = Form.useForm<Values>();
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      await authService.changePassword(user!.id, v.current, v.next);
      message.success('Password updated');
      form.resetFields();
      onClose();
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Change password" open={open} onCancel={onClose} onOk={submit} okText="Update password" confirmLoading={saving} destroyOnHidden>
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item name="current" label="Current password" rules={[{ required: true }]}>
          <Input.Password autoComplete="current-password" maxLength={128} />
        </Form.Item>
        <Form.Item
          name="next"
          label="New password"
          extra="At least 10 characters with upper & lower case, a number and a symbol."
          rules={[
            { required: true },
            { pattern: STRONG_PASSWORD_REGEX, message: 'Password is not strong enough' },
            ({ getFieldValue }) => ({
              validator: (_, v) => (v && v === getFieldValue('current') ? Promise.reject(new Error('Use a different password')) : Promise.resolve()),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" maxLength={128} />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="Confirm new password"
          dependencies={['next']}
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator: (_, v) => (!v || v === getFieldValue('next') ? Promise.resolve() : Promise.reject(new Error('Passwords do not match'))),
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" maxLength={128} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
