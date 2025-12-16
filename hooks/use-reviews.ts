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
      const response = await apiClient.post<Review>('/reputation/reviews', data);
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
      const response = await apiClient.get<Review[]>(`/reputation/professionals/${professionalId}/reviews`);
      return response.data;
    },
    enabled: !!professionalId,
  });
}

export function useReviewByRequestId(requestId: string) {
  return useQuery({
    queryKey: ['review', 'request', requestId],
    queryFn: async (): Promise<Review | null> => {
      try {
        const response = await apiClient.get<Review>(`/reputation/reviews/request/${requestId}`);
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!requestId,
    retry: false, // Don't retry on 404
  });
}

