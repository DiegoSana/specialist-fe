'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import {
  Company,
  CreateCompanyDto,
  UpdateCompanyDto,
  SearchCompaniesParams,
} from '@/types';
import { getUser } from '@/lib/auth';

// ==================== QUERIES ====================

/**
 * Get the current user's company profile
 */
export function useMyCompanyProfile() {
  const user = getUser();
  const hasCompanyProfile = user?.hasCompanyProfile || false;

  return useQuery({
    queryKey: ['company', 'me'],
    queryFn: async (): Promise<Company | null> => {
      try {
        const response = await apiClient.get<Company>('/companies/me/profile');
        return response.data;
      } catch (error: any) {
        // If 404, user doesn't have a company profile yet
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: hasCompanyProfile,
    retry: false,
  });
}

/**
 * Get a company by ID (public)
 */
export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: async (): Promise<Company> => {
      const response = await apiClient.get<Company>(`/companies/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Search companies (public)
 */
export function useSearchCompanies(params: SearchCompaniesParams = {}) {
  return useQuery({
    queryKey: ['companies', 'search', params],
    queryFn: async (): Promise<Company[]> => {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.tradeId) queryParams.append('tradeId', params.tradeId);
      if (params.city) queryParams.append('city', params.city);
      if (params.status) queryParams.append('status', params.status);
      if (params.active !== undefined) queryParams.append('active', String(params.active));

      const response = await apiClient.get<Company[]>(`/companies?${queryParams}`);
      return response.data;
    },
  });
}

// ==================== MUTATIONS ====================

/**
 * Create a new company profile
 */
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCompanyDto): Promise<Company> => {
      const response = await apiClient.post<Company>('/companies/me', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

/**
 * Update the current user's company profile
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCompanyDto): Promise<Company> => {
      const response = await apiClient.patch<Company>('/companies/me', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
    },
  });
}

/**
 * Add image to company gallery
 */
export function useAddCompanyGalleryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageUrl: string): Promise<Company> => {
      const response = await apiClient.post<Company>('/companies/me/gallery', { imageUrl });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
    },
  });
}

/**
 * Remove image from company gallery
 */
export function useRemoveCompanyGalleryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageUrl: string): Promise<Company> => {
      const response = await apiClient.delete<Company>('/companies/me/gallery', {
        data: { imageUrl },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
    },
  });
}


