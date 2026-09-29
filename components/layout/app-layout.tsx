'use client';

import { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import MainNav from '../navigation/main-nav';
import Footer from './footer';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'es';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <MainNav />
      </header>
      <main className="flex-1">{children}</main>
      <Footer locale={locale} />
    </div>
  );
}
