'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchProfessionals } from '@/hooks/use-professionals';
import { useProfessionalReviews } from '@/hooks/use-reviews';
import { Professional } from '@/types';
import AppLayout from '@/components/layout/app-layout';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ProfessionalsPage() {
  const t = useTranslations('professionals');
  const params = useParams();
  const locale = params.locale as string;

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  const { data: professionals, isLoading: loadingProfessionals } = useSearchProfessionals({
    search: searchTerm || undefined,
  });

  const { data: reviews } = useProfessionalReviews(selectedProfessional?.id || '');

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleViewDetails = (professional: Professional) => {
    setSelectedProfessional(professional);
  };

  const handleCloseModal = () => {
    setSelectedProfessional(null);
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

        {/* Professionals Grid */}
        {loadingProfessionals ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : professionals && professionals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {professionals.map((professional) => (
              <div
                key={professional.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
              >
                {/* Professional Info */}
                <div className="p-4 flex-1 flex flex-col">
                  {/* Photo and Name */}
                  <div className="flex items-center gap-2 mb-2">
                    {/* Professional Photo - Use user profilePictureUrl first, then professional profileImage */}
                    {(() => {
                      const imageUrl = professional.user?.profilePictureUrl || professional.profileImage;
                      return imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`${professional.user?.firstName} ${professional.user?.lastName}`}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-gray-300"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.currentTarget.style.display = 'none';
                            const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      ) : null;
                    })()}
                    {!professional.user?.profilePictureUrl && !professional.profileImage && (
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
                      <h3 className="text-base font-semibold text-gray-800 truncate">
                        {professional.user?.firstName} {professional.user?.lastName}
                      </h3>
                      {professional.trades && professional.trades.length > 0 && (
                        <p className="text-xs text-blue-600 font-medium truncate">
                          {professional.trades.find(t => t.isPrimary)?.name || professional.trades[0].name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  {professional.averageRating > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xs ${
                              star <= Math.round(professional.averageRating)
                                ? 'text-yellow-500'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {professional.averageRating.toFixed(1)} ({professional.totalReviews})
                      </span>
                    </div>
                  )}

                  {/* Additional Trades (if more than one) */}
                  {professional.trades && professional.trades.length > 1 && (
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-1">
                        {professional.trades.slice(1, 3).map((trade) => (
                          <span
                            key={trade.id}
                            className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                          >
                            {trade.name}
                          </span>
                        ))}
                        {professional.trades.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                            +{professional.trades.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Gallery Preview */}
                  {(() => {
                    const gallery = professional.combinedGallery || professional.gallery || [];
                    const previewImages = gallery.slice(0, 4);
                    if (previewImages.length === 0) return null;

                    return (
                      <div className="mb-3">
                        <div className="grid grid-cols-2 gap-1">
                          {previewImages.map((imageUrl, index) => (
                            <div
                              key={index}
                              className="relative aspect-square overflow-hidden rounded bg-gray-200"
                            >
                              {imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                                <video
                                  src={imageUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={imageUrl}
                                  alt={`Gallery ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              {index === 3 && gallery.length > 4 && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                  <span className="text-white text-xs font-medium">+{gallery.length - 4}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

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
                      {professional.city}
                      {professional.zone && `, ${professional.zone}`}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(professional)}
                      className="flex-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      {t('viewDetails')}
                    </button>
                    <Link
                      href={`/${locale}/client/requests/new?professionalId=${professional.id}`}
                      className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center"
                    >
                      {t('createRequest')}
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

        {/* Professional Detail Modal */}
        {selectedProfessional && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedProfessional.user?.firstName} {selectedProfessional.user?.lastName}
                </h2>
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
                {/* Professional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gallery */}
                  {(() => {
                    const gallery = selectedProfessional.combinedGallery || selectedProfessional.gallery || [];
                    if (gallery.length === 0) {
                      const imageUrl = selectedProfessional.user?.profilePictureUrl || selectedProfessional.profileImage;
                      return imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`${selectedProfessional.user?.firstName} ${selectedProfessional.user?.lastName}`}
                          className="w-full h-64 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null;
                    }

                    return (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('details.gallery')}</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {gallery.slice(0, 4).map((imageUrl, index) => (
                            <div key={index} className="relative aspect-square overflow-hidden rounded-lg bg-gray-200">
                              {imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                                <video
                                  src={imageUrl}
                                  className="w-full h-full object-cover"
                                  controls
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={imageUrl}
                                  alt={`Gallery ${index + 1}`}
                                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(imageUrl, '_blank')}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        {gallery.length > 4 && (
                          <p className="text-sm text-gray-500 mt-2">
                            {t('details.morePhotos', { count: gallery.length - 4 })}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('details.info')}</h3>
                    <div className="space-y-2 text-sm">
                      {selectedProfessional.trades && selectedProfessional.trades.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">{t('details.trades')}:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedProfessional.trades.map((trade) => (
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
                      {selectedProfessional.experienceYears && (
                        <div>
                          <span className="font-medium text-gray-700">{t('details.experience')}:</span>
                          <span className="ml-2 text-gray-500">
                            {selectedProfessional.experienceYears} {t('details.years')}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">{t('details.location')}:</span>
                        <span className="ml-2 text-gray-500">
                          {selectedProfessional.city}
                          {selectedProfessional.zone && `, ${selectedProfessional.zone}`}
                          {selectedProfessional.address && ` - ${selectedProfessional.address}`}
                        </span>
                      </div>
                      {selectedProfessional.averageRating > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">{t('details.rating')}:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-lg ${
                                    star <= Math.round(selectedProfessional.averageRating)
                                      ? 'text-yellow-500'
                                      : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {selectedProfessional.averageRating.toFixed(1)} ({selectedProfessional.totalReviews}{' '}
                              {t('reviews')})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedProfessional.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('details.description')}</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedProfessional.description}</p>
                  </div>
                )}

                {/* Reviews */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {t('details.reviews')} ({reviews?.length || 0})
                  </h3>
                  {reviews && reviews.length > 0 ? (
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
                    <p className="text-gray-500">{t('details.noReviews')}</p>
                  )}
                </div>

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
                    href={`/${locale}/client/requests/new?professionalId=${selectedProfessional.id}`}
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

