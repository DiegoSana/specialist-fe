import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import {
  useCreateReview,
  useProfessionalReviews,
  useReviewByRequestId,
} from '../use-reviews';
import { createMockReview } from '../../__mocks__/test-utils';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('use-reviews hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useCreateReview', () => {
    it('should create a review successfully', async () => {
      const mockReview = createMockReview();
      mockApiClient.post.mockResolvedValueOnce({ data: mockReview });

      const { result } = renderHook(() => useCreateReview(), { wrapper: createWrapper() });

      result.current.mutate({
        professionalId: 'prof-123',
        rating: 5,
        comment: 'Great service!',
        requestId: 'request-123',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApiClient.post).toHaveBeenCalledWith('/reviews', {
        professionalId: 'prof-123',
        rating: 5,
        comment: 'Great service!',
        requestId: 'request-123',
      });
    });

    it('should create review without comment', async () => {
      const mockReview = createMockReview({ comment: undefined });
      mockApiClient.post.mockResolvedValueOnce({ data: mockReview });

      const { result } = renderHook(() => useCreateReview(), { wrapper: createWrapper() });

      result.current.mutate({
        professionalId: 'prof-123',
        rating: 4,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApiClient.post).toHaveBeenCalledWith('/reviews', {
        professionalId: 'prof-123',
        rating: 4,
      });
    });

    it('should handle error', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useCreateReview(), { wrapper: createWrapper() });

      result.current.mutate({
        professionalId: 'prof-123',
        rating: 5,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useProfessionalReviews', () => {
    it('should fetch reviews for a professional', async () => {
      const mockReviews = [
        createMockReview({ rating: 5 }),
        createMockReview({ id: 'review-456', rating: 4 }),
      ];
      mockApiClient.get.mockResolvedValueOnce({ data: mockReviews });

      const { result } = renderHook(() => useProfessionalReviews('prof-123'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockReviews);
      expect(mockApiClient.get).toHaveBeenCalledWith('/professionals/prof-123/reviews');
    });

    it('should not fetch when professionalId is empty', async () => {
      const { result } = renderHook(() => useProfessionalReviews(''), { wrapper: createWrapper() });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('should return empty array when no reviews', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: [] });

      const { result } = renderHook(() => useProfessionalReviews('prof-123'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });
  });

  describe('useReviewByRequestId', () => {
    it('should fetch review by request ID', async () => {
      const mockReview = createMockReview();
      mockApiClient.get.mockResolvedValueOnce({ data: mockReview });

      const { result } = renderHook(() => useReviewByRequestId('request-123'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockReview);
      expect(mockApiClient.get).toHaveBeenCalledWith('/reviews?requestId=request-123');
    });

    it('should return null when no review exists (404)', async () => {
      mockApiClient.get.mockRejectedValueOnce({ response: { status: 404 } });

      const { result } = renderHook(() => useReviewByRequestId('request-123'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeNull();
    });

    it('should not fetch when requestId is empty', async () => {
      const { result } = renderHook(() => useReviewByRequestId(''), { wrapper: createWrapper() });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('should not fetch when enabled is false, even with a requestId', async () => {
      const { result } = renderHook(() => useReviewByRequestId('request-123', false), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });
  });
});

