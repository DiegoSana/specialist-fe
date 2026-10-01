import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface SearchProvidersParams {
  search?: string;
  tradeId?: string;
  city?: string;
  zone?: string;
  providerType?: 'PROFESSIONAL' | 'COMPANY' | 'ALL';
}

export interface UnifiedProvider {
  id: string;
  serviceProviderId: string;
  type: 'PROFESSIONAL' | 'COMPANY';
  displayName: string;
  description: string | null;
  city: string;
  zone: string | null;
  averageRating: number;
  totalReviews: number;
  profileImage: string | null;
  trades: Array<{
    id: string;
    name: string;
    isPrimary: boolean;
  }>;
  hasVerifiedBadge: boolean;
  // Company-specific fields
  companyName?: string;
  employeeCount?: string;
  // Professional-specific fields
  experienceYears?: number;
  user?: {
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
}

export function useSearchProviders(params: SearchProvidersParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['providers', 'search', params],
    queryFn: async (): Promise<UnifiedProvider[]> => {
      const response = await apiClient.get<UnifiedProvider[]>('/providers', {
        params,
      });
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });
}

interface ProfessionalByIdResponse {
  id: string;
  serviceProviderId: string;
  description: string | null;
  experienceYears: number | null;
  status: string;
  zone: string | null;
  city: string;
  averageRating: number;
  totalReviews: number;
  profileImage: string | null;
  trades: Array<{ id: string; name: string; isPrimary: boolean }>;
  user?: { firstName: string; lastName: string; profilePictureUrl?: string | null };
}

interface CompanyByIdResponse {
  id: string;
  serviceProviderId: string;
  companyName: string;
  description: string | null;
  employeeCount: string | null;
  status: string;
  zone: string | null;
  city: string;
  averageRating: number;
  totalReviews: number;
  profileImage: string | null;
  trades: Array<{ id: string; name: string; isPrimary: boolean }>;
}

/**
 * Fetch a single provider by its OWN id (Professional/Company id, not serviceProviderId) via
 * `GET /professionals/:id` or `GET /companies/:id`. Unlike `useSearchProviders`, these endpoints
 * don't filter by isVisible/canOperate/userVerified — use this whenever the viewer already has a
 * legitimate reason to see this specific provider (e.g. they expressed interest on a request)
 * regardless of whether the provider currently shows up in the public catalog.
 */
export function useProviderById(
  id: string | null,
  type: 'PROFESSIONAL' | 'COMPANY' | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['providers', 'byId', type, id],
    queryFn: async (): Promise<UnifiedProvider> => {
      if (type === 'COMPANY') {
        const response = await apiClient.get<CompanyByIdResponse>(`/companies/${id}`);
        const c = response.data;
        return {
          id: c.id,
          serviceProviderId: c.serviceProviderId,
          type: 'COMPANY',
          displayName: c.companyName,
          description: c.description,
          city: c.city,
          zone: c.zone,
          averageRating: c.averageRating,
          totalReviews: c.totalReviews,
          profileImage: c.profileImage,
          trades: c.trades,
          hasVerifiedBadge: c.status === 'VERIFIED',
          companyName: c.companyName,
          employeeCount: c.employeeCount ?? undefined,
        };
      }
      const response = await apiClient.get<ProfessionalByIdResponse>(`/professionals/${id}`);
      const p = response.data;
      return {
        id: p.id,
        serviceProviderId: p.serviceProviderId,
        type: 'PROFESSIONAL',
        displayName: p.user ? `${p.user.firstName} ${p.user.lastName}` : 'Profesional',
        description: p.description,
        city: p.city,
        zone: p.zone,
        averageRating: p.averageRating,
        totalReviews: p.totalReviews,
        profileImage: p.profileImage,
        trades: p.trades,
        hasVerifiedBadge: p.status === 'VERIFIED',
        experienceYears: p.experienceYears ?? undefined,
        user: p.user
          ? {
              firstName: p.user.firstName,
              lastName: p.user.lastName,
              profilePictureUrl: p.user.profilePictureUrl ?? undefined,
            }
          : undefined,
      };
    },
    enabled: (options?.enabled ?? true) && !!id && !!type,
  });
}

