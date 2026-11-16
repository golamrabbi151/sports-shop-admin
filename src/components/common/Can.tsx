'use client';

import type { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';
import type { Permission } from '@/types/admin';

/** Render children only if the signed-in staff member has `perm`. UI-only — the API enforces it. */
export function Can({ perm, children, fallback = null }: { perm: Permission; children: ReactNode; fallback?: ReactNode }) {
  return usePermission(perm) ? <>{children}</> : <>{fallback}</>;
}
