'use client';

import { ReactNode } from 'react';
import MainNav from '../navigation/main-nav';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <MainNav />
      </header>
      <main>{children}</main>
    </div>
  );
}
