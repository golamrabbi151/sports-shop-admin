import type { AdminRole, Permission } from '@/types/admin';

/**
 * Role → permission map. The UI uses this to hide menus, pages and buttons,
 * but the BACKEND must enforce the same rules on every /admin endpoint.
 */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    'dashboard.view',
    'products.view',
    'products.manage',
    'catalog.manage',
    'orders.view',
    'orders.manage',
    'customers.view',
    'customers.manage',
    'coupons.manage',
    'reviews.manage',
    'settings.manage',
    'staff.manage',
  ],
  manager: [
    'dashboard.view',
    'products.view',
    'products.manage',
    'catalog.manage',
    'orders.view',
    'orders.manage',
    'customers.view',
    'customers.manage',
    'coupons.manage',
    'reviews.manage',
  ],
  support: ['dashboard.view', 'products.view', 'orders.view', 'orders.manage', 'customers.view', 'reviews.manage'],
};

export const ROLE_LABEL: Record<AdminRole, { label: string; color: string; description: string }> = {
  super_admin: { label: 'Super admin', color: 'magenta', description: 'Full access, including settings and staff' },
  manager: { label: 'Manager', color: 'blue', description: 'Catalogue, orders, customers, coupons, reviews' },
  support: { label: 'Support', color: 'green', description: 'Process orders, view customers, moderate reviews' },
};

export function can(role: AdminRole | undefined | null, perm: Permission): boolean {
  return Boolean(role && ROLE_PERMISSIONS[role]?.includes(perm));
}

/** Which permission each panel route needs. Longest prefix wins. */
export const ROUTE_PERMISSIONS: [prefix: string, perm: Permission][] = [
  ['/products', 'products.view'],
  ['/categories', 'catalog.manage'],
  ['/brands', 'catalog.manage'],
  ['/orders', 'orders.view'],
  ['/customers', 'customers.view'],
  ['/coupons', 'coupons.manage'],
  ['/reviews', 'reviews.manage'],
  ['/settings', 'settings.manage'],
  ['/staff', 'staff.manage'],
  ['/', 'dashboard.view'],
];

export function permissionForPath(pathname: string): Permission {
  const match = ROUTE_PERMISSIONS.filter(([p]) => (p === '/' ? true : pathname === p || pathname.startsWith(`${p}/`))).sort(
    (a, b) => b[0].length - a[0].length,
  )[0];
  return match?.[1] ?? 'dashboard.view';
}
