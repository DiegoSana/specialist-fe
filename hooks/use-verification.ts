'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getUser, setUser } from '@/lib/auth';

export type VerificationType = 'PHONE' | 'EMAIL';

interface RequestVerificationResponse {
  message: string;
}

interface ConfirmVerificationResponse {
  message: string;
}

interface ConfirmVerificationRequest {
  code: string;
}

/**
 * Hook to request phone verification code
 */
export function useRequestPhoneVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<RequestVerificationResponse> => {
      const response = await apiClient.post<RequestVerificationResponse>(
        '/identity/verification/phone/request'
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user profile to refresh verification status
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}

/**
 * Hook to confirm phone verification with OTP code
 */
export function useConfirmPhoneVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string): Promise<ConfirmVerificationResponse> => {
      const response = await apiClient.post<ConfirmVerificationResponse>(
        '/identity/verification/phone/confirm',
        { code }
      );
      return response.data;
    },
    onSuccess: async () => {
      // Refresh user profile to get updated verification status
      const response = await apiClient.get('/users/me');
      const updatedUser = response.data;
      
      // Update user in localStorage
      const currentUser = getUser();
      if (currentUser) {
        const mergedUser = {
          ...currentUser,
          phoneVerified: updatedUser.phoneVerified,
        };
        setUser(mergedUser);
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}

/**
 * Hook to request email verification code
 */
export function useRequestEmailVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<RequestVerificationResponse> => {
      const response = await apiClient.post<RequestVerificationResponse>(
        '/identity/verification/email/request'
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate user profile to refresh verification status
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}

/**
 * Hook to confirm email verification with OTP code
 */
export function useConfirmEmailVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string): Promise<ConfirmVerificationResponse> => {
      const response = await apiClient.post<ConfirmVerificationResponse>(
        '/identity/verification/email/confirm',
        { code }
      );
      return response.data;
    },
    onSuccess: async () => {
      // Refresh user profile to get updated verification status
      const response = await apiClient.get('/users/me');
      const updatedUser = response.data;
      
      // Update user in localStorage
      const currentUser = getUser();
      if (currentUser) {
        const mergedUser = {
          ...currentUser,
          emailVerified: updatedUser.emailVerified,
        };
        setUser(mergedUser);
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}

