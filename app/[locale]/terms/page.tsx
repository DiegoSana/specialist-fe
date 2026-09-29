import { getTranslations } from 'next-intl/server';
import MainNav from '@/components/navigation/main-nav';
import Footer from '@/components/layout/footer';

const SECTION_KEYS = [
  'section1',
  'section2',
  'section3',
  'section4',
  'section5',
  'section6',
  'section7',
] as const;

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('terms');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="fixed w-full z-50 bg-white border-b border-gray-200 shadow-sm">
        <MainNav />
      </header>

      <main className="flex-1 pt-16">
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">{t('title')}</h1>

              <p className="mb-10 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 leading-relaxed">
                {t('notice')}
              </p>

              <div className="space-y-8 text-gray-600 leading-relaxed">
                {SECTION_KEYS.map((key) => (
                  <div key={key}>
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">{t(`${key}.title`)}</h2>
                    <p>{t(`${key}.body`)}</p>
                  </div>
                ))}
              </div>

              <p className="mt-10 text-sm text-gray-400">{t('legalEntity')}</p>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
