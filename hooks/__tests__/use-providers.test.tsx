import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useProviderById } from '../use-providers';

jest.mock('@/lib/api-client', () => {
  const client = { get: jest.fn() };
  return { __esModule: true, apiClient: client, default: client };
});

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
};

describe('useProviderById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches GET /professionals/:id and maps it into UnifiedProvider shape when type is PROFESSIONAL', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      data: {
        id: 'prof-1',
        serviceProviderId: 'sp-1',
        description: 'Electricista',
        experienceYears: 5,
        status: 'VERIFIED',
        zone: 'Centro',
        city: 'Bariloche',
        averageRating: 4.5,
        totalReviews: 10,
        profileImage: null,
        trades: [{ id: 't1', name: 'Electricidad', isPrimary: true }],
        user: { firstName: 'Juan', lastName: 'Pérez', profilePictureUrl: null },
      },
    });

    const { result } = renderHook(() => useProviderById('prof-1', 'PROFESSIONAL'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/professionals/prof-1');
    expect(result.current.data).toEqual({
      id: 'prof-1',
      serviceProviderId: 'sp-1',
      type: 'PROFESSIONAL',
      displayName: 'Juan Pérez',
      description: 'Electricista',
      city: 'Bariloche',
      zone: 'Centro',
      averageRating: 4.5,
      totalReviews: 10,
      profileImage: null,
      trades: [{ id: 't1', name: 'Electricidad', isPrimary: true }],
      hasVerifiedBadge: true,
      experienceYears: 5,
      user: { firstName: 'Juan', lastName: 'Pérez', profilePictureUrl: undefined },
    });
  });

  it('fetches GET /companies/:id and maps it into UnifiedProvider shape when type is COMPANY', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      data: {
        id: 'comp-1',
        serviceProviderId: 'sp-2',
        companyName: 'Plomeros SA',
        description: 'Plomería',
        employeeCount: '6-20',
        status: 'ACTIVE',
        zone: null,
        city: 'Bariloche',
        averageRating: 4.0,
        totalReviews: 3,
        profileImage: null,
        trades: [],
      },
    });

    const { result } = renderHook(() => useProviderById('comp-1', 'COMPANY'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClient.get).toHaveBeenCalledWith('/companies/comp-1');
    expect(result.current.data).toMatchObject({
      id: 'comp-1',
      serviceProviderId: 'sp-2',
      type: 'COMPANY',
      displayName: 'Plomeros SA',
      companyName: 'Plomeros SA',
      hasVerifiedBadge: false,
    });
  });

  it('stays disabled (no request) when id or type is null', () => {
    renderHook(() => useProviderById(null, null), { wrapper: createWrapper() });
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });
});
