'use client';

import { useMemo } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import AuthenticatedImage from '@/components/images/authenticated-image';

interface RequestPhotosLightboxProps {
  /** All photo/video URLs; only images are shown in the lightbox. */
  photos: string[];
  open: boolean;
  /** Index in the full `photos` array of the item that was clicked (used to show the corresponding image). */
  index: number;
  onClose: () => void;
}

const isImage = (url: string) => !url.match(/\.(mp4|webm|ogg)$/i);

export default function RequestPhotosLightbox({
  photos,
  open,
  index,
  onClose,
}: RequestPhotosLightboxProps) {
  const imageUrls = useMemo(() => photos.filter(isImage), [photos]);

  const resolvedIndex = useMemo(() => {
    if (imageUrls.length === 0) return 0;
    const selectedUrl = photos[index];
    const idx = imageUrls.indexOf(selectedUrl);
    return idx >= 0 ? idx : 0;
  }, [photos, index, imageUrls]);

  if (imageUrls.length === 0) return null;

  const slides = imageUrls.map((src, i) => ({ src, alt: `Photo ${i + 1}` }));

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={resolvedIndex}
      slides={slides}
      render={{
        slide: ({ slide }) => (
          <div className="flex items-center justify-center w-full h-full min-h-[50vh] bg-black">
            <AuthenticatedImage
              src={slide.src}
              alt={slide.alt || 'Photo'}
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
            />
          </div>
        ),
      }}
    />
  );
}
