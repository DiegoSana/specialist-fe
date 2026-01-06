'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getUser, isAuthenticated } from '@/lib/auth';
import { useRequest, useUpdateRequest, useUpdateRequestByClient, useRequestInterests, useAssignProfessional } from '@/hooks/use-requests';
import { useCreateReview, useReviewByRequestId } from '@/hooks/use-reviews';
import { RequestInterest } from '@/types';
import { useAddRequestPhoto, useRemoveRequestPhoto } from '@/hooks/use-completed-work-photos';
import { useUploadFile } from '@/hooks/use-file-upload';
import { RequestStatus } from '@/types';
import AppLayout from '@/components/layout/app-layout';
import AuthenticatedImage from '@/components/images/authenticated-image';
import AuthenticatedVideo from '@/components/videos/authenticated-video';
import RequestTimeline from '@/components/requests/request-timeline';
import ReviewCtaCard from '@/components/requests/review-cta-card';
import ReceivedRatingCard from '@/components/requests/received-rating-card';

export default function RequestDetailPage() {
  const t = useTranslations('client.requestDetail');
  const tInterest = useTranslations('client.requestDetail.interests');
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const user = getUser();
  const requestId = params.id as string;

  const { data: request, isLoading } = useRequest(requestId);
  const { data: existingReview } = useReviewByRequestId(requestId);
  const { data: interestedProfessionals, isLoading: isLoadingInterests } = useRequestInterests(requestId);
  const updateRequestByClientMutation = useUpdateRequestByClient();
  const createReviewMutation = useCreateReview();
  const assignProfessionalMutation = useAssignProfessional();
  const uploadFileMutation = useUploadFile();
  const addRequestPhotoMutation = useAddRequestPhoto();
  const removeRequestPhotoMutation = useRemoveRequestPhoto();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [assigningProfessionalId, setAssigningProfessionalId] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
  });
  const [reviewErrors, setReviewErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!isAuthenticated() || !user) {
      const locale = pathname?.split('/')[1] || 'es';
      router.push(`/${locale}/login`);
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

  const handleCancel = async () => {
    if (!request) return;

    try {
      await updateRequestByClientMutation.mutateAsync({
        id: request.id,
        data: {
          status: RequestStatus.CANCELLED,
        },
      });
      setShowCancelConfirm(false);
      const locale = pathname?.split('/')[1] || 'es';
      router.push(`/${locale}/client/dashboard`);
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (!request) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('notFound')}
            </h2>
            <Link
              href="/client/dashboard"
              className="text-blue-600 hover:text-blue-700"
            >
              {t('backToDashboard')}
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const canCancel = request.status !== RequestStatus.DONE && request.status !== RequestStatus.CANCELLED;
  const canReview = request.status === RequestStatus.DONE && request.professionalId && !existingReview;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewErrors({});

    if (!request || !request.professionalId) return;

    try {
      await createReviewMutation.mutateAsync({
        professionalId: request.professionalId,
        rating: reviewData.rating,
        comment: reviewData.comment || undefined,
        requestId: request.id,
      });
      setShowReviewForm(false);
      setReviewData({ rating: 5, comment: '' });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '';
      let translatedError = t('reviewErrors.general');
      
      // Map backend error messages to translated messages
      if (errorMessage.includes('Only clients can create reviews')) {
        translatedError = t('reviewErrors.onlyClients');
      } else if (errorMessage.includes('already reviewed')) {
        translatedError = t('reviewErrors.alreadyReviewed');
      } else if (errorMessage.includes('Request not found')) {
        translatedError = t('reviewErrors.requestNotFound');
      } else if (errorMessage.includes('only review requests you created')) {
        translatedError = t('reviewErrors.notRequestOwner');
      } else if (errorMessage.includes('must be completed before reviewing')) {
        translatedError = t('reviewErrors.requestNotCompleted');
      } else if (errorMessage.includes('already has a review')) {
        translatedError = t('reviewErrors.requestAlreadyReviewed');
      } else if (errorMessage.includes('Professional not found')) {
        translatedError = t('reviewErrors.professionalNotFound');
      }
      
      setReviewErrors({
        general: translatedError,
      });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/client/dashboard"
            className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t('back')}
          </Link>
          <h1 className="text-2xl font-bold mt-2 text-gray-800">
            {t('title')}
          </h1>
        </div>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Timeline Progress Bar */}
          <RequestTimeline 
            status={request.status} 
            createdAt={request.createdAt} 
            updatedAt={request.updatedAt} 
          />

          {/* Review Section - Prominent CTA when request is DONE */}
          {request.status === RequestStatus.DONE && request.professional && (
            <ReviewCtaCard
              hasExistingReview={!!existingReview}
              existingReview={existingReview ? {
                rating: existingReview.rating,
                comment: existingReview.comment,
              } : undefined}
              onSubmitReview={async (rating, comment) => {
                try {
                  await createReviewMutation.mutateAsync({
                    professionalId: request.professional!.id,
                    rating,
                    comment: comment || undefined,
                    requestId: request.id,
                  });
                } catch (error: any) {
                  console.error('Error creating review:', error);
                  throw error;
                }
              }}
              isPending={createReviewMutation.isPending}
              type="client-to-professional"
              recipientName={`${request.professional.user?.firstName} ${request.professional.user?.lastName}`}
            />
          )}

          {/* Show rating received from specialist - only when both have rated */}
          {request.status === RequestStatus.DONE && 
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

          {/* Status and Professional Info - Combined */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Status Section */}
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-1">
                  {t('requestStatus')}
                </h2>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                    request.status
                  )}`}
                >
                  {getStatusLabel(request.status)}
                </span>
              </div>

              {/* Professional Info Section */}
              {request.professional && (
                <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-4">
                  <div className="flex-1">
                    <h2 className="text-sm font-medium text-gray-500 mb-1">
                      {t('professional')}
                    </h2>
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {request.professional.user?.firstName}{' '}
                          {request.professional.user?.lastName}
                        </h3>
                        {request.professional.trades && request.professional.trades.length > 0 && (
                          <p className="text-sm text-gray-500">
                            {request.professional.trades.map((t) => t.name).join(', ')}
                          </p>
                        )}
                        {request.professional.averageRating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-yellow-500 text-xs">★</span>
                            <span className="text-xs text-gray-500">
                              {request.professional.averageRating.toFixed(1)} (
                              {request.professional.totalReviews} {t('reviews')})
                            </span>
                          </div>
                        )}
                      </div>
                      {request.professional.whatsapp && (
                        <a
                          href={`https://wa.me/${request.professional.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          {t('contactWhatsApp')}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Public Request - No professional assigned yet */}
              {request.isPublic && !request.professionalId && request.status === RequestStatus.PENDING && (
                <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-4">
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {tInterest('publicRequest')}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {tInterest('waitingForInterest')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interested Specialists Section - Only for public requests without assigned professional */}
          {request.isPublic && !request.professionalId && request.status === RequestStatus.PENDING && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {tInterest('title')}
              </h2>
              
              {isLoadingInterests ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : interestedProfessionals && interestedProfessionals.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-4">
                    {tInterest('description')}
                  </p>
                  {interestedProfessionals.map((interest: any) => (
                    <div
                      key={interest.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                            {interest.professional?.user?.profilePictureUrl ? (
                              <img
                                src={interest.professional.user.profilePictureUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {interest.professional?.user?.firstName} {interest.professional?.user?.lastName}
                            </h3>
                            {interest.professional?.trades && interest.professional.trades.length > 0 && (
                              <p className="text-sm text-gray-500">
                                {interest.professional.trades.map((t: any) => t.name).join(', ')}
                              </p>
                            )}
                            {interest.professional?.averageRating > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-yellow-500 text-sm">★</span>
                                <span className="text-sm text-gray-500">
                                  {interest.professional.averageRating.toFixed(1)} ({interest.professional.totalReviews} {t('reviews')})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {interest.professional?.whatsapp && (
                            <a
                              href={`https://wa.me/${interest.professional.whatsapp.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
                            >
                              WhatsApp
                            </a>
                          )}
                          <button
                            onClick={async () => {
                              setAssigningProfessionalId(interest.professionalId);
                              try {
                                await assignProfessionalMutation.mutateAsync({
                                  requestId,
                                  professionalId: interest.professionalId,
                                });
                              } catch (error) {
                                console.error('Error assigning professional:', error);
                              } finally {
                                setAssigningProfessionalId(null);
                              }
                            }}
                            disabled={assignProfessionalMutation.isPending}
                            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                          >
                            {assigningProfessionalId === interest.professionalId ? (
                              <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                {tInterest('assigning')}
                              </span>
                            ) : (
                              tInterest('assign')
                            )}
                          </button>
                        </div>
                      </div>
                      {interest.message && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 italic">&ldquo;{interest.message}&rdquo;</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {tInterest('interestedSince')} {new Date(interest.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    {tInterest('noInterested')}
                  </h3>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto">
                    {tInterest('noInterestedDescription')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {t('description')}
              </h2>
              <p className="text-sm text-gray-500">
                {t('created')}: {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">
              {request.description}
            </p>
          </div>

          {/* Quote Information */}
          {request.quoteAmount !== null && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {t('quote')}
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">{t('amount')}:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${request.quoteAmount?.toLocaleString() || '0'}
                  </span>
                </div>
                {request.quoteNotes && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {t('notes')}:
                    </p>
                    <p className="text-gray-500 whitespace-pre-wrap">
                      {request.quoteNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages Section - Placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {t('messages')}
            </h2>
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">{t('messagesNote')}</p>
            </div>
          </div>

          {/* Photos Section */}
          {request.status !== RequestStatus.CANCELLED && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {t('photos')}
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                {t('photosDescription')}
              </p>

              {/* Upload Photo */}
              <div className="mb-4">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    try {
                      const category = 'request-photo';
                      const fileResponse = await uploadFileMutation.mutateAsync({
                        file,
                        category,
                        requestId: requestId,
                      });

                      await addRequestPhotoMutation.mutateAsync({
                        requestId,
                        url: fileResponse.url,
                      });
                      e.target.value = '';
                    } catch (error: any) {
                      setReviewErrors({
                        general: error.response?.data?.message || t('uploadError'),
                      });
                    }
                  }}
                  className="hidden"
                  id="request-photo-upload"
                />
                <label
                  htmlFor="request-photo-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('addPhoto')}
                </label>
              </div>

              {/* Display Photos */}
              {request.photos && request.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {request.photos.map((url, index) => (
                    <div key={index} className="relative group aspect-square overflow-hidden rounded-lg bg-gray-200">
                      {url.match(/\.(mp4|webm|ogg)$/i) ? (
                        <AuthenticatedVideo
                          src={url}
                          className="w-full h-full object-cover"
                          controls
                          muted
                          playsInline
                        />
                      ) : (
                        <AuthenticatedImage
                          src={url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(url, '_blank')}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <button
                        onClick={async () => {
                          try {
                            await removeRequestPhotoMutation.mutateAsync({
                              requestId,
                              url,
                            });
                          } catch (error: any) {
                            setReviewErrors({
                              general: error.response?.data?.message || t('removeError'),
                            });
                          }
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                        title={t('removePhoto')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">{t('noPhotos')}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {canCancel && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex gap-4">
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    {t('cancel')}
                  </button>
                ) : (
                  <div className="flex-1 flex gap-2">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      {t('no')}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={updateRequestByClientMutation.isPending}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {t('confirmCancel')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

