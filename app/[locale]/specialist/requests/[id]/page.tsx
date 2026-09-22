'use client';

import { usePathname, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRequest, useRateClient, useStartRequest } from '@/hooks/use-requests';
import { useReviewByRequestId } from '@/hooks/use-reviews';
import { RequestStatus } from '@/types';
import { getPrimaryAction, REQUEST_STATUS_META } from '@/lib/request-status';
import { getCounterpart } from '@/lib/request-participants';
import ProtectedLayout from '@/components/layout/protected-layout';
import RequestTimeline from '@/components/requests/request-timeline';
import ReviewCtaCard from '@/components/requests/review-cta-card';
import ReceivedRatingCard from '@/components/requests/received-rating-card';
import RequestDetailHeader from '@/components/requests/request-detail-header';
import RequestSummaryCard from '@/components/requests/request-summary-card';
import RequestPrimaryAction from '@/components/requests/request-primary-action';
import ContactCard from '@/components/requests/contact-card';
import ReportProblem from '@/components/requests/report-problem';
import ExpressInterestCard from '@/components/requests/express-interest-card';
import RequestPhotosSection from '@/components/requests/request-photos-section';

const CONTACT_STATUSES: RequestStatus[] = [
  RequestStatus.CONTACT_RELEASED,
  RequestStatus.IN_PROGRESS,
  RequestStatus.FINISHED,
  RequestStatus.UNDER_REVIEW,
  RequestStatus.CLOSED,
];

export default function SpecialistRequestDetailPage() {
  const t = useTranslations('specialist.requestDetail');
  const tDetail = useTranslations('requestStatus.detail');
  const tActions = useTranslations('requestStatus.actions');
  const pathname = usePathname();
  const params = useParams();
  const requestId = params.id as string;
  const locale = pathname?.split('/')[1] || 'es';

  const { data: request, isLoading } = useRequest(requestId);
  const { data: clientReview } = useReviewByRequestId(requestId);
  const rateClient = useRateClient();
  const start = useStartRequest();

  if (isLoading) {
    return (
      <ProtectedLayout requiredProfileType="provider" noProfileRedirectPath={`/${locale}/specialist/setup`}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      </ProtectedLayout>
    );
  }

  if (!request) {
    return (
      <ProtectedLayout requiredProfileType="provider" noProfileRedirectPath={`/${locale}/specialist/setup`}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold text-gray-800">{t('notFound')}</h2>
            <Link href={`/${locale}/specialist/dashboard`} className="text-blue-600 hover:text-blue-700">
              {t('backToDashboard')}
            </Link>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  const meta = REQUEST_STATUS_META[request.status];
  const counterpart = getCounterpart(request, 'provider');
  const contactReleased = CONTACT_STATUSES.includes(request.status);
  const primary = getPrimaryAction(request.status, 'provider');
  const showActionCard = primary === 'ACCEPT_REJECT' || primary === 'MARK_FINISHED';
  const canExpressInterest =
    request.isPublic && request.status === RequestStatus.PUBLISHED && !request.providerId;
  const canManagePhotos = !meta.isFinalNoAgreement && request.status !== RequestStatus.CLOSED;
  const firstName = counterpart.name?.split(' ')[0] ?? '';
  const isDirect = !request.isPublic;

  return (
    <ProtectedLayout requiredProfileType="provider" noProfileRedirectPath={`/${locale}/specialist/setup`}>
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <RequestDetailHeader
            request={request}
            role="provider"
            backHref={`/${locale}/specialist/dashboard`}
            backLabel={tDetail('backSpecialist')}
            dateLabel={tDetail('receivedOn', { date: new Date(request.createdAt).toLocaleDateString() })}
          />

          <div className="grid items-start gap-6 lg:grid-cols-3">
            {/* min-w-0: grid items default to min-width:auto (their content's min-content size),
                so without it long-but-wrappable content can still force this column - and the
                whole page - wider than the viewport on narrow screens. */}
            <div className="min-w-0 space-y-4 lg:col-span-2">
              <RequestSummaryCard
                request={request}
                originTitle={tDetail('howItArrived')}
                originLabel={
                  isDirect
                    ? tDetail('originDirect', { name: counterpart.name ?? '' })
                    : tDetail('originPublic')
                }
              />

              {canExpressInterest && <ExpressInterestCard request={request} />}

              <RequestTimeline
                status={request.status}
                createdAt={request.createdAt}
                updatedAt={request.updatedAt}
                statusReason={request.statusReason}
              />

              {request.status === RequestStatus.CLOSED && request.client && (
                <ReviewCtaCard
                  hasExistingReview={request.clientRating !== null && request.clientRating !== undefined}
                  existingReview={
                    request.clientRating
                      ? { rating: request.clientRating, comment: request.clientRatingComment }
                      : undefined
                  }
                  onSubmitReview={async (rating, comment) => {
                    await rateClient.mutateAsync({
                      requestId: request.id,
                      rating,
                      comment: comment || undefined,
                    });
                  }}
                  isPending={rateClient.isPending}
                  type="professional-to-client"
                  recipientName={`${request.client.firstName} ${request.client.lastName}`}
                />
              )}

              {request.status === RequestStatus.CLOSED &&
                request.clientRating &&
                clientReview &&
                request.client && (
                  <ReceivedRatingCard
                    rating={clientReview.rating}
                    comment={clientReview.comment}
                    reviewerName={`${request.client.firstName} ${request.client.lastName}`}
                    type="from-client"
                  />
                )}

              <RequestPhotosSection
                request={request}
                canManage={canManagePhotos && !!request.providerId}
                namespace="specialist.requestDetail"
              />
            </div>

            <div className="min-w-0 space-y-3.5">
              {showActionCard && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <RequestPrimaryAction request={request} role="provider" locale={locale} variant="detail" />
                  <p className="mt-2.5 text-xs leading-relaxed text-gray-500">
                    {tDetail(`notes.provider.${request.status}`, { name: counterpart.name ?? '' })}
                  </p>
                </div>
              )}

              {meta.isFinalNoAgreement && request.statusReason && (
                <div className="rounded-lg bg-gray-100 px-4 py-3.5">
                  <p className="text-xs font-semibold text-gray-600">{tActions('reasonLabel')}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{request.statusReason}</p>
                </div>
              )}

              <ContactCard counterpart={counterpart} released={contactReleased} accent="blue" />

              {tDetail.has(`notes.provider.${request.status}`) && !showActionCard && (
                <div className="rounded-lg bg-gray-100 px-4 py-3.5">
                  <p className="text-xs leading-relaxed text-gray-600">
                    {tDetail(`notes.provider.${request.status}`, { name: firstName })}
                  </p>
                </div>
              )}

              {request.status === RequestStatus.CONTACT_RELEASED && (
                <button
                  type="button"
                  disabled={start.isPending}
                  onClick={() => start.mutate({ id: request.id })}
                  className="w-full rounded-lg border border-blue-300 bg-white py-2.5 text-[13px] font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                >
                  {tActions('startWork')}
                </button>
              )}

              <ReportProblem request={request} role="provider" />
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
