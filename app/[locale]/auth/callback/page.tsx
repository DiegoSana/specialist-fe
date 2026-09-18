'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAuthToken, setUser } from '@/lib/auth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (token && userParam) {
      try {
        setAuthToken(token);
        const user = JSON.parse(decodeURIComponent(userParam));
        setUser(user);
        
        // If user has no profile, redirect to profile setup
        if (!user.hasClientProfile && !user.hasProfessionalProfile && !user.hasCompanyProfile) {
          router.push('/es/profile-setup');
        } else if (user.hasProfessionalProfile) {
          router.push('/es/specialist/dashboard');
        } else if (user.hasCompanyProfile) {
          router.push('/es/specialist/job-board');
        } else {
          router.push('/es/professionals');
        }
      } catch (err) {
        console.error('Error processing auth callback:', err);
        setError('Error al procesar la autenticación');
        setTimeout(() => {
          router.push('/es/login');
        }, 3000);
      }
    } else {
      setError('Faltan parámetros de autenticación');
      setTimeout(() => {
        router.push('/es/login');
      }, 3000);
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {error}
          </h2>
          <p className="text-gray-500">
            Redirigiendo al login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Procesando autenticación...
        </h2>
        <p className="text-gray-500">
          Por favor espera un momento
        </p>
      </div>
    </div>
  );
}