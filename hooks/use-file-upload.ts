'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface UploadFileResponse {
  id: string;
  originalFilename: string;
  storedFilename: string;
  path: string;
  url: string;
  category: 'profile-picture' | 'project-image' | 'project-video' | 'request-photo';
  mimeType: string;
  size: number;
  ownerId: string | null;
  requestId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadFileParams {
  file: File;
  category: 'profile-picture' | 'project-image' | 'project-video' | 'request-photo';
  requestId?: string;
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, category, requestId }: UploadFileParams): Promise<UploadFileResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      if (requestId) {
        formData.append('requestId', requestId);
      }

      const response = await apiClient.post<UploadFileResponse>('/storage/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['professional'] });
    },
  });
}

