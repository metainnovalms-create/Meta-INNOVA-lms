import { useState, useEffect } from 'react';
import { getContentSignedUrl } from '@/services/courseStorage.service';

interface ThumbnailResult {
  url: string | null;
  isLoading: boolean;
  error: string | null;
}

// Cache for signed URLs to avoid repeated fetches
const urlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Hook to resolve thumbnail paths to signed URLs from private storage
 * Handles caching to avoid repeated API calls
 */
export function useThumbnailUrl(thumbnailPath: string | null | undefined): ThumbnailResult {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      // Reset state
      setError(null);
      
      // No path provided
      if (!thumbnailPath) {
        setUrl(null);
        setIsLoading(false);
        return;
      }

      // Already a full URL (http/https)
      if (thumbnailPath.startsWith('http://') || thumbnailPath.startsWith('https://')) {
        setUrl(thumbnailPath);
        setIsLoading(false);
        return;
      }

      // Check cache first
      const cached = urlCache.get(thumbnailPath);
      if (cached && cached.expiresAt > Date.now()) {
        setUrl(cached.url);
        setIsLoading(false);
        return;
      }

      // Fetch signed URL from storage
      setIsLoading(true);
      try {
        const signedUrl = await getContentSignedUrl(thumbnailPath, 3600); // 1 hour expiry
        if (signedUrl) {
          // Cache the URL (expire 5 minutes before actual expiry for safety)
          urlCache.set(thumbnailPath, {
            url: signedUrl,
            expiresAt: Date.now() + (55 * 60 * 1000) // 55 minutes
          });
          setUrl(signedUrl);
        } else {
          setError('Failed to load thumbnail');
          setUrl(null);
        }
      } catch (err) {
        console.error('Error fetching thumbnail URL:', err);
        setError('Failed to load thumbnail');
        setUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignedUrl();
  }, [thumbnailPath]);

  return { url, isLoading, error };
}

/**
 * Component wrapper to display thumbnail with loading state
 */
export function useThumbnailUrls(paths: (string | null | undefined)[]): Map<string, ThumbnailResult> {
  const [results, setResults] = useState<Map<string, ThumbnailResult>>(new Map());

  useEffect(() => {
    const fetchAll = async () => {
      const newResults = new Map<string, ThumbnailResult>();
      
      for (const path of paths) {
        if (!path) continue;
        
        // Already a full URL
        if (path.startsWith('http://') || path.startsWith('https://')) {
          newResults.set(path, { url: path, isLoading: false, error: null });
          continue;
        }

        // Check cache
        const cached = urlCache.get(path);
        if (cached && cached.expiresAt > Date.now()) {
          newResults.set(path, { url: cached.url, isLoading: false, error: null });
          continue;
        }

        // Need to fetch
        newResults.set(path, { url: null, isLoading: true, error: null });
      }
      
      setResults(new Map(newResults));

      // Fetch non-cached URLs
      for (const path of paths) {
        if (!path) continue;
        if (path.startsWith('http://') || path.startsWith('https://')) continue;
        
        const cached = urlCache.get(path);
        if (cached && cached.expiresAt > Date.now()) continue;

        try {
          const signedUrl = await getContentSignedUrl(path, 3600);
          if (signedUrl) {
            urlCache.set(path, {
              url: signedUrl,
              expiresAt: Date.now() + (55 * 60 * 1000)
            });
            setResults(prev => {
              const updated = new Map(prev);
              updated.set(path, { url: signedUrl, isLoading: false, error: null });
              return updated;
            });
          }
        } catch (err) {
          setResults(prev => {
            const updated = new Map(prev);
            updated.set(path, { url: null, isLoading: false, error: 'Failed to load' });
            return updated;
          });
        }
      }
    };

    if (paths.length > 0) {
      fetchAll();
    }
  }, [paths.join(',')]);

  return results;
}
