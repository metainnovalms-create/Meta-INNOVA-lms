import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize, Minimize } from 'lucide-react';

interface FullscreenWrapperProps {
  children: ReactNode;
  className?: string;
}

export function FullscreenWrapper({ children, className = '' }: FullscreenWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`relative ${isFullscreen ? 'bg-background' : ''} ${className}`}
    >
      {children}
      <Button
        variant="secondary"
        size="icon"
        onClick={toggleFullscreen}
        className="absolute top-2 right-2 z-10 opacity-80 hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? (
          <Minimize className="h-4 w-4" />
        ) : (
          <Maximize className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
