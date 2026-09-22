'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Request, RequestStatus } from '@/types';
import { getCounterpart, whatsappUrl } from '@/lib/request-participants';
import { getPrimaryAction, RequestRole } from '@/lib/request-status';
import {
  useAcceptRequest,
  useRejectRequest,
  useMarkRequestFinished,
  useConfirmRequest,
  useObjectRequest,
  useRepublishRequest,
} from '@/hooks/use-requests';
import { useReviewByRequestId } from '@/hooks/use-reviews';
import ReasonDialog from '@/components/requests/reason-dialog';

interface RequestPrimaryActionProps {
  request: Request;
  role: RequestRole;
  locale: string;
  /** `card` = compact row for lists, `detail` = larger buttons on the detail sidebar. */
  variant?: 'card' | 'detail';
}

const BTN_BASE = 'text-center font-semibold rounded-lg transition-colors disabled:opacity-50';

function sizeClass(variant: 'card' | 'detail') {
  return variant === 'detail' ? 'py-3 text-sm' : 'py-2 text-[13px]';
}

function detailHref(request: Request, role: RequestRole, locale: string) {
  return `/${locale}/${role === 'client' ? 'client' : 'specialist'}/requests/${request.id}`;
}

function errorMessage(error: unknown): string | null {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof message === 'string' ? message : null;
}

function AcceptReject({ request, variant }: { request: Request; variant: 'card' | 'detail' }) {
  const t = useTranslations('requestStatus.actions');
  const accept = useAcceptRequest();
  const reject = useRejectRequest();
  const busy = accept.isPending || reject.isPending;
  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => accept.mutate({ id: request.id })}
        className={`${BTN_BASE} ${sizeClass(variant)} flex-1 bg-green-600 text-white hover:bg-green-700`}
      >
        {t('accept')}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => reject.mutate({ id: request.id })}
        className={`${BTN_BASE} ${sizeClass(variant)} flex-1 border border-red-300 bg-white text-red-600 hover:bg-red-50`}
      >
        {t('reject')}
      </button>
    </div>
  );
}

function MarkFinished({ request, variant }: { request: Request; variant: 'card' | 'detail' }) {
  const t = useTranslations('requestStatus.actions');
  const finish = useMarkRequestFinished();
  return (
    <button
      type="button"
      disabled={finish.isPending}
      onClick={() => finish.mutate({ id: request.id })}
      className={`${BTN_BASE} ${sizeClass(variant)} w-full bg-blue-600 text-white hover:bg-blue-700`}
    >
      {t('markFinished')}
    </button>
  );
}

function ConfirmObject({ request, variant }: { request: Request; variant: 'card' | 'detail' }) {
  const t = useTranslations('requestStatus.actions');
  const tDialog = useTranslations('requestStatus.dialog');
  const confirm = useConfirmRequest();
  const object = useObjectRequest();
  const [objecting, setObjecting] = useState(false);
  const busy = confirm.isPending || object.isPending;
  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => confirm.mutate({ id: request.id })}
          className={`${BTN_BASE} ${sizeClass(variant)} flex-1 bg-green-600 text-white hover:bg-green-700`}
        >
          {t('confirm')}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setObjecting(true)}
          className={`${BTN_BASE} ${sizeClass(variant)} flex-1 border border-red-300 bg-white text-red-600 hover:bg-red-50`}
        >
          {t('object')}
        </button>
      </div>
      <ReasonDialog
        open={objecting}
        title={tDialog('objectTitle')}
        description={tDialog('objectDescription')}
        confirmLabel={tDialog('send')}
        isPending={object.isPending}
        error={errorMessage(object.error)}
        onClose={() => setObjecting(false)}
        onConfirm={(reason) =>
          object.mutate({ id: request.id, reason }, { onSuccess: () => setObjecting(false) })
        }
      />
    </>
  );
}

export function RepublishButton({
  request,
  locale,
  variant = 'card',
  className = '',
}: {
  request: Request;
  locale: string;
  variant?: 'card' | 'detail';
  className?: string;
}) {
  const t = useTranslations('requestStatus.actions');
  const router = useRouter();
  const republish = useRepublishRequest();
  // Same mode as the original: a bolsa request goes back to the bolsa, a direct one to the same specialist.
  const isPublic = request.isPublic || !!request.tradeId;
  const providerTarget = {
    professionalId: request.professional?.id,
    companyId: request.company?.id,
  };
  const canRepublish = isPublic ? !!request.tradeId : !!(providerTarget.professionalId || providerTarget.companyId);
  if (!canRepublish) return null;
  return (
    <button
      type="button"
      disabled={republish.isPending}
      onClick={() =>
        republish.mutate(
          { original: request, isPublic, providerTarget },
          { onSuccess: (created) => router.push(`/${locale}/client/requests/${created.id}`) },
        )
      }
      className={`${BTN_BASE} ${sizeClass(variant)} border border-blue-300 bg-white px-4 text-blue-700 hover:bg-blue-50 ${className}`}
    >
      {t('republish')}
    </button>
  );
}

/** The single primary action for a request, chosen by the status metadata for the viewer's role. */
export default function RequestPrimaryAction({
  request,
  role,
  locale,
  variant = 'card',
}: RequestPrimaryActionProps) {
  const t = useTranslations('requestStatus.actions');
  const isClosed = request.status === RequestStatus.CLOSED;
  // Client rates the specialist via a Review record; the specialist rates the client via
  // Request.clientRating, already present on the request — no extra fetch needed for that side.
  const { data: existingReview } = useReviewByRequestId(request.id, role === 'client' && isClosed);
  const alreadyReviewed = isClosed
    ? role === 'client'
      ? !!existingReview
      : request.clientRating !== null && request.clientRating !== undefined
    : false;
  const action = getPrimaryAction(request.status, role, {
    interestCount: request.interestsCount,
    alreadyReviewed,
  });
  const href = detailHref(request, role, locale);

  switch (action) {
    case 'CONTINUE_DRAFT':
    case 'VIEW_INTERESTS':
    case 'RATE':
      return (
        <Link
          href={href}
          className={`${BTN_BASE} ${sizeClass(variant)} block w-full bg-blue-600 text-white hover:bg-blue-700`}
        >
          {action === 'CONTINUE_DRAFT'
            ? t('continueDraft')
            : action === 'VIEW_INTERESTS'
              ? t('viewInterests')
              : t('rate')}
        </Link>
      );
    case 'OPEN_WHATSAPP': {
      const { phone } = getCounterpart(request, role);
      return phone ? (
        <a
          href={whatsappUrl(phone)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${BTN_BASE} ${sizeClass(variant)} block w-full bg-green-600 text-white hover:bg-green-700`}
        >
          {t('openWhatsapp')}
        </a>
      ) : (
        <Link
          href={href}
          className={`${BTN_BASE} ${sizeClass(variant)} block w-full border border-green-300 bg-white text-green-700 hover:bg-green-50`}
        >
          {t('viewDetail')}
        </Link>
      );
    }
    case 'ACCEPT_REJECT':
      return <AcceptReject request={request} variant={variant} />;
    case 'MARK_FINISHED':
      return <MarkFinished request={request} variant={variant} />;
    case 'CONFIRM_OBJECT':
      return <ConfirmObject request={request} variant={variant} />;
    case 'REPUBLISH':
      return <RepublishButton request={request} locale={locale} variant={variant} className="w-full" />;
    default:
      return null;
  }
}
