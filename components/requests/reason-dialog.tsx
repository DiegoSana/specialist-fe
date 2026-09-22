'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface ReasonDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  isPending?: boolean;
  error?: string | null;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

const MAX_REASON = 500;

/** Small modal asking for an optional free-text reason (stored as Request.statusReason). */
export default function ReasonDialog({
  open,
  title,
  description,
  confirmLabel,
  isPending = false,
  error,
  onConfirm,
  onClose,
}: ReasonDialogProps) {
  const t = useTranslations('requestStatus.dialog');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reason-dialog-title"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 id="reason-dialog-title" className="text-lg font-semibold text-gray-800">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        <label htmlFor="reason-dialog-input" className="mt-4 block text-sm font-medium text-gray-700">
          {t('reasonLabel')}
        </label>
        <textarea
          id="reason-dialog-input"
          rows={4}
          maxLength={MAX_REASON}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('reasonPlaceholder')}
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason.trim())}
            disabled={isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
