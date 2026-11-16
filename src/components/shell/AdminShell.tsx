'use client';

import {
  AppstoreOutlined,
  BellOutlined,
  DashboardOutlined,
  ExportOutlined,
  GiftOutlined,
  KeyOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  TagsOutlined,
  TeamOutlined,
  TrademarkOutlined,
  UserOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import { App, Avatar, Badge, Button, Drawer, Dropdown, Grid, Layout, Menu, Result, Spin, Tag, type MenuProps } from 'antd';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { can, permissionForPath, ROLE_LABEL } from '@/config/permissions';
import { ADMIN } from '@/config/site';
import { useHydrated } from '@/hooks/useHydrated';
import { authService, orderService, productService, reviewService } from '@/services';
import { useAdminAuth } from '@/store/auth';
import type { Permission } from '@/types/admin';
import { ChangePasswordModal } from './ChangePasswordModal';

const { Sider, Header, Content } = Layout;

type NavItem = { key: string; label: string; icon: ReactNode; perm: Permission; group?: string };

const NAV: NavItem[] = [
  { key: '/', label: 'Dashboard', icon: <DashboardOutlined />, perm: 'dashboard.view' },
  { key: '/orders', label: 'Orders', icon: <ShoppingCartOutlined />, perm: 'orders.view', group: 'Sales' },
  { key: '/customers', label: 'Customers', icon: <TeamOutlined />, perm: 'customers.view', group: 'Sales' },
  { key: '/coupons', label: 'Coupons', icon: <GiftOutlined />, perm: 'coupons.manage', group: 'Sales' },
  { key: '/products', label: 'Products', icon: <AppstoreOutlined />, perm: 'products.view', group: 'Catalogue' },
  { key: '/categories', label: 'Categories', icon: <TagsOutlined />, perm: 'catalog.manage', group: 'Catalogue' },
  { key: '/brands', label: 'Brands', icon: <TrademarkOutlined />, perm: 'catalog.manage', group: 'Catalogue' },
  { key: '/reviews', label: 'Reviews', icon: <StarOutlined />, perm: 'reviews.manage', group: 'Catalogue' },
  { key: '/staff', label: 'Staff & roles', icon: <UsergroupAddOutlined />, perm: 'staff.manage', group: 'Admin' },
  { key: '/settings', label: 'Settings', icon: <SettingOutlined />, perm: 'settings.manage', group: 'Admin' },
];

function useNotifications(enabled: boolean) {
  const role = useAdminAuth((s) => s.user?.role);
  const pathname = usePathname();
  const [counts, setCounts] = useState({ orders: 0, reviews: 0, stock: 0 });
  useEffect(() => {
    if (!enabled || !role) return;
    let alive = true;
    const one = { page: 1, pageSize: 1 };
    Promise.allSettled([
      can(role, 'orders.view') ? orderService.list({ ...one, status: 'pending' }) : null,
      can(role, 'reviews.manage') ? reviewService.list({ ...one, status: 'pending' }) : null,
      can(role, 'products.view') ? productService.list({ ...one, stock: 'low' }) : null,
    ]).then(([o, r, l]) => {
      if (!alive) return;
      const total = (x: PromiseSettledResult<{ total: number } | null>) => (x.status === 'fulfilled' && x.value ? x.value.total : 0);
      setCounts({ orders: total(o), reviews: total(r), stock: total(l) });
    });
    return () => {
      alive = false;
    };
  }, [enabled, role, pathname]);
  return counts;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const router = useRouter();
  const { modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = hydrated && !screens.lg;
  const { user, setUser } = useAdminAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const counts = useNotifications(verified);

  const signOut = useCallback(
    async (reason?: 'idle' | 'expired') => {
      await authService.logout().catch(() => undefined);
      setUser(null);
      router.replace(reason ? `/login?reason=${reason}` : '/login');
      router.refresh();
    },
    [router, setUser],
  );

  // Validate the session with the server on load (role may have changed).
  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    authService
      .me()
      .then((fresh) => {
        if (!alive) return;
        if (!fresh) return void signOut('expired');
        setUser(fresh);
        setVerified(true);
      })
      .catch(() => {
        if (alive) void signOut('expired');
      });
    return () => {
      alive = false;
    };
  }, [hydrated, setUser, signOut]);

  // API told us the session is gone.
  useEffect(() => {
    const onExpired = () => signOut('expired');
    window.addEventListener('admin:session-expired', onExpired);
    return () => window.removeEventListener('admin:session-expired', onExpired);
  }, [signOut]);

  // Idle timeout — protects unattended shop computers.
  const lastActive = useRef(0);
  useEffect(() => {
    lastActive.current = Date.now();
    const bump = () => (lastActive.current = Date.now());
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const id = setInterval(() => {
      if (Date.now() - lastActive.current > ADMIN.idleTimeoutMinutes * 60_000) signOut('idle');
    }, 30_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(id);
    };
  }, [signOut]);

  const selectedKey = useMemo(() => {
    const match = NAV.filter((n) => (n.key === '/' ? pathname === '/' : pathname.startsWith(n.key))).sort(
      (a, b) => b.key.length - a.key.length,
    )[0];
    return match?.key ?? '/';
  }, [pathname]);

  const menuItems: MenuProps['items'] = useMemo(() => {
    const allowed = NAV.filter((n) => can(user?.role, n.perm));
    const badge = (key: string) =>
      key === '/orders' ? counts.orders : key === '/reviews' ? counts.reviews : key === '/products' ? counts.stock : 0;
    const toItem = (n: NavItem) => ({
      key: n.key,
      icon: n.icon,
      label: (
        <Link href={n.key} onClick={() => setDrawer(false)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {n.label}
          {badge(n.key) > 0 && (
            <Badge count={badge(n.key)} size="small" color={n.key === '/products' ? '#F59E0B' : '#E5243B'} />
          )}
        </Link>
      ),
    });
    const groups = [...new Set(allowed.map((n) => n.group))];
    return groups.flatMap((g): NonNullable<MenuProps['items']> => {
      const items = allowed.filter((n) => n.group === g).map(toItem);
      return g ? [{ type: 'group', key: g, label: g, children: items }] : items;
    });
  }, [user?.role, counts]);

  if (!hydrated || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const allowed = can(user.role, permissionForPath(pathname));
  const totalAlerts = counts.orders + counts.reviews + counts.stock;

  const sider = (
    <>
      <Link href="/" className="shell-logo" onClick={() => setDrawer(false)}>
        <span className="shell-logo__mark">K</span>
        {(!collapsed || isMobile) && (
          <span className="shell-logo__text">
            KhelaBD<small>Admin console</small>
          </span>
        )}
      </Link>
      <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={menuItems} style={{ borderInlineEnd: 0, paddingTop: 8 }} />
    </>
  );

  const userMenu: MenuProps['items'] = [
    {
      key: 'me',
      label: (
        <div style={{ padding: '4px 0' }}>
          <b>{user.name}</b>
          <div className="muted" style={{ fontSize: 12 }}>
            {user.email}
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    { key: 'pw', icon: <KeyOutlined />, label: 'Change password', onClick: () => setPwOpen(true) },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign out',
      danger: true,
      onClick: () => modal.confirm({ title: 'Sign out of the admin console?', okText: 'Sign out', onOk: () => signOut() }),
    },
  ];

  const alertsMenu: MenuProps['items'] = [
    { key: 'o', label: <Link href="/orders?status=pending">{counts.orders} pending orders to confirm</Link>, disabled: !counts.orders },
    { key: 'r', label: <Link href="/reviews?status=pending">{counts.reviews} reviews awaiting moderation</Link>, disabled: !counts.reviews },
    { key: 's', label: <Link href="/products?stock=low">{counts.stock} products low or out of stock</Link>, disabled: !counts.stock },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {isMobile ? (
        <Drawer
          open={drawer}
          onClose={() => setDrawer(false)}
          placement="left"
          size={260}
          closable={false}
          styles={{ body: { padding: 0, background: '#0B1220' } }}
        >
          {sider}
        </Drawer>
      ) : (
        <Sider
          width={248}
          collapsible
          collapsed={collapsed}
          trigger={null}
          style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'auto' }}
        >
          {sider}
        </Sider>
      )}
      <Layout>
        <Header className="shell-header">
          <Button
            type="text"
            aria-label="Toggle navigation"
            icon={isMobile ? <MenuOutlined /> : collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => (isMobile ? setDrawer(true) : setCollapsed((c) => !c))}
          />
          <div style={{ flex: 1 }} />
          <a href={ADMIN.storeUrl} target="_blank" rel="noopener noreferrer">
            <Button type="text" icon={<ExportOutlined />}>
              {!isMobile && 'View store'}
            </Button>
          </a>
          <Dropdown menu={{ items: alertsMenu }} trigger={['click']} placement="bottomRight">
            <Button type="text" aria-label={`${totalAlerts} alerts`} icon={<Badge count={totalAlerts} size="small"><BellOutlined style={{ fontSize: 18 }} /></Badge>} />
          </Dropdown>
          <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="bottomRight">
            <button
              type="button"
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', padding: 4 }}
            >
              <Avatar style={{ background: '#0B1220', color: '#C6F432', fontWeight: 800 }} icon={<UserOutlined />} />
              {!isMobile && (
                <span style={{ textAlign: 'left', lineHeight: 1.25 }}>
                  <b style={{ display: 'block', fontSize: 13.5 }}>{user.name}</b>
                  <Tag color={ROLE_LABEL[user.role].color} style={{ margin: 0, fontSize: 11 }}>
                    {ROLE_LABEL[user.role].label}
                  </Tag>
                </span>
              )}
            </button>
          </Dropdown>
        </Header>
        <Content className="shell-content">
          {allowed ? (
            children
          ) : (
            <Result
              status="403"
              title="No access"
              subTitle={`Your role (${ROLE_LABEL[user.role].label}) can’t open this page. Ask a super admin if you need access.`}
              extra={
                <Link href="/">
                  <Button type="primary">Back to dashboard</Button>
                </Link>
              }
            />
          )}
        </Content>
      </Layout>
      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </Layout>
  );
}
