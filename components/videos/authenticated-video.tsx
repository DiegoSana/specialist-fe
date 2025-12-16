'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/auth';

interface AuthenticatedVideoProps {
  src: string;
  className?: string;
  controls?: boolean;
  muted?: boolean;
  playsInline?: boolean;
}

export default function AuthenticatedVideo({ src, className, controls, muted, playsInline }: AuthenticatedVideoProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // If the URL is public (starts with http and doesn't contain /private/), use it directly
    if (src && !src.includes('/private/')) {
      setVideoUrl(src);
      return;
    }

    // For private URLs, we need to fetch with authentication
    const loadVideo = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setError(true);
          return;
        }

        // Extract the path from the full URL
        const url = new URL(src);
        
        // Fetch the video as a blob with authentication
        const response = await fetch(`${url.origin}${url.pathname}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load video');
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setVideoUrl(objectUrl);

        // Cleanup function
        return () => {
          URL.revokeObjectURL(objectUrl);
        };
      } catch (err) {
        console.error('Error loading authenticated video:', err);
        setError(true);
      }
    };

    loadVideo();
  }, [src]);

  if (error || !videoUrl) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className || ''}`}>
        <span className="text-gray-400 text-sm">Error loading video</span>
      </div>
    );
  }

  return (
    <video
      src={videoUrl}
      className={className}
      controls={controls}
      muted={muted}
      playsInline={playsInline}
    />
  );
}

