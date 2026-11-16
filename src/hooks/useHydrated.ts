'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** false during SSR + hydration, true afterwards. Avoids mismatches for persisted stores. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
