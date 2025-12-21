'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getUser, setUser } from '@/lib/auth';
import { useCreateClientProfile } from '@/hooks/use-client';

export default function ProfileSetupPage() {
  const t = useTranslations('profileSetup');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createClientProfile = useCreateClientProfile();
  const user = getUser();

  // If user already has a profile, redirect
  if (user?.hasClientProfile || user?.hasProfessionalProfile) {
    router.push('/es/professionals');
    return null;
  }

  const handleSelectClient = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await createClientProfile.mutateAsync();
      
      // Update local user
      if (user) {
        const updatedUser = { ...user, hasClientProfile: true };
        setUser(updatedUser);
      }
      
      router.push('/es/professionals');
    } catch (err: any) {
      setError(err.message || 'Error al crear el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProfessional = () => {
    router.push('/es/specialist/setup');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold text-blue-600">Specialist</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {t('title')}
            </h1>
            <p className="text-gray-500">
              {t('subtitle')}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Option */}
            <button
              onClick={handleSelectClient}
              disabled={isLoading}
              className="group p-6 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-14 h-14 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center mb-4 transition-colors">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t('clientTitle')}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {t('clientDescription')}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('clientBenefit1')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('clientBenefit2')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('clientBenefit3')}
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-blue-600 font-medium text-sm group-hover:underline">
                  {isLoading ? t('creating') : t('selectClient')} →
                </span>
              </div>
            </button>

            {/* Professional Option */}
            <button
              onClick={handleSelectProfessional}
              disabled={isLoading}
              className="group p-6 rounded-2xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-14 h-14 bg-amber-100 group-hover:bg-amber-200 rounded-xl flex items-center justify-center mb-4 transition-colors">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t('professionalTitle')}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {t('professionalDescription')}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('professionalBenefit1')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('professionalBenefit2')}
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('professionalBenefit3')}
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-amber-600 font-medium text-sm group-hover:underline">
                  {t('selectProfessional')} →
                </span>
              </div>
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            {t('note')}
          </p>
        </div>
      </div>
    </div>
  );
}

