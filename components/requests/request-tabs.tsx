'use client';

import { useTranslations } from 'next-intl';
import { RequestBucket } from '@/lib/request-status';

export type RequestTab = Exclude<RequestBucket, 'final'>;

interface RequestTabsProps {
  active: RequestTab;
  counts: Record<RequestTab, number>;
  onChange: (tab: RequestTab) => void;
}

const TABS: RequestTab[] = ['yours', 'waiting', 'closed'];

/** "Te toca a vos / Esperando a la otra parte / Cerrados" — the counters double as filters. */
export default function RequestTabs({ active, counts, onChange }: RequestTabsProps) {
  const t = useTranslations('requestStatus.tabs');
  return (
    <div role="tablist" className="flex gap-2 overflow-x-auto overflow-y-hidden border-b border-gray-200">
      {TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm ${
              isActive
                ? 'border-blue-600 font-semibold text-blue-600'
                : 'border-transparent font-medium text-gray-500 hover:text-gray-700'
            }`}
          >
            {t(tab)}
            <span
              className={`ml-1.5 rounded-full px-2 py-px text-[11px] font-bold ${
                isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {counts[tab]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
