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

export function useSearchProviders(params: SearchProvidersParams = {}) {
  return useQuery({
    queryKey: ['providers', 'search', params],
    queryFn: async (): Promise<UnifiedProvider[]> => {
      const response = await apiClient.get<UnifiedProvider[]>('/providers', {
        params,
      });
      return response.data;
    },
  });
}

