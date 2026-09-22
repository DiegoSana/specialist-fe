'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Request } from '@/types';
import { REQUEST_STATUS_META, RequestRole } from '@/lib/request-status';
import RequestStatusBadge from '@/components/requests/request-status-badge';
import { RepublishButton } from '@/components/requests/request-primary-action';

interface FinalRequestsStripProps {
  requests: Request[];
  role: RequestRole;
  locale: string;
}

/** Collapsed strip at the bottom of the lists for requests that ended without an agreement. */
export default function FinalRequestsStrip({ requests, role, locale }: FinalRequestsStripProps) {
  const t = useTranslations('requestStatus');
  const [open, setOpen] = useState(false);
  if (requests.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left"
      >
        <span className="text-[13px] font-medium text-gray-500">
          {t('finalStrip.title', { count: requests.length })}
        </span>
        <span className="text-xs text-gray-400">
          {open ? '▾' : '▸'} {open ? t('finalStrip.hide') : t('finalStrip.show')}
        </span>
      </button>
      {open && (
        <ul className="divide-y divide-gray-100 border-t border-gray-100">
          {requests.map((request) => (
            <li
              key={request.id}
              data-testid="final-request"
              className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <RequestStatusBadge status={request.status} />
                  <Link
                    href={`/${locale}/${role === 'client' ? 'client' : 'specialist'}/requests/${request.id}`}
                    className="truncate text-sm text-gray-800 hover:text-blue-700"
                  >
                    {request.title || request.description}
                  </Link>
                </div>
                {request.statusReason && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t('actions.reasonLabel')}: {request.statusReason}
                  </p>
                )}
              </div>
              {role === 'client' && REQUEST_STATUS_META[request.status]?.canRepublish && (
                <RepublishButton request={request} locale={locale} className="flex-shrink-0" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
