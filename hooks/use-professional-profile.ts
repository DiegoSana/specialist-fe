'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Professional } from '@/types';
import { getUser } from '@/lib/auth';

export function useMyProfessionalProfile() {
  const user = getUser();
  const hasProfessionalProfile = user?.hasProfessionalProfile || false;

  return useQuery({
    queryKey: ['professional', 'me'],
    queryFn: async (): Promise<Professional | null> => {
      try {
        const response = await apiClient.get<Professional>('/professionals/me/profile');
        return response.data;
      } catch (error: any) {
        // If 404, user doesn't have a professional profile yet - that's ok
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: hasProfessionalProfile, // Only fetch if user has professional profile
    retry: false, // Don't retry on 404
  });
}

