import type { ListQuery } from '@/types/admin';
import type { Paginated } from '@/types';

const bdt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** ৳1,25,000 — Bangladeshi digit grouping. */
export const formatBDT = (n: number) => `৳${bdt.format(Math.round(n))}`;
export const formatNumber = (n: number) => bdt.format(n);

/** Compact money for axes/tiles: ৳1.2L, ৳3.4Cr, ৳12K */
export function formatBDTCompact(n: number): string {
  if (n >= 1e7) return `৳${(n / 1e7).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (n >= 1e5) return `৳${(n / 1e5).toFixed(1).replace(/\.0$/, '')}L`;
  if (n >= 1e3) return `৳${(n / 1e3).toFixed(0)}K`;
  return `৳${Math.round(n)}`;
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return formatDate(iso);
}

export function slugify(v: string): string {
  return v
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/* ───────────── Validation ───────────── */
export const BD_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** 10+ chars, upper, lower, number and symbol — admin accounts deserve more. */
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/;
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Strip control chars & angle brackets from free text (defence in depth; React escapes output). */
export function sanitizeText(value: string, maxLength = 2000): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

/* ───────────── CSV export (with formula-injection protection) ───────────── */
function csvCell(v: unknown): string {
  let s = v == null ? '' : String(v);
  // Prevent CSV/Excel formula injection: =, +, -, @, tab, CR at the start.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.map(csvCell).join(','), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(','))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }); // BOM so Excel shows ৳ correctly
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

/* ───────────── Images ───────────── */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_MB = 5;

/** Resize + re-encode an image in the browser (strips EXIF/GPS metadata too). */
export async function resizeImage(file: File, max = 1000, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Image encode failed'))), 'image/webp', quality),
  );
}

export const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(b);
  });

/* ───────────── Mock list helper (search / sort / paginate) ───────────── */
export function paginate<T>(
  rows: T[],
  query: ListQuery,
  searchFields: ((row: T) => string | undefined)[] = [],
): Paginated<T> {
  const { page = 1, pageSize = 10, q, sort } = query;
  let out = rows;
  if (q?.trim()) {
    const needle = q.trim().toLowerCase();
    out = out.filter((r) => searchFields.some((f) => f(r)?.toLowerCase().includes(needle)));
  }
  if (sort) {
    const [field, dir] = sort.split(':');
    const mul = dir === 'asc' ? 1 : -1;
    out = [...out].sort((a, b) => {
      const av = (a as Record<string, unknown>)[field];
      const bv = (b as Record<string, unknown>)[field];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mul;
      return String(av ?? '').localeCompare(String(bv ?? '')) * mul;
    });
  }
  const start = (page - 1) * pageSize;
  return { items: out.slice(start, start + pageSize), total: out.length, page, pageSize };
}

/** Drop undefined/empty values before sending query params. */
export function cleanParams<T extends object>(q: T): Partial<T> {
  return Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== null && v !== '')) as Partial<T>;
}
