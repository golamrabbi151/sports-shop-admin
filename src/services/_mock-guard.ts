import { can } from '@/config/permissions';
import { ApiError } from '@/lib/api/errors';
import { useAdminAuth } from '@/store/auth';
import type { Permission } from '@/types/admin';

/** Demo-mode stand-in for the backend's authorisation check. */
export function requirePerm(perm: Permission) {
  const user = useAdminAuth.getState().user;
  if (!user) throw new ApiError('Your session has expired. Please sign in again.', 401);
  if (!can(user.role, perm)) throw new ApiError('You don’t have permission to do that.', 403);
}

export const actorName = () => useAdminAuth.getState().user?.name ?? 'System';

export function notFound(what: string): never {
  throw new ApiError(`${what} not found`, 404);
}
