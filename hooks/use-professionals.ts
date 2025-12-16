'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Professional, Trade } from '@/types';

export interface SearchProfessionalsParams {
  search?: string;
  tradeId?: string;
}

export function useTrades() {
  return useQuery({
    queryKey: ['trades'],
    queryFn: async (): Promise<Trade[]> => {
      const response = await apiClient.get<Trade[]>('/service/trades');
      return response.data;
    },
  });
}

export function useTradesWithProfessionals() {
  return useQuery({
    queryKey: ['trades', 'with-professionals'],
    queryFn: async (): Promise<Trade[]> => {
      const response = await apiClient.get<Trade[]>('/service/trades/with-professionals');
      return response.data;
    },
  });
}

export function useSearchProfessionals(params: SearchProfessionalsParams = {}) {
  return useQuery({
    queryKey: ['professionals', 'search', params],
    queryFn: async (): Promise<Professional[]> => {
      const response = await apiClient.get<Professional[]>('/service/professionals', {
        params,
      });
      return response.data;
    },
  });
}

export function useProfessional(id: string) {
  return useQuery({
    queryKey: ['professional', id],
    queryFn: async (): Promise<Professional> => {
      const response = await apiClient.get<Professional>(`/service/professionals/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

