import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations('footer');

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-bold">Specialist</div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
            <Link href={`/${locale}/about`} className="hover:text-white transition-colors">
              {t('links.about')}
            </Link>
            <Link href={`/${locale}/contact`} className="hover:text-white transition-colors">
              {t('links.contact')}
            </Link>
            <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">
              {t('links.terms')}
            </Link>
          </nav>
          <p className="text-gray-400 text-sm">{t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
