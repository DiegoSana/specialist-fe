'use client';

import { useTranslations } from 'next-intl';
import { RequestStatus } from '@/types';
import { REQUEST_STATUS_META } from '@/lib/request-status';

interface RequestStatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export default function RequestStatusBadge({ status, className = '' }: RequestStatusBadgeProps) {
  const t = useTranslations('requestStatus.status');
  const meta = REQUEST_STATUS_META[status];
  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
        meta?.badgeClass ?? 'bg-gray-100 text-gray-800'
      } ${className}`}
    >
      {meta ? t(meta.labelKey) : status}
    </span>
  );
}
