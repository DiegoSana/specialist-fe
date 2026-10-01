'use client';

import { useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  message: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

interface ResetPasswordResponse {
  message: string;
}

/**
 * Hook to request a password reset email.
 * Always resolves with a generic message regardless of whether the email
 * exists or belongs to an OAuth-only account (backend never leaks that info).
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (
      data: ForgotPasswordRequest
    ): Promise<ForgotPasswordResponse> => {
      const response = await apiClient.post<ForgotPasswordResponse>(
        '/auth/forgot-password',
        data
      );
      return response.data;
    },
  });
}

/**
 * Hook to reset a password using the token from the reset-password email link.
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (
      data: ResetPasswordRequest
    ): Promise<ResetPasswordResponse> => {
      const response = await apiClient.post<ResetPasswordResponse>(
        '/auth/reset-password',
        data
      );
      return response.data;
    },
  });
}
