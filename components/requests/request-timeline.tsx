'use client';

import { useTranslations } from 'next-intl';
import { RequestStatus } from '@/types';
import { REQUEST_STATUS_META, TIMELINE_STATUSES } from '@/lib/request-status';

interface RequestTimelineProps {
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  isPublic?: boolean;
  hasInterestedProfessionals?: boolean;
  /** Reason stored for NOT_COMPLETED / INTERRUPTED (shown on final states when present). */
  statusReason?: string | null;
}

type StepState = 'completed' | 'current' | 'upcoming';

const STEP_LABEL_KEYS = ['contactReleased', 'inProgress', 'finished', 'closed'] as const;

const STEP_STYLES: Record<StepState, { circle: string; text: string }> = {
  completed: {
    circle: 'bg-green-500 text-white border-green-500',
    text: 'text-green-700 font-medium',
  },
  current: {
    circle: 'bg-blue-500 text-white border-blue-500 ring-4 ring-blue-100',
    text: 'text-blue-700 font-semibold',
  },
  upcoming: {
    circle: 'bg-gray-100 text-gray-400 border-gray-300',
    text: 'text-gray-400',
  },
};

/**
 * Post-contact timeline (Contacto liberado → En curso → Terminado → Cerrado). Statuses before the
 * contact is released (draft / published / sent) show the four steps as upcoming; statuses that end
 * without an agreement replace the steps with a summary card. Everything status-specific comes from
 * lib/request-status.ts.
 */
export default function RequestTimeline({
  status,
  updatedAt,
  hasInterestedProfessionals,
  statusReason,
}: RequestTimelineProps) {
  const t = useTranslations('components.timeline');
  const tStatus = useTranslations('requestStatus.status');

  const meta = REQUEST_STATUS_META[status];

  if (meta.isFinalNoAgreement) {
    const isNegative =
      status === RequestStatus.REJECTED || status === RequestStatus.CANCELLED;
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {t('title')}
          </h3>
          <span className="text-xs text-gray-500">
            {new Date(updatedAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div
              className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isNegative ? 'bg-red-100' : 'bg-gray-100'
              }`}
            >
              <svg
                className={`w-8 h-8 ${isNegative ? 'text-red-500' : 'text-gray-500'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className={`text-lg font-semibold ${isNegative ? 'text-red-600' : 'text-gray-700'}`}>
              {tStatus(meta.labelKey)}
            </p>
            <p className="text-sm text-gray-500 mt-1">{t(`descriptions.${status}`)}</p>
            {statusReason && (
              <p className="text-sm text-gray-600 mt-3">
                <span className="font-medium">{t('reason')}:</span> {statusReason}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentStep = meta.timelineStep; // null while the contact is not released yet
  const isClosed = status === RequestStatus.CLOSED;

  const getStepState = (index: number): StepState => {
    if (currentStep === null) return 'upcoming';
    if (isClosed || index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'upcoming';
  };

  const progressPercentage =
    currentStep === null ? 0 : ((currentStep + 1) / TIMELINE_STATUSES.length) * 100;

  const description =
    status === RequestStatus.PUBLISHED && hasInterestedProfessionals
      ? t('descriptions.pendingWithInterests')
      : t(`descriptions.${status}`);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          {t('title')}
        </h3>
        <span className="text-xs text-gray-500">
          {t('updated')}: {new Date(updatedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative mb-8">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="absolute -top-1 right-0 text-xs font-medium text-gray-500">
          {Math.round(progressPercentage)}%
        </div>
      </div>

      {/* Timeline steps */}
      <div className="relative">
        <div className="flex justify-between">
          {TIMELINE_STATUSES.map((stepStatus, index) => {
            const state = getStepState(index);
            const styles = STEP_STYLES[state];
            const isLast = index === TIMELINE_STATUSES.length - 1;
            const connectorDone = currentStep !== null && (isClosed || index < currentStep);

            return (
              <div key={stepStatus} className="flex flex-col items-center relative flex-1">
                {!isLast && (
                  // Spans from this step's center to the next step's center: left-1/2 (this
                  // container's center) + w-full (one more step-width) already lands exactly on
                  // the next center. An extra translateX(50%) here double-shifted it another
                  // half-step-width right, overflowing the row (and on the last connector, the
                  // whole page) on narrow screens - do not re-add it.
                  <div
                    className={`absolute top-5 left-1/2 w-full h-0.5 ${
                      connectorDone ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}

                <div
                  className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 ${styles.circle}`}
                >
                  {state === 'completed' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>

                <div className="mt-3 text-center">
                  <p className={`text-xs sm:text-sm ${styles.text}`}>
                    {t(`steps.${STEP_LABEL_KEYS[index]}`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current status description */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              status === RequestStatus.UNDER_REVIEW ? 'bg-orange-500' : 'bg-blue-500'
            }`}
          />
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}
