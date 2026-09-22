'use client';

import { useTranslations } from 'next-intl';
import { Request } from '@/types';

interface RequestSummaryCardProps {
  request: Request;
  /** "Tipo de pedido" (client) / "Cómo llegó" (specialist) value. */
  originLabel: string;
  originTitle: string;
}

/** "Descripción" card: description plus trade / zone / origin details. No prices or quotes. */
export default function RequestSummaryCard({ request, originLabel, originTitle }: RequestSummaryCardProps) {
  const t = useTranslations('requestStatus.detail');
  const details: Array<[string, string | undefined | null]> = [
    [t('trade'), request.trade?.name],
    [t('address'), request.address],
    [t('availability'), request.availability],
    [originTitle, originLabel],
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{t('description')}</h3>
      <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{request.description}</p>
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-gray-100 pt-3 text-[13px] sm:grid-cols-2">
        {details
          .filter(([, value]) => !!value)
          .map(([label, value]) => (
            <div key={label}>
              <span className="text-gray-400">{label}</span>
              <br />
              <span className="text-gray-800">{value}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
