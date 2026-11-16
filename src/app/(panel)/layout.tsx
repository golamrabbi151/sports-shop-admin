import { Spin } from 'antd';
import { Suspense } from 'react';
import { AdminShell } from '@/components/shell/AdminShell';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      <Suspense fallback={<Spin style={{ display: 'block', margin: '80px auto' }} />}>{children}</Suspense>
    </AdminShell>
  );
}
