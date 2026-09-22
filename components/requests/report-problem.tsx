'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Request } from '@/types';
import { getReportOption, RequestRole } from '@/lib/request-status';
import { useReportInterrupted, useReportNotCompleted } from '@/hooks/use-requests';
import ReasonDialog from '@/components/requests/reason-dialog';

interface ReportProblemProps {
  request: Request;
  role: RequestRole;
}

function errorMessage(error: unknown): string | null {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof message === 'string' ? message : null;
}

/** Secondary link (not a primary button): report "No se concretó" / "Interrumpido" with a reason. */
export default function ReportProblem({ request, role }: ReportProblemProps) {
  const t = useTranslations('requestStatus');
  const option = getReportOption(request.status, role);
  const notCompleted = useReportNotCompleted();
  const interrupted = useReportInterrupted();
  const [open, setOpen] = useState(false);
  if (!option) return null;

  const mutation = option === 'NOT_COMPLETED' ? notCompleted : interrupted;
  const key = option === 'NOT_COMPLETED' ? 'notCompleted' : 'interrupted';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left text-xs text-gray-400 underline hover:text-gray-600"
      >
        {t(`report.${key}.link`)}
      </button>
      <ReasonDialog
        open={open}
        title={t(`report.${key}.title`)}
        description={t(`report.${key}.description`)}
        confirmLabel={t('dialog.send')}
        isPending={mutation.isPending}
        error={errorMessage(mutation.error)}
        onClose={() => setOpen(false)}
        onConfirm={(reason) =>
          mutation.mutate({ id: request.id, reason }, { onSuccess: () => setOpen(false) })
        }
      />
    </>
  );
}
