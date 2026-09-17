'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getUser, isAuthenticated } from '@/lib/auth';
import { useRequest, useUpdateRequest, useExpressInterest, useRemoveInterest, useMyInterest, useRateClient } from '@/hooks/use-requests';
import { useReviewByRequestId } from '@/hooks/use-reviews';
import { useAddRequestPhoto, useRemoveRequestPhoto } from '@/hooks/use-completed-work-photos';
import { useUploadFile } from '@/hooks/use-file-upload';
import { RequestStatus } from '@/types';
import AppLayout from '@/components/layout/app-layout';
import AuthenticatedImage from '@/components/images/authenticated-image';
import AuthenticatedVideo from '@/components/videos/authenticated-video';
import RequestTimeline from '@/components/requests/request-timeline';
import ReviewCtaCard from '@/components/requests/review-cta-card';
import ReceivedRatingCard from '@/components/requests/received-rating-card';
import RequestPhotosLightbox from '@/components/requests/request-photos-lightbox';

export default function SpecialistRequestDetailPage() {
  const t = useTranslations('specialist.requestDetail');
  const tProfileActive = useTranslations('profileActive');
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const user = getUser();
  const requestId = params.id as string;

  const { data: request, isLoading } = useRequest(requestId);
  const { data: clientReview } = useReviewByRequestId(requestId);
  const updateRequestMutation = useUpdateRequest();
  const uploadFileMutation = useUploadFile();
  const addRequestPhotoMutation = useAddRequestPhoto();
  const removeRequestPhotoMutation = useRemoveRequestPhoto();
  const rateClientMutation = useRateClient();
  const expressInterestMutation = useExpressInterest();
  const removeInterestMutation = useRemoveInterest();
  const { data: myInterest } = useMyInterest(requestId);

  const [showInterestForm, setShowInterestForm] = useState(false);
  const [interestMessage, setInterestMessage] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isProfileInactiveError, setIsProfileInactiveError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!isAuthenticated() || !user) {
      const locale = pathname?.split('/')[1] || 'es';
      router.push(`/${locale}/login`);
    } else if (!user.hasProfessionalProfile) {
      const locale = pathname?.split('/')[1] || 'es';
      router.push(`/${locale}/specialist/setup`);
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

  const handleExpressInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsProfileInactiveError(false);

    if (!request) return;

    try {
      await expressInterestMutation.mutateAsync({
        requestId: request.id,
        data: interestMessage ? { message: interestMessage } : undefined,
      });
      setShowInterestForm(false);
      setInterestMessage('');
    } catch (error: any) {
      const msg = error.response?.data?.message as string | undefined;
      const lower = (msg || '').toLowerCase();
      const isProfileInactive =
        !!msg &&
        ((lower.includes('active') && lower.includes('interest')) ||
          (lower.includes('verify') && (lower.includes('email') || lower.includes('phone'))));
      setErrors({
        general: isProfileInactive
          ? tProfileActive('expressInterestMessage')
          : msg || t('errors.general'),
      });
      setIsProfileInactiveError(isProfileInactive);
    }
  };

  const handleRemoveInterest = async () => {
    if (!request) return;

    try {
      await removeInterestMutation.mutateAsync(request.id);
    } catch (error: any) {
      setErrors({
        general: error.response?.data?.message || t('errors.general'),
      });
    }
  };

  const handleMarkInProgress = async () => {
    if (!request) return;

    try {
      await updateRequestMutation.mutateAsync({
        id: request.id,
        data: {
          status: RequestStatus.IN_PROGRESS,
        },
      });
    } catch (error) {
      console.error('Error marking as in progress:', error);
    }
  };

  const handleMarkCompleted = async () => {
    if (!request) return;

    try {
      await updateRequestMutation.mutateAsync({
        id: request.id,
        data: {
          status: RequestStatus.DONE,
        },
      });
    } catch (error) {
      console.error('Error marking as completed:', error);
    }
  };

  const handleAcceptDirectRequest = async () => {
    if (!request) return;

    try {
      await updateRequestMutation.mutateAsync({
        id: request.id,
        data: {
          status: RequestStatus.ACCEPTED,
        },
      });
    } catch (error: any) {
      setErrors({
        general: error.response?.data?.message || t('errors.general'),
      });
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
              href="/specialist/dashboard"
              className="text-blue-600 hover:text-blue-700"
            >
              {t('backToDashboard')}
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  // For public requests that are still pending and not yet assigned to this professional
  const isPublicRequest = request.isPublic;
  const hasAlreadyExpressedInterest = myInterest?.hasInterest === true;
  const canExpressInterest = isPublicRequest && request.status === RequestStatus.PENDING && !request.professionalId;
  
  // For requests assigned to this professional
  const canMarkInProgress = request.status === RequestStatus.ACCEPTED;
  const canMarkCompleted = request.status === RequestStatus.IN_PROGRESS;
  
  // For direct requests - professional can accept
  const isDirectRequest = !isPublicRequest && request.professionalId;
  const canAcceptDirectRequest = isDirectRequest && request.status === RequestStatus.PENDING;
  
  const locale = pathname?.split('/')[1] || 'es';

  return (
    <>
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/${locale}/specialist/dashboard`}
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
            {request?.title || t('title')}
          </h1>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Timeline Progress Bar */}
          <RequestTimeline 
            status={request.status} 
            createdAt={request.createdAt} 
            updatedAt={request.updatedAt} 
          />

          {/* Rate Client - Prominent CTA when request is DONE */}
          {request.status === RequestStatus.DONE && request.client && (
            <ReviewCtaCard
              hasExistingReview={request.clientRating !== null && request.clientRating !== undefined}
              existingReview={request.clientRating ? {
                rating: request.clientRating,
                comment: request.clientRatingComment,
              } : undefined}
              onSubmitReview={async (rating, comment) => {
                try {
                  await rateClientMutation.mutateAsync({
                    requestId: request.id,
                    rating,
                    comment: comment || undefined,
                  });
                } catch (error: any) {
                  console.error('Error rating client:', error);
                  throw error;
                }
              }}
              isPending={rateClientMutation.isPending}
              type="professional-to-client"
              recipientName={`${request.client.firstName} ${request.client.lastName}`}
            />
          )}

          {/* Show rating received from client - only when both have rated */}
          {request.status === RequestStatus.DONE && 
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

          {/* Client Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {t('client')}
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">
                <span className="font-medium">{t('requestFrom')}:</span>{' '}
                {request.client
                  ? `${request.client.firstName} ${request.client.lastName}`
                  : request.clientId}
              </p>
              {request.client && (
                <p className="text-gray-500 text-xs">
                  {request.client.email}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {t('description')}
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {request.description}
            </p>
          </div>

          {/* Address */}
          {request.address && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {t('address')}
              </h2>
              <p className="text-gray-700">{request.address}</p>
            </div>
          )}

          {/* Availability */}
          {request.availability && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {t('availability')}
              </h2>
              <p className="text-gray-700">{request.availability}</p>
            </div>
          )}

          {/* Photos */}
          {request.photos && request.photos.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {t('photos')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {request.photos.map((photo, index) => (
                  photo.match(/\.(mp4|webm|ogg)$/i) ? (
                    <AuthenticatedVideo
                      key={index}
                      src={photo}
                      className="w-full h-48 object-cover rounded-lg"
                      controls
                      muted
                      playsInline
                    />
                  ) : (
                    <AuthenticatedImage
                      key={index}
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        setLightboxIndex(index);
                        setLightboxOpen(true);
                      }}
                    />
                  )
                ))}
              </div>
            </div>
          )}

          {/* Interest Section - For public requests */}
          {canExpressInterest && (
            hasAlreadyExpressedInterest ? (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800">{t('interestExpressed')}</h3>
                    <p className="text-sm text-green-600">{t('interestExpressedDescription')}</p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveInterest}
                  disabled={removeInterestMutation.isPending}
                  className="text-sm text-red-600 hover:text-red-700 underline disabled:opacity-50"
                >
                  {removeInterestMutation.isPending ? t('removing') : t('removeInterest')}
                </button>
              </div>
            ) : showInterestForm ? (
              <div className="bg-white rounded-xl border-2 border-blue-200 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
                  <h3 className="text-lg font-bold text-white">{t('expressInterestTitle')}</h3>
                </div>
                <form onSubmit={handleExpressInterest} className="p-6 space-y-4">
                  {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">{errors.general}</p>
                      {isProfileInactiveError && (
                        <Link
                          href={`/${pathname?.split('/')[1] || 'es'}/profile`}
                          className="inline-block mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {tProfileActive('goToProfile')} →
                        </Link>
                      )}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="interestMessage"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {t('messageOptional')}
                    </label>
                    <textarea
                      id="interestMessage"
                      rows={4}
                      value={interestMessage}
                      onChange={(e) => setInterestMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                      placeholder={t('messagePlaceholder')}
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowInterestForm(false);
                        setInterestMessage('');
                        setErrors({});
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={expressInterestMutation.isPending}
                      className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {expressInterestMutation.isPending ? t('sending') : t('confirmInterest')}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl p-6 shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
                
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {t('interestedInJob')}
                      </h3>
                      <p className="text-white/90 text-sm mb-4">
                        {t('interestedDescription')}
                      </p>
                      
                      <button
                        onClick={() => setShowInterestForm(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors shadow-md hover:shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {t('expressInterest')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Accept Direct Request Section */}
          {canAcceptDirectRequest && (
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-xl p-6 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
              
              <div className="relative z-10">
                {errors.general && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {t('directRequestReceived')}
                    </h3>
                    <p className="text-white/90 text-sm mb-4">
                      {t('directRequestDescription')}
                    </p>
                    
                    <button
                      onClick={handleAcceptDirectRequest}
                      disabled={updateRequestMutation.isPending}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {updateRequestMutation.isPending ? t('accepting') : t('acceptRequest')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions - Only show when professional is assigned */}
          {(canMarkInProgress || canMarkCompleted) && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {t('actions')}
            </h2>
            <div className="flex flex-col gap-3">
              {canMarkInProgress && (
                <button
                  onClick={handleMarkInProgress}
                  disabled={updateRequestMutation.isPending}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateRequestMutation.isPending ? t('updating') : t('markInProgress')}
                </button>
              )}

              {canMarkCompleted && (
                <button
                  onClick={handleMarkCompleted}
                  disabled={updateRequestMutation.isPending}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateRequestMutation.isPending ? t('updating') : t('markCompleted')}
                </button>
              )}

              {request.status === RequestStatus.DONE && (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-green-50/20 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      {t('completedMessage')}
                    </p>
                  </div>

                  {/* Photos Section */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      {t('photos')}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
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
                            setErrors({
                              general: error.response?.data?.message || t('uploadError'),
                            });
                          }
                        }}
                        className="hidden"
                        id="completed-work-upload"
                      />
                      <label
                        htmlFor="completed-work-upload"
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
                                alt={`Completed work ${index + 1}`}
                                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => {
                                  setLightboxIndex(index);
                                  setLightboxOpen(true);
                                }}
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
                                  setErrors({
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
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">{t('noPhotos')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </AppLayout>
    {request?.photos && request.photos.length > 0 && (
      <RequestPhotosLightbox
        photos={request.photos}
        open={lightboxOpen}
        index={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    )}
    </>
  );
}

