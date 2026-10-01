import { getTranslations } from 'next-intl/server';

export default async function WhatsappDemo() {
  const t = await getTranslations('home.howItWorks.phoneDemo');

  return (
    <div className="flex-shrink-0 flex flex-col items-center w-[200px] sm:w-[220px]">
      <div className="relative w-[200px] h-[430px] sm:w-[220px] sm:h-[476px] box-border bg-gray-800 rounded-[34px] p-2 shadow-xl">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-3.5 rounded-full bg-gray-800 z-10" />
        <div className="relative w-full h-full bg-white rounded-[26px] overflow-hidden">
          {/* Screen 1: "Mis Solicitudes" */}
          <div
            className="wa-phone-screen absolute inset-0 flex flex-col bg-white px-3.5 pt-5 pb-3.5"
            style={{ animationDelay: '0s' }}
          >
            <div className="text-[11px] font-bold text-gray-800 mb-2">{t('screen1.header')}</div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="text-[9px] font-bold text-blue-600 border-b-2 border-blue-600 pb-0.5">
                {t('screen1.tabLabel')}
              </span>
              <span className="text-[7.5px] font-bold text-white bg-blue-600 rounded-full px-1.5 py-0.5">
                {t('screen1.tabCount')}
              </span>
            </div>
            <div className="box-border p-2.5 bg-white border border-gray-200 rounded-lg mb-2">
              <span className="px-1.5 py-0.5 rounded text-[7.5px] font-semibold bg-emerald-100 text-emerald-700">
                {t('screen1.card1.badge')}
              </span>
              <div className="text-[10px] font-bold text-gray-800 mt-1.5 mb-0.5">{t('screen1.card1.title')}</div>
              <div className="text-[8px] text-gray-500 mb-1.5">{t('screen1.card1.subtitle')}</div>
              <div className="py-1.5 bg-emerald-600 rounded-md text-center">
                <span className="text-[8.5px] font-semibold text-white">{t('screen1.card1.cta')}</span>
              </div>
            </div>
            <div className="box-border p-2.5 bg-white border border-gray-200 rounded-lg">
              <span className="px-1.5 py-0.5 rounded text-[7.5px] font-semibold bg-blue-100 text-blue-800">
                {t('screen1.card2.badge')}
              </span>
              <div className="text-[10px] font-bold text-gray-800 mt-1.5 mb-0.5">{t('screen1.card2.title')}</div>
              <div className="text-[8px] text-gray-500 mb-1.5">{t('screen1.card2.subtitle')}</div>
              <div className="py-1.5 bg-blue-600 rounded-md text-center">
                <span className="text-[8.5px] font-semibold text-white">{t('screen1.card2.cta')}</span>
              </div>
            </div>
          </div>

          {/* Screen 2: detail in "Contacto liberado" */}
          <div
            className="wa-phone-screen absolute inset-0 flex flex-col bg-white px-3.5 pt-5 pb-3.5"
            style={{ animationDelay: '-3s' }}
          >
            <span className="text-[8px] text-gray-400 mb-2">← {t('screen2.back')}</span>
            <span className="self-start px-1.5 py-0.5 rounded text-[7.5px] font-semibold bg-emerald-100 text-emerald-700 mb-1.5">
              {t('screen2.badge')}
            </span>
            <div className="text-[10.5px] font-bold text-gray-800 mb-2.5">{t('screen2.title')}</div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div className="w-1/4 h-full bg-gradient-to-r from-blue-600 to-emerald-600" />
            </div>
            <div className="flex gap-1 mb-3.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-100" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] font-bold text-blue-600">JF</span>
              </div>
              <span className="text-[9px] font-semibold text-gray-800">{t('screen2.contactName')}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 rounded-md mb-2">
              <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10a6 6 0 1 1 2.6 4.95L4 16l1.1-2.9A6 6 0 0 1 4 10Z" />
              </svg>
              <span className="text-[8.5px] font-semibold text-white">{t('screen2.cta')}</span>
            </div>
            <div className="p-1.5 bg-blue-50 border border-blue-100 rounded-md text-center">
              <span className="text-[7.5px] font-semibold text-blue-700">{t('screen2.agreementNote')}</span>
            </div>
          </div>

          {/* Screen 3: the conversation continues on WhatsApp */}
          <div
            className="wa-phone-screen absolute inset-0 flex flex-col bg-emerald-50 px-3.5 pt-5 pb-3.5"
            style={{ animationDelay: '-6s' }}
          >
            <div className="flex items-center gap-1.5 mb-3.5">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="#047857" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10a6 6 0 1 1 2.6 4.95L4 16l1.1-2.9A6 6 0 0 1 4 10Z" />
              </svg>
              <span className="text-[11px] font-bold text-emerald-700">{t('screen3.header')}</span>
            </div>
            <div className="self-start max-w-[85%] px-2.5 py-1.5 bg-white rounded-tl-[10px] rounded-tr-[10px] rounded-br-[10px] rounded-bl-[2px] mb-2">
              <span className="text-[8.5px] text-gray-700 leading-snug">{t('screen3.botMessage')}</span>
            </div>
            <div className="self-end max-w-[85%] px-2.5 py-1.5 bg-emerald-100 rounded-tl-[10px] rounded-tr-[10px] rounded-bl-[10px] rounded-br-[2px]">
              <span className="text-[8.5px] text-gray-800 leading-snug">{t('screen3.clientReply')}</span>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3.5 max-w-[220px] text-xs text-gray-500 text-center leading-relaxed">{t('caption')}</p>
    </div>
  );
}
