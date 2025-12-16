'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { LoginRequest, RegisterRequest, AuthResponse } from '@/types';
import { setAuthToken, setUser } from '@/lib/auth';

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<AuthResponse> => {
      const response = await apiClient.post<AuthResponse>(
        '/auth/login',
        credentials
      );
      return response.data;
    },
    onSuccess: (data) => {
      try {
        // Store token and user
        if (data.accessToken) {
          setAuthToken(data.accessToken);
        } else {
          console.error('No accessToken in response:', data);
          throw new Error('No access token received');
        }

        if (data.user) {
          setUser(data.user);
        } else {
          console.error('No user in response:', data);
          throw new Error('No user data received');
        }

        // Redirect based on user profiles
        const locale = window.location.pathname.split('/')[1] || 'es';
        if (data.user.hasProfessionalProfile) {
          router.push(`/${locale}/specialist/dashboard`);
        } else if (data.user.hasClientProfile) {
          router.push(`/${locale}/professionals`);
        } else {
          router.push(`/${locale}/professionals`);
        }
      } catch (error) {
        console.error('Error storing auth data:', error);
        throw error;
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: RegisterRequest): Promise<AuthResponse> => {
      const response = await apiClient.post<AuthResponse>(
        '/auth/register',
        data
      );
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      try {
        // Store token and user
        if (data.accessToken) {
          setAuthToken(data.accessToken);
        } else {
          console.error('No accessToken in response:', data);
          throw new Error('No access token received');
        }

        if (data.user) {
          setUser(data.user);
        } else {
          console.error('No user in response:', data);
          throw new Error('No user data received');
        }

        // Note: Redirect is handled by the component based on selectedRole
        // This allows the component to redirect to professional setup if needed
      } catch (error) {
        console.error('Error storing auth data:', error);
        throw error;
      }
    },
    onError: (error: any) => {
      console.error('Register error:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    },
  });
}

