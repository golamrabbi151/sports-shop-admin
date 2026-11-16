import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';
const isHttps = (process.env.NEXT_PUBLIC_ADMIN_URL ?? '').startsWith('https://');

function originOf(url?: string) {
  try {
    return url ? new URL(url).origin : '';
  } catch {
    return '';
  }
}
const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_BASE_URL);
const storeOrigin = originOf(process.env.NEXT_PUBLIC_STORE_URL);

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'", // antd CSS-in-JS
  `img-src 'self' data: blob: https: ${storeOrigin}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin}${isDev ? ' ws: wss:' : ''}`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isHttps ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // The admin panel must never appear in search engines.
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  experimental: { optimizePackageImports: ['antd', '@ant-design/icons'] },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Never cache authenticated admin pages in shared caches.
      { source: '/((?!_next/static|images).*)', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] },
    ];
  },
};

export default nextConfig;
