/* eslint-disable @next/next/no-img-element -- admin thumbnails may be data:/blob:/CDN URLs */
import { ADMIN } from '@/config/site';

/** Resolves storefront-relative image paths (e.g. /images/...) against the store URL when needed. */
export function imageSrc(src: string) {
  if (!src) return '';
  if (src.startsWith('data:') || src.startsWith('blob:') || /^https?:\/\//.test(src)) return src;
  return src.startsWith('/images/') ? src : `${ADMIN.storeUrl}${src}`;
}

export function Thumb({ src, alt = '', size = 44 }: { src: string; alt?: string; size?: number }) {
  return (
    <span className="thumb" style={{ width: size, height: size }}>
      {src ? <img src={imageSrc(src)} alt={alt} loading="lazy" decoding="async" /> : null}
    </span>
  );
}
