import { useState, useEffect, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

interface InvoicePdfPreviewProps {
  attachmentUrl: string;
  title?: string;
}

export function InvoicePdfPreview({ attachmentUrl, title = 'Invoice PDF' }: InvoicePdfPreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Extract storage path from public URL
  const extractStoragePath = (url: string): string | null => {
    try {
      // URL format: .../storage/v1/object/public/invoice-assets/path/to/file.pdf
      const match = url.match(/\/storage\/v1\/object\/public\/invoice-assets\/(.+)$/);
      if (match) return match[1];
      
      // Fallback: try to get everything after invoice-assets/
      const parts = url.split('invoice-assets/');
      if (parts.length > 1) return parts[1];
      
      return null;
    } catch {
      return null;
    }
  };

  // Fetch PDF as blob using storage SDK
  const fetchPdf = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const storagePath = extractStoragePath(attachmentUrl);
      
      if (!storagePath) {
        setError('Invalid attachment URL');
        return;
      }

      const { data: blob, error: downloadError } = await supabase.storage
        .from('invoice-assets')
        .download(storagePath);

      if (downloadError || !blob) {
        console.error('Download error:', downloadError);
        setError('Failed to load PDF file');
        return;
      }

      // Revoke previous object URL
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
  }, [attachmentUrl]);

  useEffect(() => {
    if (attachmentUrl) fetchPdf();
  }, [attachmentUrl, fetchPdf]);

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

  const goToPrevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber((prev) => Math.min(prev + 1, numPages));
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 2.5));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4 bg-muted/30 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4 bg-muted/30 rounded-lg">
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
    <div ref={containerRef} className="flex flex-col items-center w-full">
      {/* Controls */}
      <div className="flex items-center gap-2 mb-3 p-2 bg-muted rounded-lg flex-wrap justify-center w-full">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={goToPrevPage} disabled={pageNumber <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[70px] text-center">
            {pageNumber} / {numPages || '...'}
          </span>
          <Button variant="ghost" size="sm" onClick={goToNextPage} disabled={pageNumber >= numPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[45px] text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={zoomIn} disabled={scale >= 2.5}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Document */}
      <div 
        className="relative overflow-auto w-full border rounded-lg bg-muted/50 p-4"
        style={{ maxHeight: '60vh' }}
        aria-label={`${title} viewer`}
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
            />
          </Document>
        )}
      </div>
    </div>
  );
}
