'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AdminUser } from '@/types/admin';

/**
 * Only the (non-sensitive) profile is kept client-side for the UI.
 * The session itself is an HttpOnly cookie set by the backend.
 */
interface AuthState {
  user: AdminUser | null;
  setUser: (user: AdminUser | null) => void;
}

export const useAdminAuth = create<AuthState>()(
  persist((set) => ({ user: null, setUser: (user) => set({ user }) }), {
    name: 'kb_admin_user',
    storage: createJSONStorage(() => localStorage),
  }),
);
