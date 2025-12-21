'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useCreateClientProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/clients');
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user profile queries
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

