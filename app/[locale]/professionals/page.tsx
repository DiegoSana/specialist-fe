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
                      className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      {t('viewDetails')}
                    </button>
                    {professional.whatsapp && (
                      <a
                        href={`https://wa.me/${professional.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center"
                        title="WhatsApp"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                      </a>
                    )}
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
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

