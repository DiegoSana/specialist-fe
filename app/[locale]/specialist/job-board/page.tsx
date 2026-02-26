'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getUser, isAuthenticated } from '@/lib/auth';
import { useAvailableRequests, useExpressInterest, useRemoveInterest, useMyInterest } from '@/hooks/use-requests';
import AppLayout from '@/components/layout/app-layout';
import { Request } from '@/types';

// Component for interest button with loading state
function InterestButton({ request }: { request: Request }) {
  const t = useTranslations('specialist.jobBoard');
  const tProfileActive = useTranslations('profileActive');
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'es';
  const { data: interestData, isLoading: isLoadingInterest } = useMyInterest(request.id);
  const expressInterest = useExpressInterest();
  const removeInterest = useRemoveInterest();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasInterest = interestData?.hasInterest ?? false;
  const isLoading = isLoadingInterest || expressInterest.isPending || removeInterest.isPending;

  const handleToggleInterest = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMessage(null);

    if (hasInterest) {
      try {
        await removeInterest.mutateAsync(request.id);
      } catch (err: any) {
        setErrorMessage(err.response?.data?.message || 'Error');
      }
      return;
    }

    try {
      await expressInterest.mutateAsync({ requestId: request.id });
    } catch (err: any) {
      const msg = err.response?.data?.message as string | undefined;
      const lower = (msg || '').toLowerCase();
      const isProfileInactive =
        !!msg &&
        ((lower.includes('active') && lower.includes('interest')) ||
          (lower.includes('verify') && (lower.includes('email') || lower.includes('phone'))));
      setErrorMessage(
        isProfileInactive ? tProfileActive('expressInterestMessage') : msg || 'Error'
      );
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleToggleInterest}
        disabled={isLoading}
        className={`flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          hasInterest
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } disabled:opacity-50`}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : hasInterest ? (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {t('interested')}
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {t('expressInterest')}
          </>
        )}
      </button>
      {errorMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-left">
          <p className="text-xs text-amber-800">{errorMessage}</p>
          <Link
            href={`/${locale}/profile`}
            className="inline-block mt-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            {tProfileActive('goToProfile')} →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function JobBoardPage() {
  const t = useTranslations('specialist.jobBoard');
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUserState] = useState<any | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const initialUser = getUser();
    if (initialUser) {
      setUserState(initialUser);
    }
    setIsLoadingUser(false);
  }, []);

  useEffect(() => {
    if (!isLoadingUser && (!isAuthenticated() || !user?.hasProfessionalProfile)) {
      const locale = pathname?.split('/')[1] || 'es';
      router.push(`/${locale}/login`);
    }
  }, [router, user, pathname, isLoadingUser]);

  // Fetch available requests for professionals
  const { data: requests, isLoading } = useAvailableRequests();

  const locale = pathname?.split('/')[1] || 'es';

  if (isLoadingUser) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user?.hasProfessionalProfile) {
    return null;
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            {t('title')}
          </h1>
          <p className="text-gray-500 mt-1">
            {t('subtitle')}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : requests && requests.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-5">
                  {/* Trade Badge */}
                  {request.trade && (
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-3">
                      {request.trade.name}
                    </span>
                  )}

                  {/* Description */}
                  <p className="text-gray-800 font-medium line-clamp-2 mb-3">
                    {request.description}
                  </p>

                  {/* Location */}
                  {request.address && (
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{request.address}</span>
                    </div>
                  )}

                  {/* Availability */}
                  {request.availability && (
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{request.availability}</span>
                    </div>
                  )}

                  {/* Client Info & Date */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {request.client?.profilePictureUrl ? (
                          <img 
                            src={request.client.profilePictureUrl} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {request.client?.firstName} {request.client?.lastName?.[0]}.
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 space-y-2">
                  <InterestButton request={request} />
                  <Link
                    href={`/${locale}/specialist/requests/${request.id}`}
                    className="block w-full text-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    {t('viewDetails')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              {t('empty.title')}
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {t('empty.description')}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
