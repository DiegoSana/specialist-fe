'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, isAuthenticated } from '@/lib/auth';
import MainNav from '../navigation/main-nav';

type AuthUser = ReturnType<typeof getUser>;

interface ProtectedLayoutProps {
  /** Plain children, or a render function that receives the resolved user once access is
   *  granted - use the function form when the page needs the user object itself (not just the
   *  auth/profile gate), so it never has to call the SSR-unsafe getUser() a second time itself. */
  children: ReactNode | ((user: AuthUser) => ReactNode);
  requireProfile?: boolean; // Default true - require at least one profile
  /** Which profile(s) satisfy requireProfile. 'any' (default) = client OR professional OR
   *  company, matching the original behavior. 'provider' = professional OR company only. */
  requiredProfileType?: 'any' | 'provider';
  /** Where to send an authenticated user who fails the profile check. Default '/es/profile-setup'. */
  noProfileRedirectPath?: string;
  /** Where to send an unauthenticated user. Default '/es/login'. */
  noAuthRedirectPath?: string;
}

export default function ProtectedLayout({
  children,
  requireProfile = true,
  requiredProfileType = 'any',
  noProfileRedirectPath = '/es/profile-setup',
  noAuthRedirectPath = '/es/login',
}: ProtectedLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [user, setUserState] = useState<AuthUser>(null);

  useEffect(() => {
    const checkAccess = () => {
      // Check authentication
      if (!isAuthenticated()) {
        router.push(noAuthRedirectPath);
        return;
      }

      const currentUser = getUser();

      // Check profile if required
      if (requireProfile && currentUser) {
        const hasProfile =
          requiredProfileType === 'provider'
            ? currentUser.hasProfessionalProfile || currentUser.hasCompanyProfile
            : currentUser.hasClientProfile ||
              currentUser.hasProfessionalProfile ||
              currentUser.hasCompanyProfile;
        if (!hasProfile) {
          router.push(noProfileRedirectPath);
          return;
        }
      }

      setUserState(currentUser);
      setHasAccess(true);
      setIsLoading(false);
    };

    checkAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, requireProfile, requiredProfileType, noProfileRedirectPath, noAuthRedirectPath]);

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
      <main>{typeof children === 'function' ? children(user) : children}</main>
    </div>
  );
}

