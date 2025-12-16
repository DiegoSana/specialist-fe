import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import MainNav from '@/components/navigation/main-nav';
import SpecialistCtaButton from '@/components/cta/specialist-cta-button';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('home');
  const tFooter = await getTranslations('footer');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <MainNav />
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 bg-gradient-to-b from-blue-50 to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-medium mb-8">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Profesionales verificados en Bariloche
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6 tracking-tight leading-tight">
                {t('hero.titlePro')}
              </h1>
              
              <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                {t('hero.subtitlePro')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <SpecialistCtaButton
                  locale={locale}
                  className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                  {t('hero.ctaProfessional')}
                </SpecialistCtaButton>
                <Link
                  href={`/${locale}/professionals`}
                  className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  {t('hero.ctaClient')}
                </Link>
              </div>
              
              {/* Trust indicators */}
              <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Sin costos ocultos</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Elegí qué trabajos tomar</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>100% gratis</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                {t('forProfessionals.title')}
              </h2>
              <p className="text-xl text-blue-600 font-medium">
                {t('forProfessionals.mainMessage')}
              </p>
            </div>

            {/* Pain points */}
            <div className="max-w-4xl mx-auto mb-16">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-5 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-red-700 font-medium text-sm">{t('forProfessionals.pain1')}</p>
                </div>
                <div className="p-5 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-red-700 font-medium text-sm">{t('forProfessionals.pain2')}</p>
                </div>
                <div className="p-5 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-red-700 font-medium text-sm">{t('forProfessionals.pain3')}</p>
                </div>
              </div>
              
              <div className="text-center p-6 rounded-xl bg-green-50 border border-green-200">
                <p className="text-lg text-green-800 font-medium">
                  ✓ {t('forProfessionals.solution')}
                </p>
              </div>
            </div>

            {/* Benefits grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {/* Benefit 1 */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('forProfessionals.benefit1.title')}</h3>
                <p className="text-gray-500 text-sm">{t('forProfessionals.benefit1.desc')}</p>
              </div>

              {/* Benefit 2 */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('forProfessionals.benefit2.title')}</h3>
                <p className="text-gray-500 text-sm">{t('forProfessionals.benefit2.desc')}</p>
              </div>

              {/* Benefit 3 */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('forProfessionals.benefit3.title')}</h3>
                <p className="text-gray-500 text-sm">{t('forProfessionals.benefit3.desc')}</p>
              </div>

              {/* Benefit 4 */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('forProfessionals.benefit4.title')}</h3>
                <p className="text-gray-500 text-sm">{t('forProfessionals.benefit4.desc')}</p>
              </div>
            </div>

            <div className="text-center mt-12">
              <SpecialistCtaButton
                locale={locale}
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                showArrow
              >
                {t('forProfessionals.cta')}
              </SpecialistCtaButton>
            </div>
          </div>
        </section>

        {/* For Clients Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                {t('forClients.title')}
              </h2>
              <p className="text-xl text-gray-500">
                {t('forClients.mainMessage')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {/* Client benefit 1 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('forClients.benefit1.title')}</h3>
                <p className="text-gray-500 text-sm">{t('forClients.benefit1.desc')}</p>
              </div>

              {/* Client benefit 2 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('forClients.benefit2.title')}</h3>
                <p className="text-gray-500 text-sm">{t('forClients.benefit2.desc')}</p>
              </div>

              {/* Client benefit 3 */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('forClients.benefit3.title')}</h3>
                <p className="text-gray-500 text-sm">{t('forClients.benefit3.desc')}</p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link
                href={`/${locale}/client/requests/new`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                {t('forClients.cta')}
              </Link>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-16">
              {t('howItWorks.title')}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {/* For Professionals */}
              <div className="p-8 rounded-2xl bg-blue-50 border border-blue-100">
                <h3 className="text-xl font-bold text-blue-900 mb-8 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t('howItWorks.forPro')}
                </h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{t('howItWorks.proStep1')}</h4>
                      <p className="text-gray-500 text-sm">{t('howItWorks.proStep1Desc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{t('howItWorks.proStep2')}</h4>
                      <p className="text-gray-500 text-sm">{t('howItWorks.proStep2Desc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{t('howItWorks.proStep3')}</h4>
                      <p className="text-gray-500 text-sm">{t('howItWorks.proStep3Desc')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* For Clients */}
              <div className="p-8 rounded-2xl bg-gray-50 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t('howItWorks.forClient')}
                </h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-700 text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{t('howItWorks.clientStep1')}</h4>
                      <p className="text-gray-500 text-sm">{t('howItWorks.clientStep1Desc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-700 text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{t('howItWorks.clientStep2')}</h4>
                      <p className="text-gray-500 text-sm">{t('howItWorks.clientStep2Desc')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-700 text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{t('howItWorks.clientStep3')}</h4>
                      <p className="text-gray-500 text-sm">{t('howItWorks.clientStep3Desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-blue-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('finalCta.title')}
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-xl mx-auto">
              {t('finalCta.subtitle')}
            </p>
            <Link
              href={`/${locale}/register`}
              className="inline-flex items-center gap-2 px-10 py-4 bg-white text-blue-600 font-bold text-lg rounded-xl hover:bg-blue-50 transition-colors"
            >
              {t('finalCta.button')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-2xl font-bold">Specialist</div>
            <p className="text-gray-400 text-sm">{tFooter('copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
