'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, isAuthenticated } from '@/lib/auth';

/**
 * Guards a page against an authenticated user who has no profile at all yet (e.g. a fresh
 * Google/Facebook login that hasn't picked a role) by redirecting to /es/profile-setup, and
 * against an unauthenticated visitor by redirecting to /es/login - mirroring ProtectedLayout's
 * gate for pages that can't use that layout directly.
 *
 * Resolves in an effect rather than synchronously during render to avoid an SSR/hydration
 * mismatch (getUser() reads localStorage, unavailable during SSR) - same pattern documented in
 * profile-setup/page.tsx.
 *
 * @returns { isChecking, canRender } - canRender only becomes true once the user is confirmed
 * authenticated with a profile; while a redirect is in flight isChecking stays true forever
 * (the page is about to navigate away), so callers should render nothing (or a loading state)
 * whenever !canRender.
 */
export function useRequireProfile() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/es/login');
      return;
    }

    const user = getUser();
    const hasProfile =
      !!user?.hasClientProfile || !!user?.hasProfessionalProfile || !!user?.hasCompanyProfile;

    if (!hasProfile) {
      router.push('/es/profile-setup');
      return;
    }

    setCanRender(true);
    setIsChecking(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return { isChecking, canRender };
}
