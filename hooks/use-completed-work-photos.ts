'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useAddRequestPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, url }: { requestId: string; url: string }) => {
      const response = await apiClient.post(`/requests/${requestId}/photos`, { url });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch the specific request
      queryClient.invalidateQueries({ queryKey: ['request', variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      
      // Optionally update the cache directly with the new data
      queryClient.setQueryData(['request', variables.requestId], (old: any) => {
        if (!old) return old;
        const currentPhotos = old.photos || [];
        if (!currentPhotos.includes(variables.url)) {
          return {
            ...old,
            photos: [...currentPhotos, variables.url],
          };
        }
        return old;
      });
    },
  });
}

export function useRemoveRequestPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, url }: { requestId: string; url: string }) => {
      const response = await apiClient.delete(`/requests/${requestId}/photos`, { data: { url } });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['request', variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    },
  });
}

// Legacy exports for backward compatibility
export const useAddCompletedWorkPhoto = useAddRequestPhoto;
export const useRemoveCompletedWorkPhoto = useRemoveRequestPhoto;

