'use client';

import { useTranslations } from 'next-intl';
import { RequestReviewSummary } from '@/types';

interface ClientReputationCardProps {
  averageRating?: number;
  totalReviews?: number;
  featuredReviews?: RequestReviewSummary[];
  clientName: string;
}

/**
 * "In context" client reputation, shown to the provider alongside a request/interest — no
 * dedicated client profile page exists (REVIEWS_REDESIGN.md section 2). Renders nothing when
 * there's no rating yet (new client, or data not populated on this response — e.g. list
 * endpoints, where `client.averageRating`/`totalReviews` are present but `featuredReviews` isn't).
 */
export default function ClientReputationCard({
  averageRating,
  totalReviews,
  featuredReviews,
  clientName,
}: ClientReputationCardProps) {
  const t = useTranslations('components.clientReputation');

  if (!averageRating || averageRating <= 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-gray-800">{t('title', { name: clientName })}</h3>
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`text-base ${star <= Math.round(averageRating) ? 'text-yellow-500' : 'text-gray-300'}`}
            >
              ★
            </span>
          ))}
        </div>
        <span className="text-xs text-gray-500">
          {averageRating.toFixed(1)} ({t('reviewCount', { count: totalReviews ?? 0 })})
        </span>
      </div>

      {featuredReviews && featuredReviews.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
          <p className="text-xs font-medium text-gray-500">{t('featuredTitle')}</p>
          {featuredReviews.map((review) => (
            <div key={review.id} className="rounded-md bg-gray-50 p-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-xs ${star <= review.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              {review.comment && <p className="mt-1 text-xs italic text-gray-600">&ldquo;{review.comment}&rdquo;</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
