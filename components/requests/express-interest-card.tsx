'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Request } from '@/types';
import { useExpressInterest, useMyInterest, useRemoveInterest } from '@/hooks/use-requests';

interface ExpressInterestCardProps {
  request: Request;
}

/** Specialist side of a published (bolsa) request: show interest with an optional message, or withdraw it. */
export default function ExpressInterestCard({ request }: ExpressInterestCardProps) {
  const t = useTranslations('specialist.requestDetail');
  const tProfileActive = useTranslations('profileActive');
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'es';
  const { data: myInterest } = useMyInterest(request.id);
  const express = useExpressInterest();
  const remove = useRemoveInterest();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [profileInactive, setProfileInactive] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProfileInactive(false);
    try {
      await express.mutateAsync({ requestId: request.id, data: message ? { message } : undefined });
      setShowForm(false);
      setMessage('');
    } catch (err: any) {
      const msg = err.response?.data?.message as string | undefined;
      const lower = (msg || '').toLowerCase();
      const inactive =
        !!msg &&
        ((lower.includes('active') && lower.includes('interest')) ||
          (lower.includes('verify') && (lower.includes('email') || lower.includes('phone'))));
      setError(inactive ? tProfileActive('expressInterestMessage') : msg || t('errors.general'));
      setProfileInactive(inactive);
    }
  };

  if (myInterest?.hasInterest) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-5">
        <h3 className="font-semibold text-green-800">{t('interestExpressed')}</h3>
        <p className="mb-3 text-sm text-green-600">{t('interestExpressedDescription')}</p>
        <button
          type="button"
          disabled={remove.isPending}
          onClick={() =>
            remove.mutate(request.id, {
              onError: (err: any) => setError(err.response?.data?.message || t('errors.general')),
            })
          }
          className="text-sm text-red-600 underline hover:text-red-700 disabled:opacity-50"
        >
          {remove.isPending ? t('removing') : t('removeInterest')}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
        <h3 className="font-semibold text-blue-900">{t('interestedInJob')}</h3>
        <p className="mb-3 text-sm text-blue-700">{t('interestedDescription')}</p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {t('expressInterest')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border-2 border-blue-200 bg-white p-5">
      <h3 className="font-semibold text-gray-800">{t('expressInterestTitle')}</h3>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
          {profileInactive && (
            <Link href={`/${locale}/profile`} className="mt-2 inline-block text-sm font-medium text-blue-600">
              {tProfileActive('goToProfile')} →
            </Link>
          )}
        </div>
      )}
      <label htmlFor="interestMessage" className="block text-sm font-medium text-gray-700">
        {t('messageOptional')}
      </label>
      <textarea
        id="interestMessage"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t('messagePlaceholder')}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setMessage('');
            setError(null);
          }}
          className="rounded-md border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-50"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={express.isPending}
          className="flex-1 rounded-md bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {express.isPending ? t('sending') : t('confirmInterest')}
        </button>
      </div>
    </form>
  );
}
