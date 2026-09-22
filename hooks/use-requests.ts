'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import {
  Request,
  CreateRequestDto,
  UpdateRequestDto,
  RequestInterest,
  InterestedRequest,
  ExpressInterestDto,
  RequestStatus,
} from '@/types';

export function useClientRequests() {
  return useQuery({
    queryKey: ['requests', 'client'],
    queryFn: async (): Promise<Request[]> => {
      const response = await apiClient.get<Request[]>('/requests?role=client');
      return response.data;
    },
  });
}

export function useProfessionalRequests() {
  return useQuery({
    queryKey: ['requests', 'professional'],
    queryFn: async (): Promise<Request[]> => {
      const response = await apiClient.get<Request[]>('/requests?role=professional');
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

// ---------------------------------------------------------------------------
// State-machine transitions. Every one is PATCH /requests/:id with the target status; the backend
// (RequestEntity.canChangeStatusBy) is the authority on who may make each move, so the UI just
// offers the action the status metadata says is primary for the viewer.
// ---------------------------------------------------------------------------

function useRequestTransition(
  toStatus: RequestStatus,
  extra?: (arg: { reason?: string }) => Partial<UpdateRequestDto>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string;
      reason?: string;
    }): Promise<Request> => {
      const response = await apiClient.patch<Request>(`/requests/${id}`, {
        status: toStatus,
        ...(extra ? extra({ reason }) : {}),
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', variables.id] });
    },
  });
}

const withReason = ({ reason }: { reason?: string }): Partial<UpdateRequestDto> =>
  reason ? { statusReason: reason.slice(0, 500) } : {};

/** Specialist accepts a direct request: SENT -> CONTACT_RELEASED. */
export const useAcceptRequest = () =>
  useRequestTransition(RequestStatus.CONTACT_RELEASED);

/** Specialist rejects a direct request: SENT -> REJECTED. */
export const useRejectRequest = () =>
  useRequestTransition(RequestStatus.REJECTED);

/** Either party confirms an agreement was reached: CONTACT_RELEASED -> IN_PROGRESS. */
export const useStartRequest = () =>
  useRequestTransition(RequestStatus.IN_PROGRESS);

/** Specialist marks the work done: IN_PROGRESS -> FINISHED. */
export const useMarkRequestFinished = () =>
  useRequestTransition(RequestStatus.FINISHED);

/** Client confirms the work: FINISHED -> CLOSED (enables ratings). */
export const useConfirmRequest = () =>
  useRequestTransition(RequestStatus.CLOSED);

/** Client objects to the work: FINISHED -> UNDER_REVIEW (handled by support). */
export const useObjectRequest = () =>
  useRequestTransition(RequestStatus.UNDER_REVIEW, withReason);

/** Client cancels before contact is released: PUBLISHED | SENT -> CANCELLED. */
export const useCancelRequest = () =>
  useRequestTransition(RequestStatus.CANCELLED);

/** Either party: CONTACT_RELEASED -> NOT_COMPLETED, with an optional reason (max 500 chars). */
export const useReportNotCompleted = () =>
  useRequestTransition(RequestStatus.NOT_COMPLETED, withReason);

/** Specialist: IN_PROGRESS -> INTERRUPTED, with an optional reason (max 500 chars). */
export const useReportInterrupted = () =>
  useRequestTransition(RequestStatus.INTERRUPTED, withReason);

/**
 * "Volver a publicar": creates a NEW request copying the original's data (the original stays as
 * history). There is no backend republish endpoint, so this is a plain POST /requests. A public
 * request needs tradeId; a direct one needs the provider id — the caller passes the target
 * (`providerTarget`) since Request only carries the ServiceProvider id, not the profile id.
 */
export function useRepublishRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      original,
      isPublic,
      providerTarget,
    }: {
      original: Request;
      isPublic: boolean;
      providerTarget?: { professionalId?: string; companyId?: string };
    }): Promise<Request> => {
      const dto: CreateRequestDto = {
        title: original.title,
        description: original.description,
        address: original.address,
        availability: original.availability,
        photos: original.photos,
        isPublic,
        ...(isPublic ? { tradeId: original.tradeId } : providerTarget ?? {}),
      };
      const response = await apiClient.post<Request>('/requests', dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

/** Public requests where the current specialist showed interest, with their own interest status. */
export function useMyInterestedRequests() {
  return useQuery({
    queryKey: ['requests', 'interested'],
    queryFn: async (): Promise<InterestedRequest[]> => {
      const response = await apiClient.get<InterestedRequest[]>('/requests/interested');
      return response.data;
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
      serviceProviderId,
    }: {
      requestId: string;
      professionalId?: string; // Deprecated, use serviceProviderId
      serviceProviderId?: string;
    }): Promise<Request> => {
      // Use new endpoint with serviceProviderId if available, otherwise fallback to deprecated endpoint
      const providerId = serviceProviderId || professionalId;
      if (!providerId) {
        throw new Error('Either serviceProviderId or professionalId must be provided');
      }
      
      const response = await apiClient.post<Request>(
        `/requests/${requestId}/assign-provider`,
        { serviceProviderId: providerId }
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

export function useUnassignProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string): Promise<Request> => {
      const response = await apiClient.post<Request>(
        `/requests/${requestId}/unassign-provider`
      );
      return response.data;
    },
    onSuccess: (_, requestId) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['request-interests', requestId] });
    },
  });
}

export function useRateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      rating,
      comment,
    }: {
      requestId: string;
      rating: number;
      comment?: string;
    }): Promise<Request> => {
      const response = await apiClient.post<Request>(
        `/requests/${requestId}/rate-client`,
        { rating, comment }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', variables.requestId] });
    },
  });
}

