import { useThumbnailUrl } from '@/hooks/useThumbnailUrl';
import { BookOpen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThumbnailImageProps {
  thumbnailPath: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Component to display course thumbnails with automatic signed URL resolution
 */
export function ThumbnailImage({ 
  thumbnailPath, 
  alt, 
  className = "w-20 h-20 rounded-lg object-cover",
  fallbackClassName = "w-20 h-20 rounded-lg bg-muted flex items-center justify-center"
}: ThumbnailImageProps) {
  const { url, isLoading } = useThumbnailUrl(thumbnailPath);

  if (isLoading) {
    return (
      <div className={cn(fallbackClassName, "animate-pulse")}>
        <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!url) {
    return (
      <div className={fallbackClassName}>
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={(e) => {
        // Fallback to icon on error
        const target = e.currentTarget;
        target.style.display = 'none';
        const fallback = target.nextElementSibling;
        if (fallback) {
          (fallback as HTMLElement).style.display = 'flex';
        }
      }}
    />
  );
}
