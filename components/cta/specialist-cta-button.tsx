'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuthToken, getUser } from '@/lib/auth';

interface SpecialistCtaButtonProps {
  locale: string;
  children: React.ReactNode;
  className?: string;
  showArrow?: boolean;
}

export default function SpecialistCtaButton({ 
  locale, 
  children, 
  className = '',
  showArrow = false 
}: SpecialistCtaButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [targetUrl, setTargetUrl] = useState(`/${locale}/register?role=professional`);

  useEffect(() => {
    const token = getAuthToken();
    const user = getUser();

    if (token && user) {
      // User is logged in
      if (user.hasProfessionalProfile || user.hasCompanyProfile) {
        // User is a specialist → go to job board
        setTargetUrl(`/${locale}/specialist/job-board`);
      } else {
        // User is logged in but not a specialist → go to specialist setup
        setTargetUrl(`/${locale}/specialist/setup`);
      }
    } else {
      // User is not logged in → go to register as professional
      setTargetUrl(`/${locale}/register?role=professional`);
    }
    
    setIsLoading(false);
  }, [locale]);

  if (isLoading) {
    return (
      <span className={className}>
        {children}
        {showArrow && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        )}
      </span>
    );
  }

  return (
    <Link href={targetUrl} className={className}>
      {children}
      {showArrow && (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      )}
    </Link>
  );
}

