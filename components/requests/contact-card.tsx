'use client';

import { useTranslations } from 'next-intl';
import { Counterpart, whatsappUrl } from '@/lib/request-participants';

interface ContactCardProps {
  counterpart: Counterpart;
  /** Contact data is only shown once contact was released. */
  released: boolean;
  accent?: 'green' | 'blue';
}

/**
 * "Contacto" card: the other side's name and, once contact is released, their phone and an
 * "Abrir WhatsApp" button. The name/avatar show as soon as a provider/client is known on the
 * request (the backend already exposes it at that point) — `released` only gates the phone,
 * which the backend withholds until contact is actually released.
 */
export default function ContactCard({ counterpart, released, accent = 'green' }: ContactCardProps) {
  const t = useTranslations('requestStatus.contact');
  const tActions = useTranslations('requestStatus.actions');
  if (!counterpart.name) return null;
  const avatar = accent === 'green' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600';
  const phone = released ? counterpart.phone : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{t('title')}</h3>
      <div className="mb-3 flex items-center gap-2.5">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${avatar}`}>
          {counterpart.initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-800">{counterpart.name}</div>
          {phone && <div className="text-xs text-gray-500">{phone}</div>}
        </div>
      </div>
      {phone ? (
        <a
          href={whatsappUrl(phone)}
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
