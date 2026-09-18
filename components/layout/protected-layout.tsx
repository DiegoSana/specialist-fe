'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, isAuthenticated } from '@/lib/auth';
import MainNav from '../navigation/main-nav';

interface ProtectedLayoutProps {
  children: ReactNode;
  requireProfile?: boolean; // Default true - require at least one profile
}

export default function ProtectedLayout({ children, requireProfile = true }: ProtectedLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      // Check authentication
      if (!isAuthenticated()) {
        router.push('/es/login');
        return;
      }

      const user = getUser();
      
      // Check profile if required
      if (requireProfile && user) {
        const hasProfile = user.hasClientProfile || user.hasProfessionalProfile || user.hasCompanyProfile;
        if (!hasProfile) {
          router.push('/es/profile-setup');
          return;
        }
      }

      setHasAccess(true);
      setIsLoading(false);
    };

    checkAccess();
  }, [router, requireProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <MainNav />
        </header>
        <main className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </main>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <MainNav />
      </header>
      <main>{children}</main>
    </div>
  );
}

