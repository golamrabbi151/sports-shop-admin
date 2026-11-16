'use client';

import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Tag } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { API_CONFIG } from '@/config/api';
import { ROLE_LABEL } from '@/config/permissions';
import { getErrorMessage } from '@/lib/api/errors';
import { EMAIL_REGEX } from '@/lib/utils';
import { authService } from '@/services';
import { useAdminAuth } from '@/store/auth';
import type { AdminRole } from '@/types/admin';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;
const LOCK_KEY = 'kb_admin_login_lock';

const DEMO: { email: string; password: string; role: AdminRole }[] = [
  { email: 'admin@khelabd.com', password: 'Admin@123', role: 'super_admin' },
  { email: 'manager@khelabd.com', password: 'Manager@123', role: 'manager' },
  { email: 'support@khelabd.com', password: 'Support@123', role: 'support' },
];

/** Only allow internal redirect targets. */
const safePath = (p: string | null) => (p && p.startsWith('/') && !p.startsWith('//') && !p.startsWith('/\\') ? p : '/');

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setUser = useAdminAuth((s) => s.setUser);
  const [form] = Form.useForm<{ email: string; password: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(0);
  const reason = params.get('reason');

  // Client-side throttle is UX only — the API must rate-limit logins too.
  useEffect(() => {
    const saved = Number(sessionStorage.getItem(LOCK_KEY) ?? 0);
    const tick = () => setNow(Date.now());
    const raf = requestAnimationFrame(() => {
      setLockedUntil(saved);
      tick();
    });
    const id = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);
  const locked = lockedUntil > now;

  const onFinish = async ({ email, password }: { email: string; password: string }) => {
    if (locked) return;
    setLoading(true);
    setError(null);
    try {
      const user = await authService.login(email.trim().toLowerCase(), password);
      sessionStorage.removeItem('kb_admin_login_attempts');
      setUser(user);
      router.replace(safePath(params.get('redirect')));
      router.refresh();
    } catch (e) {
      const attempts = Number(sessionStorage.getItem('kb_admin_login_attempts') ?? 0) + 1;
      sessionStorage.setItem('kb_admin_login_attempts', String(attempts));
      if (attempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCK_MS;
        sessionStorage.setItem(LOCK_KEY, String(until));
        sessionStorage.setItem('kb_admin_login_attempts', '0');
        setLockedUntil(until);
        setNow(Date.now());
      }
      setError(getErrorMessage(e));
      form.setFieldValue('password', '');
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>Sign in</h2>
      <p className="muted" style={{ margin: '0 0 24px' }}>
        Use your staff account to access the admin console.
      </p>
      {reason === 'idle' && (
        <Alert type="info" showIcon title="You were signed out after a period of inactivity." style={{ marginBottom: 16 }} />
      )}
      {reason === 'expired' && (
        <Alert type="warning" showIcon title="Your session expired. Please sign in again." style={{ marginBottom: 16 }} />
      )}
      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
      {locked && (
        <Alert
          type="warning"
          showIcon
          title={`Too many attempts. Try again in ${Math.ceil((lockedUntil - now) / 1000)}s.`}
          style={{ marginBottom: 16 }}
        />
      )}
      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} disabled={loading || locked}>
        <Form.Item
          name="email"
          label="Work email"
          rules={[
            { required: true, message: 'Enter your email' },
            { pattern: EMAIL_REGEX, message: 'Enter a valid email' },
          ]}
        >
          <Input size="large" prefix={<MailOutlined className="muted" />} autoComplete="username" maxLength={120} autoFocus />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Enter your password' }]}>
          <Input.Password size="large" prefix={<LockOutlined className="muted" />} autoComplete="current-password" maxLength={128} />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ height: 48, marginTop: 4 }}>
          Sign in
        </Button>
      </Form>

      {API_CONFIG.useMock && (
        <div style={{ marginTop: 28, border: '1px dashed #C5CAC0', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }} className="muted">
            Demo accounts — click to fill
          </div>
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => form.setFieldsValue({ email: d.email, password: d.password })}
              style={{
                display: 'flex',
                width: '100%',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '7px 8px',
                background: 'none',
                border: 0,
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
              }}
            >
              <span>
                {d.email} <span className="muted">/ {d.password}</span>
              </span>
              <Tag color={ROLE_LABEL[d.role].color} style={{ margin: 0 }}>
                {ROLE_LABEL[d.role].label}
              </Tag>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
