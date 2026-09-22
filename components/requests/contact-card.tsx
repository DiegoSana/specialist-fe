'use client';

import { useTranslations } from 'next-intl';
import { Counterpart, whatsappUrl } from '@/lib/request-participants';

interface ContactCardProps {
  counterpart: Counterpart;
  /** Contact data is only shown once contact was released. */
  released: boolean;
  accent?: 'green' | 'blue';
}

/** "Contacto" card: the other side's name/phone and an "Abrir WhatsApp" button. No chat in the app. */
export default function ContactCard({ counterpart, released, accent = 'green' }: ContactCardProps) {
  const t = useTranslations('requestStatus.contact');
  const tActions = useTranslations('requestStatus.actions');
  if (!released) return null;
  const avatar = accent === 'green' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{t('title')}</h3>
      <div className="mb-3 flex items-center gap-2.5">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${avatar}`}>
          {counterpart.initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-800">{counterpart.name ?? '—'}</div>
          {counterpart.phone && <div className="text-xs text-gray-500">{counterpart.phone}</div>}
        </div>
      </div>
      {counterpart.phone ? (
        <a
          href={whatsappUrl(counterpart.phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg bg-green-600 py-2.5 text-center text-[13px] font-semibold text-white hover:bg-green-700"
        >
          {tActions('openWhatsapp')}
        </a>
      ) : (
        <p className="text-xs text-gray-500">{t('noPhone')}</p>
      )}
    </div>
  );
}
