'use client';

import { Tooltip } from 'antd';
import type { ReactNode } from 'react';

/** Horizontal single-hue bars with labels and values (identity is never colour-only). */
export function BarList({
  rows,
}: {
  rows: { key: string; label: ReactNode; value: number; display: string; tooltip?: ReactNode }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="barlist" role="list">
      {rows.map((r) => (
        <Tooltip key={r.key} title={r.tooltip ?? r.display} placement="top">
          <div className="barlist__row" role="listitem" tabIndex={0}>
            <span style={{ fontWeight: 600 }}>{r.label}</span>
            <span className="barlist__track">
              <span className="barlist__fill" style={{ width: `${(r.value / max) * 100}%`, display: 'block' }} />
            </span>
            <span className="num" style={{ fontWeight: 700, minWidth: 48, textAlign: 'right' }}>
              {r.display}
            </span>
          </div>
        </Tooltip>
      ))}
    </div>
  );
}
