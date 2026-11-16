import { API_CONFIG } from '@/config/api';

/**
 * Run `mock` while NEXT_PUBLIC_USE_MOCK_API !== 'false', otherwise `real`.
 * Switching to the live backend is a single env change.
 */
export async function withMock<T>(mock: () => T | Promise<T>, real: () => Promise<T>): Promise<T> {
  if (!API_CONFIG.useMock) return real();
  await new Promise((r) => setTimeout(r, API_CONFIG.mockLatency));
  return structuredClone(await mock());
}
