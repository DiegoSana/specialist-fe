'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getUser, isAuthenticated, removeAuthToken, removeUser, USER_KEY } from '@/lib/auth';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import NotificationBell from '@/components/notifications/notification-bell';

export default function MainNav() {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUserState] = useState<any | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Get professional profile for profile image
  const { data: professionalProfile } = useMyProfessionalProfile();

  // Initialize user state on client side only
  useEffect(() => {
    const initialUser = getUser();
    if (initialUser) {
      setUserState(initialUser);
    }
  }, []);

  // Listen for user updates
  useEffect(() => {
    const handleUserUpdate = (event: CustomEvent) => {
      setUserState(event.detail);
      const updatedUser = getUser();
      if (updatedUser) {
        setUserState(updatedUser);
      }
    };

    window.addEventListener('userUpdated', handleUserUpdate as EventListener);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_KEY) {
        const updatedUser = getUser();
        if (updatedUser) {
          setUserState(updatedUser);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const isActive = (path: string) => {
    return pathname?.includes(path);
  };

  const handleLogout = () => {
    try {
      removeAuthToken();
      removeUser();
      setMobileMenuOpen(false);
      const locale = pathname?.split('/')[1] || 'es';
      router.push(`/${locale}/login`);
      router.refresh();
    } catch (error) {
      console.error('Error during logout:', error);
      const locale = pathname?.split('/')[1] || 'es';
      router.push(`/${locale}/login`);
    }
  };

  const locale = pathname?.split('/')[1] || 'es';

  // Navigation items based on user profiles
  const navItems = [];

  // Always show Specialists link
  navItems.push({
    href: `/${locale}/professionals`,
    label: t('specialists'),
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  });

  if (user?.hasClientProfile) {
    navItems.push({
      href: `/${locale}/client/dashboard`,
      label: t('client.dashboard'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    });
    navItems.push({
      href: `/${locale}/client/requests/new`,
      label: t('client.newRequest'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
    });
  }

  if (user?.hasProfessionalProfile) {
    navItems.push({
      href: `/${locale}/specialist/job-board`,
      label: t('specialist.jobBoard'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    });
    navItems.push({
      href: `/${locale}/specialist/dashboard`,
      label: t('specialist.dashboard'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    });
  }

  if (user?.isAdmin) {
    navItems.push({
      href: `/${locale}/admin/dashboard`,
      label: t('admin.dashboard'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    });
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center h-16">
        {/* Logo */}
        <Link href={user && user.hasClientProfile ? `/${locale}/client/dashboard` : user && user.hasProfessionalProfile ? `/${locale}/specialist/dashboard` : `/${locale}`} className="flex items-center">
          <span className="text-2xl font-bold text-blue-600">
            Specialist
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Notifications Bell + User Menu */}
        <div className="hidden md:flex items-center gap-2">
          {/* Notification Bell - only show when logged in */}
          {user && <NotificationBell />}

        {/* User Menu Dropdown or Login Buttons */}
          <div className="relative" ref={userMenuRef}>
          {user ? (
            <>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Profile Image */}
                {(() => {
                  const imageUrl = user?.profilePictureUrl || professionalProfile?.profileImage;
                  return imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`${user?.firstName} ${user?.lastName}`}
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  );
                })()}
                {/* User Name */}
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">
                    {user.firstName} {user.lastName}
                  </p>
                  <div className="flex gap-1">
                    {user.hasClientProfile && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                        {t('client.badge')}
                      </span>
                    )}
                    {user.hasProfessionalProfile && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-600 rounded">
                        {t('specialist.badge')}
                      </span>
                    )}
                    {user.isAdmin && (
                      <span className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">
                        {t('admin.badge')}
                      </span>
                    )}
                  </div>
                </div>
                {/* Dropdown Arrow */}
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    userMenuOpen ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-gray-200 z-50">
                  <div className="py-1">
                    <Link
                      href={`/${locale}/profile`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      {t('profile')}
                    </Link>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      {t('logout')}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href={`/${locale}/login`}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
              >
                {t('loginButton')}
              </Link>
              <Link
                href={`/${locale}/register`}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('registerButton')}
              </Link>
            </div>
          )}
          </div>
        </div>

        {/* Mobile: Notification Bell + Menu button */}
        <div className="md:hidden flex items-center gap-1">
          {user && <NotificationBell />}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden py-4 border-t border-gray-200">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            {user ? (
              <>
                <div className="px-4 py-3 flex items-center gap-3">
                  {(() => {
                    const imageUrl = user?.profilePictureUrl || professionalProfile?.profileImage;
                    return imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={`${user?.firstName} ${user?.lastName}`}
                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    );
                  })()}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {user?.hasClientProfile && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                          {t('client.badge')}
                        </span>
                      )}
                      {user.hasProfessionalProfile && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-600 rounded">
                          {t('specialist.badge')}
                        </span>
                      )}
                      {user.isAdmin && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">
                          {t('admin.badge')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/${locale}/profile`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {t('profile')}
                </Link>
                <Link
                  href={`/${locale}/notifications`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {t('notifications')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  {t('logout')}
                </button>
              </>
            ) : (
              <div className="px-4 py-3 space-y-2">
                <Link
                  href={`/${locale}/login`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg"
                >
                  {t('loginButton')}
                </Link>
                <Link
                  href={`/${locale}/register`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('registerButton')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
