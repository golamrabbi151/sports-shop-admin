import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="login">
      <div className="login__art">
        <div className="shell-logo" style={{ padding: 0, border: 0, position: 'relative' }}>
          <span className="shell-logo__mark">K</span>
          <span className="shell-logo__text">
            KhelaBD<small>Admin console</small>
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <h1 className="login__title">
            Run the
            <em>whole shop.</em>
          </h1>
          <p style={{ color: '#CBD5E1', maxWidth: 440, lineHeight: 1.7 }}>
            Products, orders, payments, couriers, customers and coupons — all in one place.
          </p>
        </div>
        <p style={{ color: '#64748B', fontSize: 12.5, position: 'relative', margin: 0 }}>
          Authorised staff only. All activity is logged.
        </p>
      </div>
      <div className="login__form">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
