'use client';

import { useTranslations } from 'next-intl';
import { RequestStatus } from '@/types';

interface RequestTimelineProps {
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

const TIMELINE_STEPS = [
  { status: RequestStatus.PENDING, icon: 'clock' },
  { status: RequestStatus.ACCEPTED, icon: 'check' },
  { status: RequestStatus.IN_PROGRESS, icon: 'wrench' },
  { status: RequestStatus.DONE, icon: 'flag' },
];

const STATUS_ORDER: Record<RequestStatus, number> = {
  [RequestStatus.PENDING]: 0,
  [RequestStatus.ACCEPTED]: 1,
  [RequestStatus.IN_PROGRESS]: 2,
  [RequestStatus.DONE]: 3,
  [RequestStatus.CANCELLED]: -1,
};

export default function RequestTimeline({ status, createdAt, updatedAt }: RequestTimelineProps) {
  const t = useTranslations('components.timeline');
  
  const currentIndex = STATUS_ORDER[status];
  const isCancelled = status === RequestStatus.CANCELLED;

  const getStepState = (stepIndex: number): 'completed' | 'current' | 'upcoming' | 'cancelled' => {
    if (isCancelled) return 'cancelled';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const getIcon = (iconType: string, state: 'completed' | 'current' | 'upcoming' | 'cancelled') => {
    const baseClass = "w-5 h-5";
    
    if (state === 'cancelled') {
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }

    if (state === 'completed') {
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }

    switch (iconType) {
      case 'clock':
        return (
          <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'check':
        return (
          <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'wrench':
        return (
          <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'flag':
        return (
          <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStepStyles = (state: 'completed' | 'current' | 'upcoming' | 'cancelled') => {
    switch (state) {
      case 'completed':
        return {
          circle: 'bg-green-500 text-white border-green-500',
          text: 'text-green-700 font-medium',
          line: 'bg-green-500',
        };
      case 'current':
        return {
          circle: 'bg-blue-500 text-white border-blue-500 ring-4 ring-blue-100',
          text: 'text-blue-700 font-semibold',
          line: 'bg-gray-200',
        };
      case 'upcoming':
        return {
          circle: 'bg-gray-100 text-gray-400 border-gray-300',
          text: 'text-gray-400',
          line: 'bg-gray-200',
        };
      case 'cancelled':
        return {
          circle: 'bg-red-500 text-white border-red-500',
          text: 'text-red-600 font-medium',
          line: 'bg-red-200',
        };
    }
  };

  const getStatusLabel = (stepStatus: RequestStatus) => {
    switch (stepStatus) {
      case RequestStatus.PENDING:
        return t('pending');
      case RequestStatus.ACCEPTED:
        return t('accepted');
      case RequestStatus.IN_PROGRESS:
        return t('inProgress');
      case RequestStatus.DONE:
        return t('done');
      default:
        return stepStatus;
    }
  };

  // Calculate progress percentage for the progress bar
  const progressPercentage = isCancelled ? 0 : ((currentIndex + 1) / TIMELINE_STEPS.length) * 100;

  if (isCancelled) {
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-red-600">{t('cancelled')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('cancelledDescription')}</p>
          </div>
        </div>
      </div>
    );
  }

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
          {TIMELINE_STEPS.map((step, index) => {
            const state = getStepState(index);
            const styles = getStepStyles(state);
            const isLast = index === TIMELINE_STEPS.length - 1;

            return (
              <div key={step.status} className="flex flex-col items-center relative flex-1">
                {/* Connector line */}
                {!isLast && (
                  <div 
                    className={`absolute top-5 left-1/2 w-full h-0.5 ${
                      index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                    style={{ transform: 'translateX(50%)' }}
                  />
                )}
                
                {/* Circle */}
                <div 
                  className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${styles.circle}`}
                >
                  {getIcon(step.icon, state)}
                </div>
                
                {/* Label */}
                <div className="mt-3 text-center">
                  <p className={`text-xs sm:text-sm ${styles.text}`}>
                    {getStatusLabel(step.status)}
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
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <p className="text-sm text-gray-600">
            {t(`descriptions.${status.toLowerCase()}`)}
          </p>
        </div>
      </div>
    </div>
  );
}

