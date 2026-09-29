import { getTranslations } from 'next-intl/server';
import MainNav from '@/components/navigation/main-nav';
import Footer from '@/components/layout/footer';

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('contact');

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
              <div className="space-y-6 text-gray-600 leading-relaxed">
                <p>{t('intro')}</p>
                <p>
                  <span className="font-semibold text-gray-800">{t('emailLabel')}: </span>
                  {/* Placeholder contact email — replace once a real support channel is decided */}
                  <a href={`mailto:${t('email')}`} className="text-blue-600 hover:underline">
                    {t('email')}
                  </a>
                </p>
                <p>{t('outro')}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
