import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useForgotPassword, useResetPassword } from '../use-password-reset';

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
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
};

describe('use-password-reset hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useForgotPassword', () => {
    it('should post the email and resolve with the backend message', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { message: 'If an account exists, an email was sent.' },
      });

      const { result } = renderHook(() => useForgotPassword(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ email: 'user@example.com' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'user@example.com',
      });
      expect(result.current.data).toEqual({
        message: 'If an account exists, an email was sent.',
      });
    });

    it('should surface an error when the request fails', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useForgotPassword(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ email: 'user@example.com' });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useResetPassword', () => {
    it('should post the token and new password and resolve with the backend message', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { message: 'Password reset successfully.' },
      });

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        token: 'a'.repeat(64),
        newPassword: 'newpass123',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'a'.repeat(64),
        newPassword: 'newpass123',
      });
      expect(result.current.data).toEqual({
        message: 'Password reset successfully.',
      });
    });

    it('should surface a 400 error for an invalid or expired token', async () => {
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            statusCode: 400,
            message: 'Invalid or expired token',
            error: 'Bad Request',
          },
        },
      });

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        token: 'expired-token',
        newPassword: 'newpass123',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect((result.current.error as any)?.response?.status).toBe(400);
    });
  });
});
