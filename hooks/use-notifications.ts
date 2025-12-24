'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface InAppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, any>;
  readAt?: string;
  createdAt: string;
}

interface ListNotificationsParams {
  unreadOnly?: boolean;
  take?: number;
}

export function useNotifications(params: ListNotificationsParams = {}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async (): Promise<InAppNotification[]> => {
      const searchParams = new URLSearchParams();
      if (params.unreadOnly) {
        searchParams.append('unreadOnly', 'true');
      }
      if (params.take) {
        searchParams.append('take', params.take.toString());
      }
      const queryString = searchParams.toString();
      const url = `/notifications${queryString ? `?${queryString}` : ''}`;
      const response = await apiClient.get<InAppNotification[]>(url);
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useUnreadNotificationsCount() {
  const { data: notifications } = useNotifications({ unreadOnly: true });
  return notifications?.length ?? 0;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient.patch(`/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch('/notifications/read-all');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

