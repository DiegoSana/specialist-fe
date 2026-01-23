'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchProviders, UnifiedProvider } from '@/hooks/use-providers';
import { useProfessionalReviews } from '@/hooks/use-reviews';
import AppLayout from '@/components/layout/app-layout';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function ProfessionalsPage() {
  const t = useTranslations('professionals');
  const params = useParams();
  const locale = params.locale as string;

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<UnifiedProvider | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  const { data: providers, isLoading: loadingProviders } = useSearchProviders({
    search: searchTerm || undefined,
    providerType: 'ALL',
  });

  const { data: reviews } = useProfessionalReviews(
    selectedProvider?.type === 'PROFESSIONAL' ? selectedProvider?.id || '' : ''
  );

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleViewDetails = (provider: UnifiedProvider) => {
    setSelectedProvider(provider);
  };

  const handleCloseModal = () => {
    setSelectedProvider(null);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-2">{t('subtitle')}</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('search.title')}</h2>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('search.placeholder')}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-3 text-gray-500 hover:text-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">{t('search.hint')}</p>
        </div>

        {/* Providers Grid */}
        {loadingProviders ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : providers && providers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
              >
                {/* Provider Info */}
                <div className="p-4 flex-1 flex flex-col">
                  {/* Photo and Name */}
                  <div className="flex items-center gap-2 mb-2">
                    {/* Provider Photo */}
                    {(() => {
                      const imageUrl = provider.profileImage || provider.user?.profilePictureUrl;
                      return imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={provider.displayName}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-gray-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      ) : null;
                    })()}
                    {!provider.profileImage && !provider.user?.profilePictureUrl && (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 border-2 border-gray-300">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}
                    {/* Name and Primary Trade */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 className="text-base font-semibold text-gray-800 truncate">
                          {provider.displayName}
                        </h3>
                        {provider.type === 'COMPANY' && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex-shrink-0">
                            Empresa
                          </span>
                        )}
                        {provider.hasVerifiedBadge && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex-shrink-0">
                            ✓
                          </span>
                        )}
                      </div>
                      {provider.trades && provider.trades.length > 0 && (
                        <p className="text-xs text-blue-600 font-medium truncate">
                          {provider.trades.find(t => t.isPrimary)?.name || provider.trades[0].name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  {provider.averageRating > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xs ${
                              star <= Math.round(provider.averageRating)
                                ? 'text-yellow-500'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {provider.averageRating.toFixed(1)} ({provider.totalReviews})
                      </span>
                    </div>
                  )}

                  {/* Additional Trades (if more than one) */}
                  {provider.trades && provider.trades.length > 1 && (
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-1">
                        {provider.trades.slice(1, 3).map((trade) => (
                          <span
                            key={trade.id}
                            className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                          >
                            {trade.name}
                          </span>
                        ))}
                        {provider.trades.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                            +{provider.trades.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-3 mt-auto">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">
                      {provider.city}
                      {provider.zone && `, ${provider.zone}`}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(provider)}
                      className="flex-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      {t('viewDetails')}
                    </button>
                    <Link
                      href={`/${locale}/client/requests/new?${provider.type === 'PROFESSIONAL' ? 'professionalId' : 'companyId'}=${provider.id}`}
                      className="flex-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-center flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      {t('contact')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('noProfessionals')}</p>
          </div>
        )}

        {/* Provider Detail Modal */}
        {selectedProvider && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedProvider.displayName}
                  </h2>
                  {selectedProvider.type === 'COMPANY' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                      Empresa
                    </span>
                  )}
                  {selectedProvider.hasVerifiedBadge && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      Verificado
                    </span>
                  )}
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Provider Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Profile Image */}
                  {selectedProvider.profileImage && (
                    <div>
                      <img
                        src={selectedProvider.profileImage}
                        alt={selectedProvider.displayName}
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
                      {selectedProvider.trades && selectedProvider.trades.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">{t('details.trades')}:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedProvider.trades.map((trade) => (
                              <span
                                key={trade.id}
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  trade.isPrimary
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {trade.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedProvider.type === 'PROFESSIONAL' && selectedProvider.experienceYears && (
                        <div>
                          <span className="font-medium text-gray-700">{t('details.experience')}:</span>
                          <span className="ml-2 text-gray-500">
                            {selectedProvider.experienceYears} {t('details.years')}
                          </span>
                        </div>
                      )}
                      {selectedProvider.type === 'COMPANY' && selectedProvider.employeeCount && (
                        <div>
                          <span className="font-medium text-gray-700">Empleados:</span>
                          <span className="ml-2 text-gray-500">{selectedProvider.employeeCount}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">{t('details.location')}:</span>
                        <span className="ml-2 text-gray-500">
                          {selectedProvider.city}
                          {selectedProvider.zone && `, ${selectedProvider.zone}`}
                        </span>
                      </div>
                      {selectedProvider.averageRating > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">{t('details.rating')}:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-lg ${
                                    star <= Math.round(selectedProvider.averageRating)
                                      ? 'text-yellow-500'
                                      : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {selectedProvider.averageRating.toFixed(1)} ({selectedProvider.totalReviews}{' '}
                              {t('reviews')})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedProvider.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('details.description')}</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedProvider.description}</p>
                  </div>
                )}

                {/* Reviews - Only show for professionals */}
                {selectedProvider.type === 'PROFESSIONAL' && (
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
                                <p className="text-xs text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`text-sm ${
                                      star <= review.rating ? 'text-yellow-500' : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                            )}
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
                                  <p className="text-xs text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </p>
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
                              {review.comment && (
                                <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
                          <div className="text-center p-6">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{t('contactInfo.title')}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('contactInfo.description')}
                  </p>
                  <Link
                    href={`/${locale}/client/requests/new?${selectedProvider.type === 'PROFESSIONAL' ? 'professionalId' : 'companyId'}=${selectedProvider.id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('contactInfo.createRequest')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

