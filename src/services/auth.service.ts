import { ENDPOINTS } from '@/config/api';
import { http } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { withMock } from '@/lib/api/mock';
import { tokenStore } from '@/lib/api/token-store';
import { db } from '@/mocks/db';
import type { AdminUser } from '@/types/admin';
import { actorName } from './_mock-guard';

const MOCK_COOKIE = 'kb_admin_session';
const setMockCookie = () => (document.cookie = `${MOCK_COOKIE}=demo; path=/; max-age=${60 * 60 * 8}; samesite=strict`);
const clearMockCookie = () => (document.cookie = `${MOCK_COOKIE}=; path=/; max-age=0; samesite=strict`);

const strip = <T extends { password?: string }>({ password: _p, ...rest }: T) => (void _p, rest);

export const authService = {
  login: async (email: string, password: string): Promise<AdminUser> => {
    const res = await withMock<{ user: AdminUser; accessToken?: string }>(
      () => {
        const staff = db.read().staff.find((s) => s.email.toLowerCase() === email.toLowerCase());
        // Same error for unknown email and wrong password (no account enumeration).
        if (!staff || staff.password !== password) throw new ApiError('Invalid email or password', 401);
        if (!staff.active) throw new ApiError('This account has been disabled. Contact the store owner.', 403);
        db.write((d) => {
          const s = d.staff.find((x) => x.id === staff.id)!;
          s.lastLoginAt = new Date().toISOString();
        });
        setMockCookie();
        return { user: strip(staff) };
      },
      () => http.post(ENDPOINTS.auth.login, { email, password }),
    );
    if (res.accessToken) tokenStore.set(res.accessToken);
    return res.user;
  },

  logout: async () => {
    try {
      await withMock(
        () => {
          clearMockCookie();
          return null;
        },
        () => http.post(ENDPOINTS.auth.logout),
      );
    } finally {
      tokenStore.clear();
    }
  },

  /** Validates the session with the server and returns the fresh profile/role. */
  me: () =>
    withMock<AdminUser | null>(
      () => {
        if (!document.cookie.includes(`${MOCK_COOKIE}=`)) return null;
        const name = actorName();
        const s = db.read().staff.find((x) => x.name === name);
        return s && s.active ? strip(s) : null;
      },
      () => http.get<AdminUser>(ENDPOINTS.auth.me),
    ),

  changePassword: (userId: string, currentPassword: string, newPassword: string) =>
    withMock(
      () =>
        db.write((d) => {
          const s = d.staff.find((x) => x.id === userId);
          if (!s || s.password !== currentPassword) throw new ApiError('Current password is incorrect', 422);
          s.password = newPassword;
          return { ok: true };
        }),
      () => http.put<{ ok: boolean }>(ENDPOINTS.auth.password, { currentPassword, newPassword }),
    ),
};
