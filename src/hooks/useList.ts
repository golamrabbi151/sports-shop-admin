'use client';

import { App } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/lib/api/errors';
import type { Paginated } from '@/types';
import type { ListQuery } from '@/types/admin';

/**
 * Server-side paginated list state for antd Tables.
 * Ignores out-of-order responses and debounces free-text search.
 */
export function useList<T, Q extends ListQuery>(fetcher: (q: Q) => Promise<Paginated<T>>, initial: Q) {
  const { message } = App.useApp();
  const [query, setQuery] = useState<Q>({ page: 1, pageSize: 10, ...initial });
  const [data, setData] = useState<Paginated<T>>({ items: [], total: 0, page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initial.q ?? '');
  const reqId = useRef(0);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const res = await fetcherRef.current(query);
      if (id === reqId.current) setData(res);
    } catch (e) {
      if (id === reqId.current) message.error(getErrorMessage(e));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [query, message]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching
    void load();
  }, [load]);

  // Debounced search → query.q
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery((q) => ((q.q ?? '') === search.trim() ? q : { ...q, q: search.trim() || undefined, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const update = useCallback((patch: Partial<Q>) => setQuery((q) => ({ ...q, page: 1, ...patch })), []);

  return {
    query,
    update,
    data,
    loading,
    reload: load,
    search,
    setSearch,
    pagination: {
      current: data.page,
      pageSize: data.pageSize,
      total: data.total,
      showSizeChanger: true,
      pageSizeOptions: [10, 20, 50],
      showTotal: (t: number, r: [number, number]) => `${r[0]}–${r[1]} of ${t}`,
      onChange: (page: number, pageSize: number) => setQuery((q) => ({ ...q, page, pageSize })),
    },
  };
}
