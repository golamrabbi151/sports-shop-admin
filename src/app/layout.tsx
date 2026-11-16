import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/manrope';
import '@fontsource/barlow-condensed/800.css';
import '@fontsource/barlow-condensed/800-italic.css';
import './globals.css';
import { AppProviders } from '@/providers/AppProviders';

export const metadata: Metadata = {
  title: { default: 'KhelaBD Admin', template: '%s · KhelaBD Admin' },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { themeColor: '#0B1220', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
