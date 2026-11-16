'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Point = { label: string; value: number };

/**
 * Lightweight single-series area chart (pure SVG, no chart library).
 * Crosshair + tooltip on hover/touch, keyboard accessible, with a table fallback for screen readers.
 */
export function AreaChart({
  data,
  height = 260,
  format,
  axisFormat = format,
  name,
  color = '#0A7C4A',
}: {
  data: Point[];
  height?: number;
  format: (v: number) => string;
  axisFormat?: (v: number) => string;
  name: string;
  color?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = { top: 16, right: 12, bottom: 28, left: 56 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const { max, ticks, xs, ys, line, area } = useMemo(() => {
    const rawMax = Math.max(1, ...data.map((d) => d.value));
    const mag = Math.pow(10, Math.floor(Math.log10(rawMax)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => rawMax / s <= 4) ?? mag * 10;
    const max = Math.ceil(rawMax / step) * step;
    const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
    const xs = data.map((_, i) => (data.length <= 1 ? w / 2 : (i / (data.length - 1)) * w));
    const ys = data.map((d) => h - (d.value / max) * h);
    const line = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join('');
    const area = `${line}L${xs.at(-1) ?? 0},${h}L0,${h}Z`;
    return { max, ticks, xs, ys, line, area };
  }, [data, w, h]);

  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(w / 80))));

  const onMove = (clientX: number) => {
    const rect = wrap.current!.getBoundingClientRect();
    const x = clientX - rect.left - pad.left;
    const i = Math.round((x / w) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  const active = hover != null ? data[hover] : null;

  return (
    <div className="chart-wrap" ref={wrap}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`${name} chart`}
        tabIndex={0}
        onMouseMove={(e) => onMove(e.clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onMouseLeave={() => setHover(null)}
        onBlur={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') setHover((i) => Math.min(data.length - 1, (i ?? -1) + 1));
          if (e.key === 'ArrowLeft') setHover((i) => Math.max(0, (i ?? data.length) - 1));
        }}
        style={{ display: 'block', outline: 'none', touchAction: 'pan-y' }}
      >
        <defs>
          <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.22" />
            <stop offset="1" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <g transform={`translate(${pad.left},${pad.top})`}>
          {ticks.map((t) => {
            const y = h - (t / max) * h;
            return (
              <g key={t}>
                <line x1={0} x2={w} y1={y} y2={y} stroke="#E6E8E3" strokeDasharray={t === 0 ? undefined : '3 4'} />
                <text x={-10} y={y} dy="0.32em" textAnchor="end" fontSize={11} fill="#64748B">
                  {axisFormat(t)}
                </text>
              </g>
            );
          })}
          {data.map((d, i) =>
            i % labelEvery === 0 ? (
              <text key={d.label} x={xs[i]} y={h + 18} textAnchor="middle" fontSize={11} fill="#64748B">
                {d.label}
              </text>
            ) : null,
          )}
          <path d={area} fill="url(#area-fill)" />
          <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {hover != null && (
            <>
              <line x1={xs[hover]} x2={xs[hover]} y1={0} y2={h} stroke="#0B1220" strokeOpacity={0.25} />
              <circle cx={xs[hover]} cy={ys[hover]} r={5} fill={color} stroke="#fff" strokeWidth={2} />
            </>
          )}
        </g>
      </svg>
      {active && hover != null && (
        <div className="chart-tooltip" style={{ left: pad.left + xs[hover], top: pad.top + ys[hover] }}>
          <div style={{ opacity: 0.7 }}>{active.label}</div>
          <b>{format(active.value)}</b> {name.toLowerCase()}
        </div>
      )}
      <table style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        <caption>{name}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th>{d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
