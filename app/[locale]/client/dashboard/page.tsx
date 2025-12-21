'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useClientRequests } from '@/hooks/use-requests';
import { RequestStatus } from '@/types';
import ProtectedLayout from '@/components/layout/protected-layout';

export default function ClientDashboardPage() {
  const t = useTranslations('client.dashboard');
  const pathname = usePathname();

  const { data: requests, isLoading } = useClientRequests();

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
    <ProtectedLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {t('title')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('subtitle')}
            </p>
          </div>
          <Link
            href={`/${locale}/client/requests/new`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('newRequest')}
          </Link>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  {t('sections.pending')} ({pendingRequests.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingRequests.map((request) => (
                    <Link
                      key={request.id}
                      href={`/${locale}/client/requests/${request.id}`}
                      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                            request.status
                          )}`}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm line-clamp-2 mb-2">
                        {request.description}
                      </p>
                      {request.professional && (
                        <p className="text-xs text-gray-500">
                          {t('with')} {request.professional.user?.firstName}{' '}
                          {request.professional.user?.lastName}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* In Progress Requests */}
            {inProgressRequests.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  {t('sections.inProgress')} ({inProgressRequests.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {inProgressRequests.map((request) => (
                    <Link
                      key={request.id}
                      href={`/${locale}/client/requests/${request.id}`}
                      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                            request.status
                          )}`}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm line-clamp-2 mb-2">
                        {request.description}
                      </p>
                      {request.professional && (
                        <p className="text-xs text-gray-500">
                          {t('with')} {request.professional.user?.firstName}{' '}
                          {request.professional.user?.lastName}
                        </p>
                      )}
                      {request.quoteAmount && (
                        <p className="text-sm font-semibold text-green-600 mt-2">
                          ${request.quoteAmount.toLocaleString()}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Completed Requests */}
            {completedRequests.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  {t('sections.completed')} ({completedRequests.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {completedRequests.map((request) => (
                    <Link
                      key={request.id}
                      href={`/${locale}/client/requests/${request.id}`}
                      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                            request.status
                          )}`}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm line-clamp-2 mb-2">
                        {request.description}
                      </p>
                      {request.professional && (
                        <p className="text-xs text-gray-500">
                          {t('with')} {request.professional.user?.firstName}{' '}
                          {request.professional.user?.lastName}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {requests?.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-800">
                  {t('empty.title')}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t('empty.description')}
                </p>
                <div className="mt-6">
                  <Link
                    href={`/${locale}/client/requests/new`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {t('newRequest')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}

