'use client';

import { can } from '@/config/permissions';
import { useAdminAuth } from '@/store/auth';
import type { Permission } from '@/types/admin';

export function usePermission(perm: Permission): boolean {
  const role = useAdminAuth((s) => s.user?.role);
  return can(role, perm);
}
