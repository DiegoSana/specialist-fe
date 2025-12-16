import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

// Generic hook for queries with TanStack Query
export function useApiQuery<TData = unknown, TError = unknown>(
  queryKey: string[],
  url: string,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get<TData>(url);
      return response.data;
    },
    ...options,
  });
}

// Usage example:
// const { data, isLoading, error } = useApiQuery(['users'], '/users');
