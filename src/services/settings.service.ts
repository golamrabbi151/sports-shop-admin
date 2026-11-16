import { ENDPOINTS } from '@/config/api';
import { http } from '@/lib/api/client';
import { withMock } from '@/lib/api/mock';
import { db } from '@/mocks/db';
import type { StoreSettings } from '@/types/admin';
import { requirePerm } from './_mock-guard';

export const settingsService = {
  get: () => withMock<StoreSettings>(() => db.read().settings, () => http.get(ENDPOINTS.settings)),
  update: (settings: StoreSettings) =>
    withMock<StoreSettings>(
      () => {
        requirePerm('settings.manage');
        return db.write((d) => (d.settings = settings));
      },
      () => http.put(ENDPOINTS.settings, settings),
    ),
  /** Demo only: restore the seeded sample data. */
  resetDemoData: async () => {
    requirePerm('settings.manage');
    db.reset();
  },
};
