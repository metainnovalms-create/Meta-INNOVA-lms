import { useState, useEffect } from 'react';
import { getContentSignedUrl } from '@/services/courseStorage.service';
import { Loader2, ImageOff } from 'lucide-react';

interface StorageImageProps {
  filePath: string | null | undefined;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export function StorageImage({ 
  filePath, 
  alt, 
  className = '', 
  fallbackSrc = '/placeholder.svg' 
}: StorageImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      setHasError(false);

      if (!filePath) {
        setImageUrl(fallbackSrc);
        setIsLoading(false);
        return;
      }

      // Check if it's already a full URL (http/https)
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        setImageUrl(filePath);
        setIsLoading(false);
        return;
      }

      // Check if it's a base64 image
      if (filePath.startsWith('data:image')) {
        setImageUrl(filePath);
        setIsLoading(false);
        return;
      }

      // It's a storage path - get signed URL
      try {
        const signedUrl = await getContentSignedUrl(filePath, 3600 * 24); // 24 hours
        if (signedUrl) {
          setImageUrl(signedUrl);
        } else {
          setImageUrl(fallbackSrc);
        }
      } catch (error) {
        console.error('Failed to load storage image:', error);
        setImageUrl(fallbackSrc);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [filePath, fallbackSrc]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasError && !imageUrl) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <ImageOff className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl || fallbackSrc}
      alt={alt}
      className={className}
      onError={() => {
        setImageUrl(fallbackSrc);
        setHasError(true);
      }}
    />
  );
}
