'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useClientRequests } from '@/hooks/use-requests';
import { bucketRequests } from '@/lib/request-status';
import ProtectedLayout from '@/components/layout/protected-layout';
import RequestTabs, { RequestTab } from '@/components/requests/request-tabs';
import RequestListCard from '@/components/requests/request-list-card';
import FinalRequestsStrip from '@/components/requests/final-requests-strip';

export default function ClientDashboardPage() {
  const t = useTranslations('client.dashboard');
  const tTabs = useTranslations('requestStatus.tabs');
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'es';

  const { data: requests, isLoading } = useClientRequests();
  const [tab, setTab] = useState<RequestTab>('yours');

  const buckets = useMemo(() => bucketRequests(requests ?? [], 'client'), [requests]);
  const counts = {
    yours: buckets.yours.length,
    waiting: buckets.waiting.length,
    closed: buckets.closed.length,
  };
  const visible = buckets[tab];

  return (
    <ProtectedLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
            <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
          </div>
          <Link
            href={`/${locale}/client/requests/new`}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 sm:text-base"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('newRequest')}
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          </div>
        ) : requests && requests.length === 0 ? (
          <div className="py-12 text-center">
            <h3 className="mt-2 text-sm font-medium text-gray-800">{t('empty.title')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('empty.description')}</p>
            <div className="mt-6">
              <Link
                href={`/${locale}/client/requests/new`}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                {t('newRequest')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <RequestTabs active={tab} counts={counts} onChange={setTab} />

            {visible.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                {t('emptyTab', { tab: tTabs(tab) })}
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {visible.map((request) => (
                  <RequestListCard key={request.id} request={request} role="client" locale={locale} />
                ))}
              </div>
            )}

            <FinalRequestsStrip requests={buckets.final} role="client" locale={locale} />
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
