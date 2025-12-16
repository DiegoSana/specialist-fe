'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getUser, isAuthenticated } from '@/lib/auth';
import { useRequest, useUpdateRequest } from '@/hooks/use-requests';
import { useAddRequestPhoto, useRemoveRequestPhoto } from '@/hooks/use-completed-work-photos';
import { useUploadFile } from '@/hooks/use-file-upload';
import { RequestStatus } from '@/types';
import AppLayout from '@/components/layout/app-layout';
import AuthenticatedImage from '@/components/images/authenticated-image';
import AuthenticatedVideo from '@/components/videos/authenticated-video';

export default function SpecialistRequestDetailPage() {
  const t = useTranslations('specialist.requestDetail');
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const user = getUser();
  const requestId = params.id as string;

  const { data: request, isLoading } = useRequest(requestId);
  const updateRequestMutation = useUpdateRequest();
  const uploadFileMutation = useUploadFile();
  const addRequestPhotoMutation = useAddRequestPhoto();
  const removeRequestPhotoMutation = useRemoveRequestPhoto();

  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteData, setQuoteData] = useState({
    quoteAmount: '',
    quoteNotes: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!quoteData.quoteAmount || parseFloat(quoteData.quoteAmount) <= 0) {
      setErrors({ quoteAmount: t('errors.amountRequired') });
      return;
    }

    if (!request) return;

    try {
      await updateRequestMutation.mutateAsync({
        id: request.id,
        data: {
          quoteAmount: parseFloat(quoteData.quoteAmount),
          quoteNotes: quoteData.quoteNotes || undefined,
        },
      });
      setShowQuoteForm(false);
      setQuoteData({ quoteAmount: '', quoteNotes: '' });
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

  const canSendQuote = request.status === RequestStatus.PENDING && !request.quoteAmount;
  const canMarkInProgress = request.status === RequestStatus.ACCEPTED;
  const canMarkCompleted = request.status === RequestStatus.IN_PROGRESS;
  const locale = pathname?.split('/')[1] || 'es';

  return (
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
            {t('title')}
          </h1>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
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
              <p className="text-sm text-gray-500">
                {t('created')}: {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

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
                      onClick={() => window.open(photo, '_blank')}
                    />
                  )
                ))}
              </div>
            </div>
          )}

          {/* Quote Section */}
          {request.quoteAmount !== null ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {t('quoteSent')}
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
          ) : showQuoteForm ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {t('sendQuote')}
              </h2>
              <form onSubmit={handleSendQuote} className="space-y-4">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="quoteAmount"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t('amount')} *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      id="quoteAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={quoteData.quoteAmount}
                      onChange={(e) => {
                        setQuoteData((prev) => ({ ...prev, quoteAmount: e.target.value }));
                        if (errors.quoteAmount) {
                          const { quoteAmount, ...rest } = errors;
                          setErrors(rest);
                        }
                      }}
                      className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.quoteAmount
                          ? 'border-red-300'
                          : 'border-gray-300'
                      } bg-white text-gray-800`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.quoteAmount && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.quoteAmount}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="quoteNotes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t('notes')}
                  </label>
                  <textarea
                    id="quoteNotes"
                    rows={4}
                    value={quoteData.quoteNotes}
                    onChange={(e) =>
                      setQuoteData((prev) => ({ ...prev, quoteNotes: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                    placeholder={t('notesPlaceholder')}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuoteForm(false);
                      setQuoteData({ quoteAmount: '', quoteNotes: '' });
                      setErrors({});
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={updateRequestMutation.isPending}
                    className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateRequestMutation.isPending ? t('sending') : t('sendQuote')}
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {t('actions')}
            </h2>
            <div className="flex flex-col gap-3">
              {canSendQuote && (
                <button
                  onClick={() => setShowQuoteForm(true)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('sendQuote')}
                </button>
              )}

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
        </div>
      </div>
    </AppLayout>
  );
}

