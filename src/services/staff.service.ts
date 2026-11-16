import { ENDPOINTS } from '@/config/api';
import { http } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { withMock } from '@/lib/api/mock';
import { db, newId } from '@/mocks/db';
import { useAdminAuth } from '@/store/auth';
import type { AdminUser, StaffInput } from '@/types/admin';
import { requirePerm } from './_mock-guard';

const strip = ({ password: _p, ...u }: AdminUser & { password?: string }): AdminUser => (void _p, u);
const superAdmins = () => db.read().staff.filter((s) => s.role === 'super_admin' && s.active);

export const staffService = {
  list: () =>
    withMock<AdminUser[]>(
      () => {
        requirePerm('staff.manage');
        return db.read().staff.map(strip);
      },
      () => http.get(ENDPOINTS.staff.list),
    ),
  create: (input: StaffInput) =>
    withMock<AdminUser>(
      () => {
        requirePerm('staff.manage');
        if (db.read().staff.some((s) => s.email.toLowerCase() === input.email.toLowerCase()))
          throw new ApiError('Email already used', 422, 'conflict', { email: 'A staff member with this email exists' });
        const user = { ...input, password: input.password!, id: newId('adm'), createdAt: new Date().toISOString() };
        db.write((d) => d.staff.push(user));
        return strip(user);
      },
      () => http.post(ENDPOINTS.staff.list, input),
    ),
  update: (id: string, input: StaffInput) =>
    withMock<AdminUser>(
      () => {
        requirePerm('staff.manage');
        const me = useAdminAuth.getState().user;
        const target = db.read().staff.find((s) => s.id === id)!;
        // Never leave the store without an active super admin.
        if (target.role === 'super_admin' && (input.role !== 'super_admin' || !input.active) && superAdmins().length <= 1)
          throw new ApiError('At least one active super admin is required.', 409);
        if (me?.id === id && !input.active) throw new ApiError('You can’t deactivate your own account.', 409);
        return db.write((d) => {
          const s = d.staff.find((x) => x.id === id)!;
          const { password, ...rest } = input;
          Object.assign(s, rest, password ? { password } : {});
          return strip(s);
        });
      },
      () => http.put(ENDPOINTS.staff.detail(id), input),
    ),
  remove: (id: string) =>
    withMock(
      () => {
        requirePerm('staff.manage');
        if (useAdminAuth.getState().user?.id === id) throw new ApiError('You can’t delete your own account.', 409);
        const t = db.read().staff.find((s) => s.id === id);
        if (t?.role === 'super_admin' && superAdmins().length <= 1)
          throw new ApiError('At least one active super admin is required.', 409);
        db.write((d) => (d.staff = d.staff.filter((s) => s.id !== id)));
        return { ok: true };
      },
      () => http.delete<{ ok: boolean }>(ENDPOINTS.staff.detail(id)),
    ),
};
