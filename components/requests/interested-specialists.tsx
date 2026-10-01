'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useAssignProfessional, useRequestInterests } from '@/hooks/use-requests';
import { useProviderById } from '@/hooks/use-providers';
import ProviderDetailModal from '@/components/providers/provider-detail-modal';

interface InterestedSpecialistsProps {
  requestId: string;
}

/**
 * Client-facing list of INTERESTED specialists on a published request, with "Elegir" (assign).
 * Contact info is intentionally never included here — it's released only once the client
 * chooses one (status CONTACT_RELEASED), so there's nothing to show before that.
 */
export default function InterestedSpecialists({ requestId }: InterestedSpecialistsProps) {
  const tInterest = useTranslations('client.requestDetail.interests');
  const params = useParams();
  const locale = params.locale as string;
  const { data: interests, isLoading } = useRequestInterests(requestId);
  const assign = useAssignProfessional();
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [viewingProviderRef, setViewingProviderRef] = useState<{
    id: string;
    type: 'PROFESSIONAL' | 'COMPANY';
  } | null>(null);

  // Interest rows only carry a name/rating summary (no trades/description/city — see
  // InterestedProvider in types/index.ts); fetch the full profile to feed the popup, only once a
  // row is actually opened. Fetched by the provider's own id (not the public catalog search) so
  // this still works for a specialist who expressed interest but no longer shows up in the public
  // catalog (e.g. visibility toggled off, or not yet catalog-active) — see GET /professionals/:id
  // and GET /companies/:id, which don't apply those filters.
  const { data: viewingProvider } = useProviderById(
    viewingProviderRef?.id ?? null,
    viewingProviderRef?.type ?? null,
    { enabled: viewingProviderRef !== null }
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{tInterest('title')}</h3>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      ) : interests && interests.length > 0 ? (
        <div className="space-y-3">
          <p className="mb-2 text-sm text-gray-500">{tInterest('description')}</p>
          {interests.map((interest: any) => {
            return (
              <div
                key={interest.id}
                data-testid="interest-row"
                className="rounded-xl border-2 border-transparent bg-gray-50 p-4 transition-all hover:border-green-300 hover:bg-green-50"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate font-semibold text-gray-800">
                        {interest.provider?.displayName || 'Especialista'}
                      </h4>
                      {interest.provider?.type === 'COMPANY' && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Empresa
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      {interest.provider && interest.provider.averageRating > 0 && (
                        <span>
                          <span className="text-yellow-500">★</span> {interest.provider.averageRating.toFixed(1)} (
                          {interest.provider.totalReviews})
                        </span>
                      )}
                      <span className="text-gray-400">• {new Date(interest.createdAt).toLocaleDateString()}</span>
                    </div>
                    {interest.message && (
                      <p className="mt-2 truncate text-sm italic text-gray-600">&ldquo;{interest.message}&rdquo;</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
                    {interest.provider?.id && interest.provider?.type && (
                      <button
                        type="button"
                        data-testid="view-profile-button"
                        onClick={() =>
                          setViewingProviderRef({ id: interest.provider.id, type: interest.provider.type })
                        }
                        className="whitespace-nowrap rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {tInterest('viewProfile')}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={assign.isPending}
                      onClick={async () => {
                        setAssigningId(interest.serviceProviderId);
                        try {
                          await assign.mutateAsync({ requestId, serviceProviderId: interest.serviceProviderId });
                        } catch (error) {
                          console.error('Error assigning provider:', error);
                        } finally {
                          setAssigningId(null);
                        }
                      }}
                      className="whitespace-nowrap rounded-lg bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {assigningId === interest.serviceProviderId ? tInterest('assigning') : tInterest('assign')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-center">
          <h4 className="mb-1 text-base font-medium text-gray-800">{tInterest('noInterested')}</h4>
          <p className="mx-auto max-w-sm text-sm text-gray-500">{tInterest('noInterestedDescription')}</p>
        </div>
      )}

      {viewingProvider && (
        <ProviderDetailModal
          provider={viewingProvider}
          locale={locale}
          onClose={() => setViewingProviderRef(null)}
          showCreateRequestCta={false}
        />
      )}
    </div>
  );
}
