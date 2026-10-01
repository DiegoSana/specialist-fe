'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Request, RequestStatus } from '@/types';
import { getCounterpart } from '@/lib/request-participants';
import { getClosedReviewState, getHintKey, getRequestBucket, RequestRole } from '@/lib/request-status';
import RequestStatusBadge from '@/components/requests/request-status-badge';
import RequestPrimaryAction from '@/components/requests/request-primary-action';

interface RequestListCardProps {
  request: Request;
  role: RequestRole;
  locale: string;
}

/** Card used by both dashboards: state, whose turn it is, and ONE primary action for the viewer. */
export default function RequestListCard({ request, role, locale }: RequestListCardProps) {
  const t = useTranslations('requestStatus');
  const tCard = useTranslations('requestStatus.card');
  const interestCount = request.interestsCount ?? 0;
  const bucket = getRequestBucket(request.status, role, { interestCount });
  const hintKey = getHintKey(request.status, role, { interestCount });
  const isYours = bucket === 'yours';
  // Closed requests get a review-state-aware hint instead of the static "dejá tu calificación":
  // not yet rated by the viewer (default hint text, unchanged) / rated and waiting on the other
  // side / both rated (show the rating the viewer received instead of a CTA).
  const closedReviewState =
    request.status === RequestStatus.CLOSED ? getClosedReviewState(request) : null;
  const counterpart = getCounterpart(request, role);
  const href = `/${locale}/${role === 'client' ? 'client' : 'specialist'}/requests/${request.id}`;
  const showInterests =
    role === 'client' && request.status === RequestStatus.PUBLISHED && interestCount > 0;

  return (
    <div
      data-testid="request-card"
      data-status={request.status}
      className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <RequestStatusBadge status={request.status} />
        <span className="text-xs text-gray-400">
          {new Date(request.createdAt).toLocaleDateString()}
        </span>
      </div>

      {role === 'provider' && counterpart.name && (
        <p className="mt-3 text-xs text-gray-500">
          {tCard('requestFrom')} {counterpart.name}
        </p>
      )}
      <Link
        href={href}
        className={`${role === 'provider' && counterpart.name ? 'mt-1' : 'mt-3'} text-sm font-medium leading-snug text-gray-800 hover:text-blue-700 line-clamp-2`}
      >
        {request.title || request.description}
      </Link>
      {role === 'client' && counterpart.name && (
        <p className="mt-1 text-xs text-gray-600">
          {tCard('with')} {counterpart.name}
        </p>
      )}
      {showInterests && (
        <p className="mt-1 text-xs text-gray-600">{t('interestedCount', { count: interestCount })}</p>
      )}

      <div className="mb-3 mt-2 flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${isYours ? 'bg-blue-600' : 'bg-gray-400'}`}
        />
        <span
          data-testid="status-hint"
          className={`text-xs font-medium ${isYours ? 'text-blue-600' : 'text-gray-500'}`}
        >
          {closedReviewState?.kind === 'WAITING_COUNTERPART' ? (
            t(`hints.${role === 'client' ? 'client' : 'provider'}.CLOSED_WAITING_COUNTERPART`)
          ) : closedReviewState?.kind === 'REVIEWED' ? (
            <span data-testid="closed-received-rating">
              {t(`hints.${role === 'client' ? 'client' : 'provider'}.CLOSED_RATED`)}{' '}
              {'★'.repeat(closedReviewState.counterpartRating)}
              {'☆'.repeat(5 - closedReviewState.counterpartRating)}
            </span>
          ) : (
            t(`hints.${role === 'client' ? 'client' : 'provider'}.${hintKey}`)
          )}
        </span>
      </div>

      <div className="mt-auto">
        <RequestPrimaryAction request={request} role={role} locale={locale} />
      </div>
    </div>
  );
}
