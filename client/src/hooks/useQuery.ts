import { useState, useEffect, useCallback, useRef } from 'react';

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Generic data-fetching hook with:
 * - Automatic trigger on mount and when deps change
 * - Manual refetch capability
 * - Loading & error state management
 */
function useQuery<T>(
  queryFn: () => Promise<T>,
  deps: any[] = []
): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(async () => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      setData(result);
    } catch (err: any) {
      if (err?.name !== 'AbortError' && err?.message !== 'canceled') {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetch();
    return () => {
      abortRef.current?.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export default useQuery;
