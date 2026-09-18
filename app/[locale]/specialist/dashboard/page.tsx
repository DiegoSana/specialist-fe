'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getUser, isAuthenticated } from '@/lib/auth';
import { useProfessionalRequests, useAvailableRequests } from '@/hooks/use-requests';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import { useMyCompanyProfile } from '@/hooks/use-company';
import { RequestStatus } from '@/types';
import AppLayout from '@/components/layout/app-layout';

export default function SpecialistDashboardPage() {
  const t = useTranslations('specialist.dashboard');
  const router = useRouter();
  const pathname = usePathname();
  const user = getUser();

  const { data: requests, isLoading } = useProfessionalRequests();
  const { data: professionalProfile, isLoading: loadingProfessional } = useMyProfessionalProfile();
  const { data: companyProfile, isLoading: loadingCompany } = useMyCompanyProfile();
  const profile = professionalProfile ?? companyProfile;
  const loadingProfile = loadingProfessional || loadingCompany;
  const { data: availableRequests, isLoading: loadingAvailable } = useAvailableRequests(
    profile?.city,
    profile?.zone
  );
  
  // Get trade IDs from profile for available requests
  const tradeIds = profile?.trades?.map((t) => t.id) || [];

  useEffect(() => {
    if (!isAuthenticated() || !user) {
      const locale = pathname?.split('/')[1] || 'es';
      router.push(`/${locale}/login`);
    } else if (!user.hasProfessionalProfile && !user.hasCompanyProfile) {
      const locale = pathname?.split('/')[1] || 'es';
      router.push(`/${locale}/specialist/setup`);
    }
  }, [router, user, pathname]);

  if (!user) {
    return null;
  }

  const getStatusBadgeColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case RequestStatus.ACCEPTED:
        return 'bg-blue-100 text-blue-800';
      case RequestStatus.IN_PROGRESS:
        return 'bg-purple-100 text-purple-800';
      case RequestStatus.DONE:
        return 'bg-green-100 text-green-800';
      case RequestStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING:
        return t('status.pending');
      case RequestStatus.ACCEPTED:
        return t('status.accepted');
      case RequestStatus.IN_PROGRESS:
        return t('status.inProgress');
      case RequestStatus.DONE:
        return t('status.done');
      case RequestStatus.CANCELLED:
        return t('status.cancelled');
      default:
        return status;
    }
  };

  const pendingRequests = requests?.filter((r) => r.status === RequestStatus.PENDING) || [];
  const inProgressRequests =
    requests?.filter(
      (r) =>
        r.status === RequestStatus.ACCEPTED || r.status === RequestStatus.IN_PROGRESS
    ) || [];
  const completedRequests =
    requests?.filter((r) => r.status === RequestStatus.DONE) || [];

  const locale = pathname?.split('/')[1] || 'es';

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {t('title')}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {t('subtitle')}
              </p>
            </div>
            {profile && (
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {t('profileStatus')}
                </p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                    profile.status === 'VERIFIED' || profile.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : profile.status === 'PENDING_VERIFICATION'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {profile.status === 'VERIFIED' || profile.status === 'ACTIVE'
                    ? t('status.verified')
                    : profile.status === 'PENDING_VERIFICATION'
                    ? t('status.pendingVerification')
                    : t('status.rejected')}
                </span>
              </div>
            )}
          </div>
        </div>
        {isLoading || loadingProfile || loadingAvailable ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Available Jobs */}
            {availableRequests && availableRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {t('sections.available')}
                </h2>
                <div className="space-y-3">
                  {availableRequests.map((request) => (
                    <Link
                      key={request.id}
                      href={`/${locale}/specialist/requests/${request.id}`}
                      className="block bg-blue-50/20 border border-blue-200 rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">
                            {t('requestFrom')}{' '}
                            {request.client
                              ? `${request.client.firstName} ${request.client.lastName}`
                              : request.clientId}
                          </p>
                          <p className="text-gray-800 mt-1 line-clamp-2">
                            {request.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {t('new')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {t('sections.pending')}
                </h2>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <Link
                      key={request.id}
                      href={`/${locale}/specialist/requests/${request.id}`}
                      className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">
                            {t('requestFrom')}{' '}
                            {request.client
                              ? `${request.client.firstName} ${request.client.lastName}`
                              : request.clientId}
                          </p>
                          <p className="text-gray-800 mt-1 line-clamp-2">
                            {request.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                            request.status
                          )}`}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Requests */}
            {inProgressRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {t('sections.inProgress')}
                </h2>
                <div className="space-y-3">
                  {inProgressRequests.map((request) => (
                    <Link
                      key={request.id}
                      href={`/${locale}/specialist/requests/${request.id}`}
                      className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">
                            {t('requestFrom')}{' '}
                            {request.client
                              ? `${request.client.firstName} ${request.client.lastName}`
                              : request.clientId}
                          </p>
                          <p className="text-gray-800 mt-1 line-clamp-2">
                            {request.description}
                          </p>
                          {request.quoteAmount && (
                            <p className="text-sm font-medium text-green-600 mt-2">
                              {t('quote')}: ${request.quoteAmount}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                            request.status
                          )}`}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Requests */}
            {completedRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {t('sections.completed')}
                </h2>
                <div className="space-y-3">
                  {completedRequests.map((request) => (
                    <Link
                      key={request.id}
                      href={`/${locale}/specialist/requests/${request.id}`}
                      className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">
                            {t('requestFrom')}{' '}
                            {request.client
                              ? `${request.client.firstName} ${request.client.lastName}`
                              : request.clientId}
                          </p>
                          <p className="text-gray-800 mt-1 line-clamp-2">
                            {request.description}
                          </p>
                          {request.quoteAmount && (
                            <p className="text-sm font-medium text-green-600 mt-2">
                              {t('quote')}: ${request.quoteAmount}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                            request.status
                          )}`}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {requests?.length === 0 && (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-800">
                    {t('empty.title')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('empty.description')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

