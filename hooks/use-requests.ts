'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Request, CreateRequestDto, UpdateRequestDto, RequestInterest, ExpressInterestDto } from '@/types';

export function useClientRequests() {
  return useQuery({
    queryKey: ['requests', 'client'],
    queryFn: async (): Promise<Request[]> => {
      const response = await apiClient.get<Request[]>('/requests');
      return response.data;
    },
  });
}

export function useProfessionalRequests() {
  return useQuery({
    queryKey: ['requests', 'professional'],
    queryFn: async (): Promise<Request[]> => {
      const response = await apiClient.get<Request[]>('/requests');
      return response.data;
    },
  });
}

export function useAvailableRequests(city?: string, zone?: string) {
  return useQuery({
    queryKey: ['requests', 'available', city, zone],
    queryFn: async (): Promise<Request[]> => {
      const params = new URLSearchParams();
      if (city) params.append('city', city);
      if (zone) params.append('zone', zone);
      const response = await apiClient.get<Request[]>(
        `/requests/available?${params.toString()}`
      );
      return response.data;
    },
    enabled: true,
  });
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: ['request', id],
    queryFn: async (): Promise<Request> => {
      const response = await apiClient.get<Request>(`/requests/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRequestDto): Promise<Request> => {
      const response = await apiClient.post<Request>('/requests', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

export function useUpdateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRequestDto;
    }): Promise<Request> => {
      const response = await apiClient.patch<Request>(
        `/requests/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', variables.id] });
    },
  });
}

export function useAcceptQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<Request> => {
      const response = await apiClient.post<Request>(`/requests/${id}/accept`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', id] });
    },
  });
}

export function useUpdateRequestByClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRequestDto;
    }): Promise<Request> => {
      const response = await apiClient.patch<Request>(
        `/requests/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', variables.id] });
    },
  });
}

// Request Interest hooks (for public requests)
export function useRequestInterests(requestId: string) {
  return useQuery({
    queryKey: ['request-interests', requestId],
    queryFn: async (): Promise<RequestInterest[]> => {
      const response = await apiClient.get<RequestInterest[]>(
        `/requests/${requestId}/interests`
      );
      return response.data;
    },
    enabled: !!requestId,
  });
}

export function useMyInterest(requestId: string) {
  return useQuery({
    queryKey: ['my-interest', requestId],
    queryFn: async (): Promise<{ hasInterest: boolean }> => {
      const response = await apiClient.get<{ hasInterest: boolean }>(
        `/requests/${requestId}/interest`
      );
      return response.data;
    },
    enabled: !!requestId,
  });
}

export function useExpressInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      data,
    }: {
      requestId: string;
      data?: ExpressInterestDto;
    }): Promise<RequestInterest> => {
      const response = await apiClient.post<RequestInterest>(
        `/requests/${requestId}/interest`,
        data || {}
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-interest', variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ['requests', 'available'] });
    },
  });
}

export function useRemoveInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string): Promise<void> => {
      await apiClient.delete(`/requests/${requestId}/interest`);
    },
    onSuccess: (_, requestId) => {
      queryClient.invalidateQueries({ queryKey: ['my-interest', requestId] });
      queryClient.invalidateQueries({ queryKey: ['requests', 'available'] });
    },
  });
}

export function useAssignProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      professionalId,
    }: {
      requestId: string;
      professionalId: string;
    }): Promise<Request> => {
      const response = await apiClient.post<Request>(
        `/requests/${requestId}/assign`,
        { professionalId }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ['request-interests', variables.requestId] });
    },
  });
}

