import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertCircle, RefreshCw, Maximize, Minimize } from 'lucide-react';
import { downloadCourseContent } from '@/services/courseStorage.service';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker (bundle locally to avoid CDN/CSP/adblock issues)
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

interface PDFViewerProps {
  filePath: string;
  title: string;
}

export function PDFViewer({ filePath, title }: PDFViewerProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(0.5);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // For fit-to-width calculation
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [initialFitDone, setInitialFitDone] = useState<boolean>(false);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Track container width with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(width);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Fetch PDF as blob using storage SDK (bypasses CORS)
  const fetchPdf = useCallback(async () => {
    setLoading(true);
    setError(null);
    setInitialFitDone(false);

    try {
      const blob = await downloadCourseContent(filePath);
      if (!blob) {
        setError('Failed to load PDF file');
        return;
      }

      // Revoke any previous object URL
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      setObjectUrl(url);
    } catch (err) {
      console.error('Error fetching PDF:', err);
      setError('An error occurred while loading the PDF');
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  useEffect(() => {
    if (filePath) fetchPdf();
  }, [filePath, fetchPdf]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('PDF render error:', err);
    setError('Failed to render PDF');
  }, []);

  // Called when each page renders - use to get page dimensions and auto-fit
  const onPageLoadSuccess = useCallback(({ width }: { width: number }) => {
    setPageWidth(width);
    
    // Auto fit-to-width on initial load
    if (!initialFitDone && containerWidth > 0 && width > 0) {
      const padding = 48; // Account for container padding
      const availableWidth = containerWidth - padding;
      const fitScale = Math.min(availableWidth / width, 2.0);
      setScale(Math.max(fitScale, 0.5));
      setInitialFitDone(true);
    }
  }, [containerWidth, initialFitDone]);


  // Fullscreen toggle
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

  // Sync fullscreen state with document
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const goToPrevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber((prev) => Math.min(prev + 1, numPages));
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 2.5));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4" aria-label={`${title} PDF loading`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4" aria-label={`${title} PDF error`}>
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchPdf}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col items-center select-none w-full ${isFullscreen ? 'bg-background h-screen p-4' : ''}`}
      onContextMenu={handleContextMenu} 
      style={{ userSelect: 'none' }}
    >
      {/* Controls */}
      <div className="flex items-center gap-2 sm:gap-4 mb-4 p-2 bg-muted rounded-lg flex-wrap justify-center">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={goToPrevPage} disabled={pageNumber <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[60px] sm:min-w-[80px] text-center">
            {pageNumber} / {numPages || '...'}
          </span>
          <Button variant="ghost" size="sm" onClick={goToNextPage} disabled={pageNumber >= numPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-4 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[45px] text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={zoomIn} disabled={scale >= 2.5}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-4 w-px bg-border hidden sm:block" />

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* PDF Document - responsive container */}
      <div 
        className={`relative overflow-auto w-full border rounded-lg bg-muted/50 p-4 sm:p-6 ${isFullscreen ? 'flex-1' : 'max-h-[70vh]'}`}
        aria-label={`${title} PDF viewer`}
      >
        {objectUrl && (
          <Document
            file={objectUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
            className="flex justify-center"
            aria-label={title}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg"
              onLoadSuccess={onPageLoadSuccess}
            />
          </Document>
        )}
      </div>
    </div>
  );
}
