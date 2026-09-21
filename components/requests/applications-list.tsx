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
              className={`flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 transition-shadow hover:shadow-sm ${
                meta?.muted ? 'opacity-60' : ''
              }`}
            >
              <p className="truncate pr-3 text-[13px] text-gray-800">
                {application.title || application.description}
              </p>
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
