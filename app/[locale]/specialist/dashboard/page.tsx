'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  useProfessionalRequests,
  useAvailableRequests,
  useMyInterestedRequests,
} from '@/hooks/use-requests';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import { useMyCompanyProfile } from '@/hooks/use-company';
import { bucketRequests } from '@/lib/request-status';
import ProtectedLayout from '@/components/layout/protected-layout';
import RequestTabs, { RequestTab } from '@/components/requests/request-tabs';
import RequestListCard from '@/components/requests/request-list-card';
import FinalRequestsStrip from '@/components/requests/final-requests-strip';
import ApplicationsList from '@/components/requests/applications-list';

export default function SpecialistDashboardPage() {
  const t = useTranslations('specialist.dashboard');
  const tTabs = useTranslations('requestStatus.tabs');
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'es';

  const { data: requests, isLoading } = useProfessionalRequests();
  const { data: applications } = useMyInterestedRequests();
  const [tab, setTab] = useState<RequestTab>('yours');
  const { data: professionalProfile, isLoading: loadingProfessional } = useMyProfessionalProfile();
  const { data: companyProfile, isLoading: loadingCompany } = useMyCompanyProfile();
  const profile = professionalProfile ?? companyProfile;
  const loadingProfile = loadingProfessional || loadingCompany;
  const { data: availableRequests, isLoading: loadingAvailable } = useAvailableRequests(
    profile?.city,
    profile?.zone
  );

  const buckets = bucketRequests(requests ?? [], 'provider');
  const counts = {
    yours: buckets.yours.length,
    waiting: buckets.waiting.length,
    closed: buckets.closed.length,
  };
  const visible = buckets[tab];
  // Requests the specialist was chosen for already show up as regular cards; the rest are "postulaciones".
  const ownedIds = new Set((requests ?? []).map((r) => r.id));
  const openApplications = (applications ?? []).filter((a) => !ownedIds.has(a.requestId));
  // "Trabajos disponibles" should only offer requests the specialist hasn't already applied to -
  // those already show up below, in the "postulaciones" (ApplicationsList) section.
  const interestedRequestIds = new Set((applications ?? []).map((a) => a.requestId));
  const AVAILABLE_JOBS_LIMIT = 4;
  const uninterestedAvailableRequests = (availableRequests ?? []).filter(
    (request) => !interestedRequestIds.has(request.id)
  );
  const visibleAvailableRequests = uninterestedAvailableRequests.slice(0, AVAILABLE_JOBS_LIMIT);

  return (
    <ProtectedLayout requiredProfileType="provider" noProfileRedirectPath={`/${locale}/specialist/setup`}>
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
            {uninterestedAvailableRequests.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {t('sections.available')}
                  </h2>
                  <Link
                    href={`/${locale}/specialist/job-board`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {t('viewAllInJobBoard')}
                  </Link>
                </div>
                <div className="space-y-3">
                  {visibleAvailableRequests.map((request) => (
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
                            {request.title}
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

            <RequestTabs active={tab} counts={counts} onChange={setTab} />

            {visible.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                {t('emptyTab', { tab: tTabs(tab) })}
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {visible.map((request) => (
                  <RequestListCard key={request.id} request={request} role="provider" locale={locale} />
                ))}
              </div>
            )}

            <ApplicationsList applications={openApplications} locale={locale} />

            <FinalRequestsStrip requests={buckets.final} role="provider" locale={locale} />

            {/* Empty State */}
            {requests?.length === 0 && openApplications.length === 0 && (
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
    </ProtectedLayout>
  );
}

