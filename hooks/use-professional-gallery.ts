'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useAddGalleryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: string) => {
      const response = await apiClient.post('/service/professionals/me/profile/gallery', { url });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    },
  });
}

export function useRemoveGalleryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: string) => {
      const response = await apiClient.delete('/service/professionals/me/profile/gallery', { data: { url } });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    },
  });
}

