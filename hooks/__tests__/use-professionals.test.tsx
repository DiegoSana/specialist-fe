import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import {
  useTrades,
  useTradesWithProfessionals,
  useSearchProfessionals,
  useProfessional,
} from '../use-professionals';
import { createMockProfessional, createMockTrade } from '../../__mocks__/test-utils';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('use-professionals hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useTrades', () => {
    it('should fetch all trades successfully', async () => {
      const mockTrades = [
        createMockTrade({ id: 'trade-1', name: 'Electricista' }),
        createMockTrade({ id: 'trade-2', name: 'Plomero' }),
      ];
      mockApiClient.get.mockResolvedValueOnce({ data: mockTrades });

      const { result } = renderHook(() => useTrades(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTrades);
      expect(mockApiClient.get).toHaveBeenCalledWith('/trades');
    });

    it('should handle error', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useTrades(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useTradesWithProfessionals', () => {
    it('should fetch trades with professionals successfully', async () => {
      const mockTrades = [createMockTrade()];
      mockApiClient.get.mockResolvedValueOnce({ data: mockTrades });

      const { result } = renderHook(() => useTradesWithProfessionals(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTrades);
      expect(mockApiClient.get).toHaveBeenCalledWith('/trades/with-professionals');
    });
  });

  describe('useSearchProfessionals', () => {
    it('should search professionals without filters', async () => {
      const mockProfessionals = [createMockProfessional()];
      mockApiClient.get.mockResolvedValueOnce({ data: mockProfessionals });

      const { result } = renderHook(() => useSearchProfessionals(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockProfessionals);
      expect(mockApiClient.get).toHaveBeenCalledWith('/professionals', { params: {} });
    });

    it('should search professionals with search term', async () => {
      const mockProfessionals = [createMockProfessional()];
      mockApiClient.get.mockResolvedValueOnce({ data: mockProfessionals });

      const { result } = renderHook(
        () => useSearchProfessionals({ search: 'electricista' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApiClient.get).toHaveBeenCalledWith('/professionals', { params: { search: 'electricista' } });
    });

    it('should search professionals by tradeId', async () => {
      const mockProfessionals = [createMockProfessional()];
      mockApiClient.get.mockResolvedValueOnce({ data: mockProfessionals });

      const { result } = renderHook(
        () => useSearchProfessionals({ tradeId: 'trade-123' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApiClient.get).toHaveBeenCalledWith('/professionals', { params: { tradeId: 'trade-123' } });
    });

    it('should search with multiple filters', async () => {
      const mockProfessionals = [createMockProfessional()];
      mockApiClient.get.mockResolvedValueOnce({ data: mockProfessionals });

      const { result } = renderHook(
        () => useSearchProfessionals({ search: 'juan', tradeId: 'trade-123' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApiClient.get).toHaveBeenCalledWith('/professionals', {
        params: { search: 'juan', tradeId: 'trade-123' },
      });
    });
  });

  describe('useProfessional', () => {
    it('should fetch a single professional by ID', async () => {
      const mockProfessional = createMockProfessional();
      mockApiClient.get.mockResolvedValueOnce({ data: mockProfessional });

      const { result } = renderHook(() => useProfessional('prof-123'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockProfessional);
      expect(mockApiClient.get).toHaveBeenCalledWith('/professionals/prof-123');
    });

    it('should not fetch when ID is empty', async () => {
      const { result } = renderHook(() => useProfessional(''), { wrapper: createWrapper() });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('should handle 404 error', async () => {
      mockApiClient.get.mockRejectedValueOnce({ response: { status: 404 } });

      const { result } = renderHook(() => useProfessional('non-existent'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});

