import type { ThemeConfig } from 'antd';

export const BRAND = {
  ink: '#0B1220',
  ink2: '#151F33',
  primary: '#0A7C4A',
  lime: '#C6F432',
  sale: '#E5243B',
  surface: '#F4F5F1',
  muted: '#64748B',
  border: '#E6E8E3',
} as const;

export const themeConfig: ThemeConfig = {
  hashed: false,
  token: {
    colorPrimary: BRAND.primary,
    colorInfo: BRAND.primary,
    colorError: BRAND.sale,
    colorText: BRAND.ink,
    colorTextSecondary: BRAND.muted,
    colorBorderSecondary: BRAND.border,
    colorBgLayout: BRAND.surface,
    borderRadius: 8,
    borderRadiusLG: 14,
    fontFamily: "'Manrope Variable', system-ui, -apple-system, 'Segoe UI', sans-serif",
    fontSize: 14,
  },
  components: {
    Layout: { siderBg: BRAND.ink, headerBg: '#ffffff', headerHeight: 64, headerPadding: '0 24px' },
    Menu: {
      darkItemBg: BRAND.ink,
      darkSubMenuItemBg: BRAND.ink,
      darkItemSelectedBg: 'rgba(198,244,50,.12)',
      darkItemSelectedColor: BRAND.lime,
      darkItemColor: '#A9B4C7',
      darkItemHoverColor: '#ffffff',
      itemBorderRadius: 8,
      itemMarginInline: 10,
    },
    Table: { headerBg: '#FAFBF8', headerColor: BRAND.muted, rowHoverBg: '#F7F9F4', cellPaddingBlock: 12 },
    Card: { headerFontSize: 15 },
    Button: { fontWeight: 600, primaryShadow: 'none', defaultShadow: 'none', dangerShadow: 'none' },
    Tag: { defaultBg: '#F1F3EE' },
  },
};
