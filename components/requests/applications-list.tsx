'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { InterestedRequest } from '@/types';
import { INTEREST_STATUS_META } from '@/lib/request-status';

interface ApplicationsListProps {
  applications: InterestedRequest[];
  locale: string;
}

/** "Tus postulaciones en la bolsa": one row per public request the specialist showed interest in. */
export default function ApplicationsList({ applications, locale }: ApplicationsListProps) {
  const t = useTranslations('requestStatus');
  if (applications.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2.5 text-[15px] font-semibold text-gray-800">{t('applications.title')}</h2>
      <div className="flex flex-col gap-2">
        {applications.map((application) => {
          const meta = INTEREST_STATUS_META[application.interestStatus];
          return (
            <Link
              key={application.interestId}
              href={`/${locale}/specialist/requests/${application.requestId}`}
              data-testid="application-row"
              data-interest-status={application.interestStatus}
              className={`flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 transition-shadow hover:shadow-sm ${
                meta?.muted ? 'opacity-60' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-gray-800">
                  {application.title || application.description}
                </p>
                {/* Client's aggregate rating "in context" (REVIEWS_REDESIGN.md section 2) — only
                    averageRating/totalReviews travel on this compact list item; the curated
                    featuredReviews only populate on the request detail response. */}
                {!!application.fullRequest?.client?.averageRating && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500">
                    <span className="text-yellow-500">★</span>
                    {application.fullRequest.client.averageRating.toFixed(1)} (
                    {application.fullRequest.client.totalReviews ?? 0})
                  </p>
                )}
              </div>
              <span
                className={`flex-shrink-0 rounded px-2 py-0.5 text-[11px] font-medium ${
                  meta?.badgeClass ?? 'bg-gray-100 text-gray-500'
                }`}
              >
                {meta ? t(`interest.${meta.labelKey}`) : application.interestStatus}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
