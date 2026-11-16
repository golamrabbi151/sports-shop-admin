import { Breadcrumb } from 'antd';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  extra,
  crumbs,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  extra?: ReactNode;
  crumbs?: { label: string; href?: string }[];
}) {
  return (
    <div className="page-head">
      <div>
        {crumbs && (
          <Breadcrumb
            items={crumbs.map((c) => ({ title: c.href ? <Link href={c.href}>{c.label}</Link> : c.label }))}
          />
        )}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {extra && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{extra}</div>}
    </div>
  );
}
