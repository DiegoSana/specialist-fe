'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/app-layout';
import { 
  useNotifications, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead,
  InAppNotification 
} from '@/hooks/use-notifications';
import { formatDistanceToNow, format, isThisYear, isToday, isYesterday } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const params = useParams();
  const locale = params.locale as string;
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifications, isLoading } = useNotifications({ 
    unreadOnly: filter === 'unread',
    take: 100 
  });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter(n => !n.readAt).length ?? 0;

  const handleMarkAllRead = async () => {
    await markAllRead.mutateAsync();
  };

  const handleNotificationClick = async (notification: InAppNotification) => {
    if (!notification.readAt) {
      await markRead.mutateAsync(notification.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'REQUEST_INTEREST_EXPRESSED':
        return { icon: '👋', bg: 'bg-purple-100', color: 'text-purple-600' };
      case 'REQUEST_PROFESSIONAL_ASSIGNED':
        return { icon: '✅', bg: 'bg-green-100', color: 'text-green-600' };
      case 'REQUEST_STATUS_CHANGED':
        return { icon: '📋', bg: 'bg-blue-100', color: 'text-blue-600' };
      case 'REVIEW_APPROVED':
        return { icon: '⭐', bg: 'bg-yellow-100', color: 'text-yellow-600' };
      default:
        return { icon: '🔔', bg: 'bg-gray-100', color: 'text-gray-600' };
    }
  };

  const getNotificationLink = (notification: InAppNotification): string | null => {
    const data = notification.data as Record<string, any> | undefined;
    if (!data) return null;

    if (data.requestId) {
      return `/${locale}/client/requests/${data.requestId}`;
    }
    if (data.reviewId) {
      return `/${locale}/profile`;
    }
    return null;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const dateLocale = locale === 'es' ? es : enUS;

      if (isToday(date)) {
        return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale });
      }
      if (isYesterday(date)) {
        return locale === 'es' ? 'Ayer' : 'Yesterday';
      }
      if (isThisYear(date)) {
        return format(date, 'd MMM', { locale: dateLocale });
      }
      return format(date, 'd MMM yyyy', { locale: dateLocale });
    } catch {
      return '';
    }
  };

  // Group notifications by date
  const groupedNotifications = notifications?.reduce((groups, notification) => {
    const date = new Date(notification.createdAt);
    let key: string;

    if (isToday(date)) {
      key = locale === 'es' ? 'Hoy' : 'Today';
    } else if (isYesterday(date)) {
      key = locale === 'es' ? 'Ayer' : 'Yesterday';
    } else if (isThisYear(date)) {
      key = format(date, 'MMMM', { locale: locale === 'es' ? es : enUS });
    } else {
      key = format(date, 'MMMM yyyy', { locale: locale === 'es' ? es : enUS });
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(notification);
    return groups;
  }, {} as Record<string, InAppNotification[]>) ?? {};

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              {t('markAllRead')}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('all')}
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('unread')}
            {unreadCount > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                filter === 'unread' ? 'bg-blue-500' : 'bg-blue-100 text-blue-600'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
              <div key={group}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {group}
                </h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="divide-y divide-gray-100">
                    {groupNotifications.map((notification) => {
                      const { icon, bg } = getNotificationIcon(notification.type);
                      const link = getNotificationLink(notification);
                      
                      const content = (
                        <div
                          className={`flex gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !notification.readAt ? 'bg-blue-50/30' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-2xl">{icon}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            {/* flex-col below sm: the title and date fought for the same row at
                                narrow widths (title has no min-w-0, so it wouldn't shrink past
                                its longest word, forcing the whole row - and the date - to
                                overflow instead of wrapping); stacking them removes that fight
                                entirely, matching the pattern already used for name+meta rows in
                                interested-specialists.tsx. */}
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                              <p className={`min-w-0 text-sm ${!notification.readAt ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                                {notification.title}
                              </p>
                              <span className="flex-shrink-0 whitespace-nowrap text-xs text-gray-400">
                                {formatDate(notification.createdAt)}
                              </span>
                            </div>
                            {notification.body && (
                              <p className="text-sm text-gray-500 mt-1">
                                {notification.body}
                              </p>
                            )}
                          </div>
                          {!notification.readAt && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                          )}
                        </div>
                      );

                      return link ? (
                        <Link key={notification.id} href={link}>
                          {content}
                        </Link>
                      ) : (
                        <div key={notification.id}>{content}</div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700 mb-1">{t('empty')}</p>
              <p className="text-sm text-gray-500">
                {filter === 'unread' 
                  ? (locale === 'es' ? 'No tenés notificaciones sin leer' : "You don't have unread notifications")
                  : (locale === 'es' ? 'Cuando recibas notificaciones, aparecerán aquí' : 'When you receive notifications, they will appear here')
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

