import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import {
  useClientRequests,
  useProfessionalRequests,
  useAvailableRequests,
  useRequest,
  useCreateRequest,
  useUpdateRequest,
  useAcceptQuote,
  useRequestInterests,
  useMyInterest,
  useExpressInterest,
  useRemoveInterest,
  useAssignProfessional,
} from '../use-requests';
import { createMockRequest } from '../../__mocks__/test-utils';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
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

describe('use-requests hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useClientRequests', () => {
    it('should fetch client requests successfully', async () => {
      const mockRequests = [createMockRequest(), createMockRequest({ id: 'request-456' })];
      mockApiClient.get.mockResolvedValueOnce({ data: mockRequests });

      const { result } = renderHook(() => useClientRequests(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockRequests);
      expect(mockApiClient.get).toHaveBeenCalledWith('/requests');
    });

    it('should handle error', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useClientRequests(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useProfessionalRequests', () => {
    it('should fetch professional requests successfully', async () => {
      const mockRequests = [createMockRequest()];
      mockApiClient.get.mockResolvedValueOnce({ data: mockRequests });

      const { result } = renderHook(() => useProfessionalRequests(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockRequests);
      expect(mockApiClient.get).toHaveBeenCalledWith('/requests');
    });
  });

  describe('useAvailableRequests', () => {
    it('should fetch available requests without filters', async () => {
      const mockRequests = [createMockRequest({ isPublic: true })];
      mockApiClient.get.mockResolvedValueOnce({ data: mockRequests });

      const { result } = renderHook(() => useAvailableRequests(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApiClient.get).toHaveBeenCalledWith('/requests/available?');
    });

    it('should fetch available requests with city filter', async () => {
      const mockRequests = [createMockRequest({ isPublic: true })];
      mockApiClient.get.mockResolvedValueOnce({ data: mockRequests });

      const { result } = renderHook(() => useAvailableRequests('Bariloche'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApiClient.get).toHaveBeenCalledWith('/requests/available?city=Bariloche');
    });

    it('should fetch available requests with city and zone filters', async () => {
      const mockRequests = [createMockRequest({ isPublic: true })];
      mockApiClient.get.mockResolvedValueOnce({ data: mockRequests });

      const { result } = renderHook(() => useAvailableRequests('Bariloche', 'Centro'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApiClient.get).toHaveBeenCalledWith('/requests/available?city=Bariloche&zone=Centro');
    });
  });

  describe('useRequest', () => {
    it('should fetch a single request by ID', async () => {
      const mockRequest = createMockRequest();
      mockApiClient.get.mockResolvedValueOnce({ data: mockRequest });

      const { result } = renderHook(() => useRequest('request-123'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockRequest);
      expect(mockApiClient.get).toHaveBeenCalledWith('/requests/request-123');
    });

    it('should not fetch when ID is empty', async () => {
      const { result } = renderHook(() => useRequest(''), { wrapper: createWrapper() });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreateRequest', () => {
    it('should create a request successfully', async () => {
      const newRequest = createMockRequest();
      mockApiClient.post.mockResolvedValueOnce({ data: newRequest });

      const { result } = renderHook(() => useCreateRequest(), { wrapper: createWrapper() });

      result.current.mutate({
        description: 'Test description',
        tradeId: 'trade-123',
        isPublic: false,
        professionalId: 'prof-123',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApiClient.post).toHaveBeenCalledWith('/requests', {
        description: 'Test description',
        tradeId: 'trade-123',
        isPublic: false,
        professionalId: 'prof-123',
      });
    });
  });

  describe('useUpdateRequest', () => {
    it('should update a request successfully', async () => {
      const updatedRequest = createMockRequest({ status: 'IN_PROGRESS' });
      mockApiClient.patch.mockResolvedValueOnce({ data: updatedRequest });

      const { result } = renderHook(() => useUpdateRequest(), { wrapper: createWrapper() });

      result.current.mutate({
        id: 'request-123',
        data: { status: 'IN_PROGRESS' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApiClient.patch).toHaveBeenCalledWith('/requests/request-123', { status: 'IN_PROGRESS' });
    });
  });

  describe('useAcceptQuote', () => {
    it('should accept a quote successfully', async () => {
      const acceptedRequest = createMockRequest({ status: 'ACCEPTED' });
      mockApiClient.post.mockResolvedValueOnce({ data: acceptedRequest });

      const { result } = renderHook(() => useAcceptQuote(), { wrapper: createWrapper() });

      result.current.mutate('request-123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApiClient.post).toHaveBeenCalledWith('/requests/request-123/accept');
    });
  });

  describe('useRequestInterests', () => {
    it('should fetch request interests', async () => {
      const mockInterests = [
        { id: 'interest-1', requestId: 'request-123', professionalId: 'prof-1', message: 'Interested' },
      ];
      mockApiClient.get.mockResolvedValueOnce({ data: mockInterests });

      const { result } = renderHook(() => useRequestInterests('request-123'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockInterests);
      expect(mockApiClient.get).toHaveBeenCalledWith('/requests/request-123/interests');
    });
  });

  describe('useMyInterest', () => {
    it('should check if user has interest', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: { hasInterest: true } });

      const { result } = renderHook(() => useMyInterest('request-123'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.hasInterest).toBe(true);
      expect(mockApiClient.get).toHaveBeenCalledWith('/requests/request-123/interest');
    });
  });

  describe('useExpressInterest', () => {
    it('should express interest successfully', async () => {
      const mockInterest = { id: 'interest-1', requestId: 'request-123', professionalId: 'prof-1' };
      mockApiClient.post.mockResolvedValueOnce({ data: mockInterest });

      const { result } = renderHook(() => useExpressInterest(), { wrapper: createWrapper() });

      result.current.mutate({ requestId: 'request-123', data: { message: 'I am interested' } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApiClient.post).toHaveBeenCalledWith('/requests/request-123/interest', { message: 'I am interested' });
    });
  });

  describe('useRemoveInterest', () => {
    it('should remove interest successfully', async () => {
      mockApiClient.delete.mockResolvedValueOnce({});

      const { result } = renderHook(() => useRemoveInterest(), { wrapper: createWrapper() });

      result.current.mutate('request-123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApiClient.delete).toHaveBeenCalledWith('/requests/request-123/interest');
    });
  });

  describe('useAssignProfessional', () => {
    it('should assign provider successfully', async () => {
      const assignedRequest = createMockRequest({ status: 'ACCEPTED', professionalId: 'prof-456' });
      mockApiClient.post.mockResolvedValueOnce({ data: assignedRequest });

      const { result } = renderHook(() => useAssignProfessional(), { wrapper: createWrapper() });

      result.current.mutate({ requestId: 'request-123', serviceProviderId: 'sp-456' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApiClient.post).toHaveBeenCalledWith('/requests/request-123/assign-provider', { serviceProviderId: 'sp-456' });
    });
  });
});

