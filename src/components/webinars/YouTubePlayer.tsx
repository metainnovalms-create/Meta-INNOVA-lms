import { webinarService } from '@/services/webinar.service';

interface YouTubePlayerProps {
  url: string;
  title?: string;
  className?: string;
}

export function YouTubePlayer({ url, title = 'YouTube video', className = '' }: YouTubePlayerProps) {
  const embedUrl = webinarService.getEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg aspect-video ${className}`}>
        <p className="text-muted-foreground">Invalid YouTube URL</p>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video rounded-lg overflow-hidden ${className}`}>
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
