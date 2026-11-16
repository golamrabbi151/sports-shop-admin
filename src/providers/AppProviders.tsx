'use client';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App, ConfigProvider } from 'antd';
import enGB from 'antd/locale/en_GB';
import type { ReactNode } from 'react';
import { themeConfig } from '@/theme/themeConfig';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={themeConfig} locale={enGB} wave={{ disabled: true }}>
        <App message={{ maxCount: 3 }} notification={{ placement: 'bottomRight' }}>
          {children}
        </App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
