import { useState, useCallback } from 'react';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiReturn<T, Args extends any[]> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

/**
 * Custom hook for handling API calls with loading and error states
 *
 * @example
 * const { data, loading, error, execute } = useApi(api.getEmployees);
 *
 * useEffect(() => {
 *   execute();
 * }, []);
 */
export function useApi<T, Args extends any[] = []>(
  apiFunction: (...args: Args) => Promise<T>
): UseApiReturn<T, Args> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });

      try {
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          'An unexpected error occurred';
        setState({ data: null, loading: false, error: errorMessage });
        return null;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
    setData,
  };
}

/**
 * Custom hook for immediate API calls (executes on mount)
 *
 * @example
 * const { data, loading, error, refetch } = useApiCall(api.getEmployees);
 */
export function useApiCall<T>(
  apiFunction: () => Promise<T>,
  dependencies: any[] = []
): UseApiReturn<T, []> & { refetch: () => Promise<T | null> } {
  const apiHook = useApi<T, []>(apiFunction);

  // Execute on mount and when dependencies change
  const refetch = useCallback(() => {
    return apiHook.execute();
  }, [apiHook.execute]);

  // Auto-execute on mount
  useState(() => {
    refetch();
  });

  return {
    ...apiHook,
    refetch,
  };
}

export default useApi;
