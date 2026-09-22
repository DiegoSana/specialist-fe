'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getUser, isAuthenticated } from '@/lib/auth';
import { useRequest, useCancelRequest, useStartRequest } from '@/hooks/use-requests';
import { useCreateReview, useReviewByRequestId } from '@/hooks/use-reviews';
import { RequestStatus } from '@/types';
import { getPrimaryAction, REQUEST_STATUS_META } from '@/lib/request-status';
import { getCounterpart } from '@/lib/request-participants';
import AppLayout from '@/components/layout/app-layout';
import RequestTimeline from '@/components/requests/request-timeline';
import ReviewCtaCard from '@/components/requests/review-cta-card';
import ReceivedRatingCard from '@/components/requests/received-rating-card';
import RequestDetailHeader from '@/components/requests/request-detail-header';
import RequestSummaryCard from '@/components/requests/request-summary-card';
import RequestPrimaryAction from '@/components/requests/request-primary-action';
import ContactCard from '@/components/requests/contact-card';
import ReportProblem from '@/components/requests/report-problem';
import InterestedSpecialists from '@/components/requests/interested-specialists';
import RequestPhotosSection from '@/components/requests/request-photos-section';

const CONTACT_STATUSES: RequestStatus[] = [
  RequestStatus.CONTACT_RELEASED,
  RequestStatus.IN_PROGRESS,
  RequestStatus.FINISHED,
  RequestStatus.UNDER_REVIEW,
  RequestStatus.CLOSED,
];

export default function RequestDetailPage() {
  const t = useTranslations('client.requestDetail');
  const tDetail = useTranslations('requestStatus.detail');
  const tActions = useTranslations('requestStatus.actions');
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const user = getUser();
  const requestId = params.id as string;
  const locale = pathname?.split('/')[1] || 'es';

  const { data: request, isLoading } = useRequest(requestId);
  const { data: existingReview } = useReviewByRequestId(requestId);
  const createReview = useCreateReview();
  const cancel = useCancelRequest();
  const start = useStartRequest();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  useEffect(() => {
    if (!isAuthenticated() || !user) {
      router.push(`/${locale}/login`);
    }
  }, [router, user, locale]);

  if (!user) return null;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (!request) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold text-gray-800">{t('notFound')}</h2>
            <Link href={`/${locale}/client/dashboard`} className="text-blue-600 hover:text-blue-700">
              {t('backToDashboard')}
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const meta = REQUEST_STATUS_META[request.status];
  const counterpart = getCounterpart(request, 'client');
  const contactReleased = CONTACT_STATUSES.includes(request.status) && !!request.providerId;
  const canCancel = (
    [RequestStatus.DRAFT, RequestStatus.PUBLISHED, RequestStatus.SENT] as RequestStatus[]
  ).includes(request.status);
  const showInterests = request.isPublic && !request.providerId && request.status === RequestStatus.PUBLISHED;
  const canManagePhotos = !meta.isFinalNoAgreement && request.status !== RequestStatus.CLOSED;
  const primary = getPrimaryAction(request.status, 'client', { interestCount: request.interestsCount });
  const showActionCard = primary === 'CONFIRM_OBJECT' || primary === 'REPUBLISH';
  const firstName = counterpart.name?.split(' ')[0] ?? '';

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <RequestDetailHeader
            request={request}
            role="client"
            backHref={`/${locale}/client/dashboard`}
            backLabel={tDetail('backClient')}
            dateLabel={tDetail('createdOn', { date: new Date(request.createdAt).toLocaleDateString() })}
          />

          <div className="grid items-start gap-6 lg:grid-cols-3">
            {/* min-w-0: grid items default to min-width:auto (their content's min-content size),
                so without it long-but-wrappable content can still force this column - and the
                whole page - wider than the viewport on narrow screens. */}
            <div className="min-w-0 space-y-4 lg:col-span-2">
              <RequestSummaryCard
                request={request}
                originTitle={tDetail('requestType')}
                originLabel={request.isPublic || request.tradeId ? tDetail('typePublic') : tDetail('typeDirect')}
              />

              {showInterests && <InterestedSpecialists requestId={request.id} />}

              <RequestTimeline
                status={request.status}
                createdAt={request.createdAt}
                updatedAt={request.updatedAt}
                isPublic={request.isPublic}
                hasInterestedProfessionals={(request.interestsCount ?? 0) > 0}
                statusReason={request.statusReason}
              />

              {request.status === RequestStatus.CLOSED && request.professional && (
                <ReviewCtaCard
                  hasExistingReview={!!existingReview}
                  existingReview={
                    existingReview
                      ? { rating: existingReview.rating, comment: existingReview.comment }
                      : undefined
                  }
                  onSubmitReview={async (rating, comment) => {
                    await createReview.mutateAsync({
                      professionalId: request.professional!.id,
                      rating,
                      comment: comment || undefined,
                      requestId: request.id,
                    });
                  }}
                  isPending={createReview.isPending}
                  type="client-to-professional"
                  recipientName={`${request.professional.user?.firstName} ${request.professional.user?.lastName}`}
                />
              )}

              {request.status === RequestStatus.CLOSED &&
                existingReview &&
                request.clientRating &&
                request.professional && (
                  <ReceivedRatingCard
                    rating={request.clientRating}
                    comment={request.clientRatingComment}
                    reviewerName={`${request.professional.user?.firstName} ${request.professional.user?.lastName}`}
                    type="from-professional"
                  />
                )}

              <RequestPhotosSection request={request} canManage={canManagePhotos} namespace="client.requestDetail" />
            </div>

            <div className="min-w-0 space-y-3.5">
              {showActionCard && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <RequestPrimaryAction request={request} role="client" locale={locale} variant="detail" />
                  {request.status === RequestStatus.FINISHED && (
                    <p className="mt-2.5 text-xs leading-relaxed text-gray-500">{tDetail('notes.client.FINISHED')}</p>
                  )}
                </div>
              )}

              {meta.isFinalNoAgreement && request.statusReason && (
                <div className="rounded-lg bg-gray-100 px-4 py-3.5">
                  <p className="text-xs font-semibold text-gray-600">{tActions('reasonLabel')}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{request.statusReason}</p>
                </div>
              )}

              <ContactCard counterpart={counterpart} released={contactReleased} accent="green" />

              {tDetail.has(`notes.client.${request.status}`) && request.status !== RequestStatus.FINISHED && (
                <div className="rounded-lg bg-gray-100 px-4 py-3.5">
                  <p className="text-xs leading-relaxed text-gray-600">
                    {tDetail(`notes.client.${request.status}`, { name: firstName })}
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

              <ReportProblem request={request} role="client" />

              {canCancel && (
                <div>
                  {!confirmingCancel ? (
                    <button
                      type="button"
                      onClick={() => setConfirmingCancel(true)}
                      className="w-full rounded-lg border border-red-300 py-2.5 text-[13px] text-red-600 hover:bg-red-50"
                    >
                      {t('cancel')}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmingCancel(false)}
                        className="rounded-lg border border-gray-300 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50"
                      >
                        {t('no')}
                      </button>
                      <button
                        type="button"
                        disabled={cancel.isPending}
                        onClick={() =>
                          cancel.mutate({ id: request.id }, { onSuccess: () => router.push(`/${locale}/client/dashboard`) })
                        }
                        className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-[13px] text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {t('confirmCancel')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
