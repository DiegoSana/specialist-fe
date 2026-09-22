'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Request } from '@/types';
import { useAddRequestPhoto, useRemoveRequestPhoto } from '@/hooks/use-completed-work-photos';
import { useUploadFile } from '@/hooks/use-file-upload';
import AuthenticatedImage from '@/components/images/authenticated-image';
import AuthenticatedVideo from '@/components/videos/authenticated-video';
import RequestPhotosLightbox from '@/components/requests/request-photos-lightbox';

interface RequestPhotosSectionProps {
  request: Request;
  /** Whether the viewer may add/remove photos (backend: participants while the request is not terminal). */
  canManage: boolean;
  /** Namespace holding photos/photosDescription/addPhoto/removePhoto/noPhotos/uploadError/removeError. */
  namespace: 'client.requestDetail' | 'specialist.requestDetail';
}

export default function RequestPhotosSection({ request, canManage, namespace }: RequestPhotosSectionProps) {
  const t = useTranslations(namespace);
  const uploadFile = useUploadFile();
  const addPhoto = useAddRequestPhoto();
  const removePhoto = useRemoveRequestPhoto();
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const photos = request.photos ?? [];

  if (!canManage && photos.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{t('photos')}</h3>
      {canManage && (
        <>
          <p className="mb-3 text-xs text-gray-500">{t('photosDescription')}</p>
          <div className="mb-4">
            <input
              type="file"
              accept="image/*,video/*"
              id="request-photo-upload"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setError(null);
                  const uploaded = await uploadFile.mutateAsync({
                    file,
                    category: 'request-photo',
                    requestId: request.id,
                  });
                  await addPhoto.mutateAsync({ requestId: request.id, url: uploaded.url });
                  e.target.value = '';
                } catch (err: any) {
                  setError(err.response?.data?.message || t('uploadError'));
                }
              }}
            />
            <label
              htmlFor="request-photo-upload"
              className="inline-flex cursor-pointer items-center rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
            >
              {t('addPhoto')}
            </label>
          </div>
        </>
      )}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((url, index) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-200">
              {url.match(/\.(mp4|webm|ogg)$/i) ? (
                <AuthenticatedVideo src={url} className="h-full w-full object-cover" controls muted playsInline />
              ) : (
                <AuthenticatedImage
                  src={url}
                  alt={`Photo ${index + 1}`}
                  className="h-full w-full cursor-pointer object-cover transition-opacity hover:opacity-90"
                  onClick={() => {
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              {canManage && (
                <button
                  type="button"
                  title={t('removePhoto')}
                  onClick={async () => {
                    try {
                      await removePhoto.mutateAsync({ requestId: request.id, url });
                    } catch (err: any) {
                      setError(err.response?.data?.message || t('removeError'));
                    }
                  }}
                  className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white opacity-0 transition-opacity hover:bg-red-700 group-hover:opacity-100"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-gray-500">{t('noPhotos')}</p>
      )}
      {photos.length > 0 && (
        <RequestPhotosLightbox
          photos={photos}
          open={lightboxOpen}
          index={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
