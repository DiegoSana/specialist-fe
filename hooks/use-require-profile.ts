'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';

/**
 * Hook to ensure user has at least one profile (client or professional).
 * Redirects to profile setup if no profile exists.
 * 
 * @returns { hasProfile: boolean, isLoading: boolean }
 */
export function useRequireProfile() {
  const router = useRouter();
  const user = getUser();

  const hasProfile = user?.hasClientProfile || user?.hasProfessionalProfile || user?.hasCompanyProfile || false;
  const isAuthenticated = !!user;

  useEffect(() => {
    if (isAuthenticated && !hasProfile) {
      router.push('/es/profile-setup');
    }
  }, [isAuthenticated, hasProfile, router]);

  return {
    hasProfile,
    isLoading: isAuthenticated && !hasProfile,
  };
}

