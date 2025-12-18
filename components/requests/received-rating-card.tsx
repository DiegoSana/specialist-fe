'use client';

import { useTranslations } from 'next-intl';

interface ReceivedRatingCardProps {
  rating: number;
  comment?: string | null;
  reviewerName: string;
  type: 'from-professional' | 'from-client';
}

export default function ReceivedRatingCard({
  rating,
  comment,
  reviewerName,
  type,
}: ReceivedRatingCardProps) {
  const t = useTranslations('components.receivedRating');

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-indigo-800 mb-1">
            {type === 'from-professional' ? t('ratingFromSpecialist') : t('ratingFromClient')}
          </h3>
          <p className="text-sm text-indigo-600 mb-3">
            {reviewerName} {t('ratedYou')}
          </p>
          
          <div className="bg-white/60 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-6 h-6 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-lg font-bold text-gray-700">
                {rating}/5
              </span>
            </div>
            {comment && (
              <p className="text-gray-600 text-sm italic border-t border-indigo-100 pt-3 mt-2">
                "{comment}"
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

