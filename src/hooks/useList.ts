import { useCallback, useEffect, useRef, useState } from "react";
import type { Paginated } from "@/types/common";

type Fetcher<T, F> = (
  filters: F,
  page: number,
  pageSize: number,
) => Promise<Paginated<T>>;

/**
 * Serialize filters to a stable string so we can use it as a dependency
 * without triggering effects on object identity alone.
 */
function filterKey<F extends Record<string, unknown>>(f: F): string {
  return Object.keys(f)
    .sort()
    .map((k) => `${k}=${String(f[k])}`)
    .join("|");
}

export function useList<T, F extends Record<string, unknown>>({
  fetcher,
  initialFilters,
  pageSize = 10,
  debounceMs = 250,
}: {
  fetcher: Fetcher<T, F>;
  initialFilters: F;
  pageSize?: number;
  debounceMs?: number;
}) {
  const [filters, setFiltersState] = useState<F>(initialFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounced filter KEY (a string) — this is what effects depend on
  const [debouncedKey, setDebouncedKey] = useState<string>(() =>
    filterKey(initialFilters),
  );

  // Refs hold the latest values so effects don't need them as deps
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const reqId = useRef(0);

  // Compute the live key on every render — it's just a string
  const liveKey = filterKey(filters);

  // Debounce the key
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKey(liveKey), debounceMs);
    return () => clearTimeout(t);
  }, [liveKey, debounceMs]);

  // Reset to page 1 when the debounced key actually changes (skip initial)
  const lastKeyRef = useRef(debouncedKey);
  useEffect(() => {
    if (lastKeyRef.current === debouncedKey) return;
    lastKeyRef.current = debouncedKey;
    setPage(1);
  }, [debouncedKey]);

  // Fetch — every dep is a primitive, so this can't loop
  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);

    fetcherRef
      .current(filtersRef.current, page, pageSize)
      .then((res) => {
        if (id !== reqId.current) return;
        setData(res.data);
        setTotal(res.total);
      })
      .catch((e) => {
        if (id !== reqId.current) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [debouncedKey, page, pageSize]);

  const setFilters = useCallback((patch: Partial<F>) => {
    setFiltersState((prev) => {
      // Only update if something actually changed
      const changed = (Object.keys(patch) as (keyof F)[]).some(
        (k) => prev[k] !== patch[k],
      );
      return changed ? { ...prev, ...patch } : prev;
    });
  }, []);

  const reload = useCallback(() => {
    setDebouncedKey((k) => k);
    setPage((p) => p);
    // Force a refetch by re-running the effect via a state nudge
    setData((d) => d);
  }, []);

  return {
    data,
    total,
    page,
    pageSize,
    loading,
    error,
    filters,
    setFilters,
    setPage,
    reload,
  };
}
