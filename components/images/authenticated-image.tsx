'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/auth';

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export default function AuthenticatedImage({ src, alt, className, onClick, onError }: AuthenticatedImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // If the URL is public (starts with http and doesn't contain /private/), use it directly
    if (src && !src.includes('/private/')) {
      setImageUrl(src);
      return;
    }

    // For private URLs, we need to fetch with authentication
    const loadImage = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setError(true);
          return;
        }

        // Extract the path from the full URL
        const url = new URL(src);
        const path = url.pathname.replace('/api/storage/', '');
        
        // Fetch the image as a blob with authentication
        const response = await fetch(`${url.origin}${url.pathname}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load image');
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);

        // Cleanup function
        return () => {
          URL.revokeObjectURL(objectUrl);
        };
      } catch (err) {
        console.error('Error loading authenticated image:', err);
        setError(true);
      }
    };

    loadImage();
  }, [src]);

  if (error || !imageUrl) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className || ''}`}>
        <span className="text-gray-400 text-sm">Error loading image</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={onError}
    />
  );
}

