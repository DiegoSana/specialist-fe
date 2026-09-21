'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Request } from '@/types';
import { getHintKey, getRequestBucket, RequestRole } from '@/lib/request-status';
import RequestStatusBadge from '@/components/requests/request-status-badge';

interface RequestDetailHeaderProps {
  request: Request;
  role: RequestRole;
  backHref: string;
  backLabel: string;
  dateLabel: string;
}

/** Back link, badge + date, title and the "whose turn is it" hint shared by both detail pages. */
export default function RequestDetailHeader({
  request,
  role,
  backHref,
  backLabel,
  dateLabel,
}: RequestDetailHeaderProps) {
  const t = useTranslations('requestStatus');
  const ctx = { interestCount: request.interestsCount };
  const isYours = getRequestBucket(request.status, role, ctx) === 'yours';
  const hintKey = getHintKey(request.status, role, ctx);

  return (
    <div className="mb-6">
      <Link href={backHref} className="text-sm text-gray-500 hover:text-gray-700">
        ← {backLabel}
      </Link>
      <div className="mb-1.5 mt-3 flex items-center gap-2.5">
        <RequestStatusBadge status={request.status} />
        <span className="text-xs text-gray-400">{dateLabel}</span>
      </div>
      <h1 className="mb-1.5 text-[22px] font-bold text-gray-800">{request.title}</h1>
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${isYours ? 'bg-blue-600' : 'bg-gray-400'}`} />
        <span className={`text-[13px] ${isYours ? 'font-medium text-blue-600' : 'text-gray-500'}`}>
          {t(`hints.${role === 'client' ? 'client' : 'provider'}.${hintKey}`)}
        </span>
      </div>
    </div>
  );
}
