'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { UnifiedProvider } from '@/hooks/use-providers';
import { useProfessionalReviews } from '@/hooks/use-reviews';
import { isAuthenticated } from '@/lib/auth';

interface ProviderDetailModalProps {
  provider: UnifiedProvider;
  locale: string;
  onClose: () => void;
  /** Hide the "Crear solicitud" CTA — used where the viewer is choosing among providers who
   * already expressed interest, not starting a new request. Defaults to true (original context:
   * the public professionals/companies catalog). */
  showCreateRequestCta?: boolean;
}

/**
 * Full provider profile popup, shared between the public professionals/companies catalog
 * (where it links to "Crear solicitud") and the interested-specialists list on a public
 * request (where that action doesn't apply — see `showCreateRequestCta`).
 */
export default function ProviderDetailModal({
  provider,
  locale,
  onClose,
  showCreateRequestCta = true,
}: ProviderDetailModalProps) {
  const t = useTranslations('professionals');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  const { data: reviews } = useProfessionalReviews(provider.type === 'PROFESSIONAL' ? provider.id : '');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800">{provider.displayName}</h2>
            {provider.type === 'COMPANY' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                Empresa
              </span>
            )}
            {provider.hasVerifiedBadge && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                Verificado
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Provider Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Image */}
            {provider.profileImage && (
              <div>
                <img
                  src={provider.profileImage}
                  alt={provider.displayName}
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('details.info')}</h3>
              <div className="space-y-2 text-sm">
                {provider.trades && provider.trades.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">{t('details.trades')}:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {provider.trades.map((trade) => (
                        <span
                          key={trade.id}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.isPrimary ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {trade.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {provider.type === 'PROFESSIONAL' && provider.experienceYears && (
                  <div>
                    <span className="font-medium text-gray-700">{t('details.experience')}:</span>
                    <span className="ml-2 text-gray-500">
                      {provider.experienceYears} {t('details.years')}
                    </span>
                  </div>
                )}
                {provider.type === 'COMPANY' && provider.employeeCount && (
                  <div>
                    <span className="font-medium text-gray-700">Empleados:</span>
                    <span className="ml-2 text-gray-500">{provider.employeeCount}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">{t('details.location')}:</span>
                  <span className="ml-2 text-gray-500">
                    {provider.city}
                    {provider.zone && `, ${provider.zone}`}
                  </span>
                </div>
                {provider.averageRating > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">{t('details.rating')}:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg ${
                              star <= Math.round(provider.averageRating) ? 'text-yellow-500' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {provider.averageRating.toFixed(1)} ({provider.totalReviews} {t('details.reviews')})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {provider.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('details.description')}</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{provider.description}</p>
            </div>
          )}

          {/* Reviews - Only show for professionals */}
          {provider.type === 'PROFESSIONAL' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t('details.reviews')} ({reviews?.length || 0})
              </h3>
              {reviews && reviews.length > 0 ? (
                isLoggedIn ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-800">
                              {review.reviewer?.firstName} {review.reviewer?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-sm ${star <= review.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-gray-700 mt-2">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Blurred reviews for non-logged users */
                  <div className="relative">
                    <div className="space-y-4 blur-sm select-none pointer-events-none" aria-hidden="true">
                      {reviews.slice(0, 2).map((review) => (
                        <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-gray-800">
                                {review.reviewer?.firstName} {review.reviewer?.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-sm ${star <= review.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                          {review.comment && <p className="text-sm text-gray-700 mt-2">{review.comment}</p>}
                        </div>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
                      <div className="text-center p-6">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-700 font-medium mb-2">{t('reviews.loginRequired.title')}</p>
                        <p className="text-sm text-gray-500 mb-4">{t('reviews.loginRequired.description')}</p>
                        <Link
                          href={`/${locale}/login`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          {t('reviews.loginRequired.button')}
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-gray-500">{t('details.noReviews')}</p>
              )}
            </div>
          )}

          {/* Contact CTA */}
          {showCreateRequestCta && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">{t('contactInfo.title')}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">{t('contactInfo.description')}</p>
              <Link
                href={`/${locale}/client/requests/new?${provider.type === 'PROFESSIONAL' ? 'professionalId' : 'companyId'}=${provider.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('contactInfo.createRequest')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
