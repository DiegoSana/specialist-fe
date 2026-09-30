'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface CreateReviewDto {
  professionalId: string;
  rating: number;
  comment?: string;
  requestId?: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  professionalId: string;
  requestId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReviewDto): Promise<Review> => {
      const response = await apiClient.post<Review>('/reviews', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['professional'] });
      queryClient.invalidateQueries({ queryKey: ['request'] });
      if (data.requestId) {
        queryClient.invalidateQueries({ queryKey: ['review', 'request', data.requestId] });
      }
    },
  });
}

export function useProfessionalReviews(professionalId: string) {
  return useQuery({
    queryKey: ['reviews', 'professional', professionalId],
    queryFn: async (): Promise<Review[]> => {
      const response = await apiClient.get<Review[]>(`/professionals/${professionalId}/reviews`);
      return response.data;
    },
    enabled: !!professionalId,
  });
}

/**
 * CLIENT_TO_PROVIDER: client's review of the provider. PROVIDER_TO_CLIENT: provider's review of
 * the client. Mirrors specialist-be `ReviewDirection` (prisma enum).
 */
export type ReviewDirection = 'CLIENT_TO_PROVIDER' | 'PROVIDER_TO_CLIENT';

/**
 * Fetches the viewer's own review for a request by direction (`GET /reviews?requestId=&direction=`,
 * defaults to CLIENT_TO_PROVIDER on the backend for compat). Used where a component needs "did I
 * already review this?" outside a request-detail response (which carries `myReview` directly) —
 * e.g. list/card contexts where `Request.myReview` isn't populated.
 */
export function useReviewByRequestId(
  requestId: string,
  enabled = true,
  direction?: ReviewDirection,
) {
  return useQuery({
    queryKey: ['review', 'request', requestId, direction ?? 'CLIENT_TO_PROVIDER'],
    queryFn: async (): Promise<Review | null> => {
      const params = direction ? `requestId=${requestId}&direction=${direction}` : `requestId=${requestId}`;
      const response = await apiClient.get<Review | null>(`/reviews?${params}`);
      return response.data ?? null;
    },
    enabled: enabled && !!requestId,
    retry: false,
  });
}

