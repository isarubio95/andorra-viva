import { useCallback, useEffect, useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortState<K extends string = string> {
  key: K;
  direction: SortDirection;
}

export function useTableView<T, K extends string>(
  items: T[],
  comparators: Record<K, (a: T, b: T) => number>,
  initialSort: SortState<K>,
  pageSize = 10,
) {
  const [sort, setSort] = useState<SortState<K>>(initialSort);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const compare = comparators[sort.key];
    const copy = [...items];
    copy.sort((a, b) => {
      const result = compare(a, b);
      return sort.direction === 'asc' ? result : -result;
    });
    return copy;
  }, [items, sort, comparators]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [items]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const rows = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, clampedPage, pageSize]);

  const toggleSort = useCallback((key: K) => {
    setSort(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );
    setPage(1);
  }, []);

  return {
    rows,
    sort,
    toggleSort,
    page: clampedPage,
    setPage,
    totalPages,
    totalItems: items.length,
    pageSize,
  };
}
