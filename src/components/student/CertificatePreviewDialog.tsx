import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StudentCertificate } from '@/types/gamification';
import { gamificationDbService } from '@/services/gamification-db.service';
import { Download, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CertificatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: StudentCertificate;
}

export function CertificatePreviewDialog({
  open,
  onOpenChange,
  certificate
}: CertificatePreviewDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<any>(null);
  const [templateLoaded, setTemplateLoaded] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setLoading(true);
      setTemplate(null);
      setTemplateLoaded(false);
    }
  }, [open]);

  // Load template when dialog opens
  useEffect(() => {
    if (open && certificate) {
      loadTemplate();
    }
  }, [open, certificate]);

  // Draw on canvas AFTER template is loaded and canvas is in DOM
  useEffect(() => {
    if (!templateLoaded || !canvasRef.current) return;

    const draw = async () => {
      if (template) {
        await drawCertificate(template);
      } else {
        drawDefaultCertificate();
      }
      setLoading(false);
    };

    draw();
  }, [templateLoaded, template]);

  const loadTemplate = async () => {
    setLoading(true);
    setTemplateLoaded(false);
    try {
      const templates = await gamificationDbService.getCertificateTemplates();
      const foundTemplate = templates.find(t => t.id === certificate.template_id) || templates[0];
      setTemplate(foundTemplate || null);
    } catch (error) {
      console.error('Error loading template:', error);
      setTemplate(null);
    } finally {
      setTemplateLoaded(true);
    }
  };

  const drawDefaultCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not available for default certificate');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 900;

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1200, 900);
    gradient.addColorStop(0, '#1e3a5f');
    gradient.addColorStop(1, '#0d1b2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 900);

    // Border
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 8;
    ctx.strokeRect(30, 30, 1140, 840);

    // Inner border
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 1100, 800);

    // Title
    ctx.font = 'bold 60px serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.fillText('Certificate of Completion', 600, 150);

    // Subtitle
    ctx.font = '24px serif';
    ctx.fillStyle = '#e0e0e0';
    ctx.fillText('This is to certify that', 600, 280);

    // Student Name
    ctx.font = 'bold 48px serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(certificate.student_name, 600, 370);

    // Achievement text
    ctx.font = '24px serif';
    ctx.fillStyle = '#e0e0e0';
    ctx.fillText('has successfully completed', 600, 450);

    // Activity Name
    ctx.font = 'bold 36px serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(certificate.activity_name, 600, 520);

    // Date
    ctx.font = '20px serif';
    ctx.fillStyle = '#b0b0b0';
    const date = new Date(certificate.completion_date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    ctx.fillText(`Issued on ${date}`, 600, 620);

    // Verification code
    ctx.font = '16px monospace';
    ctx.fillStyle = '#808080';
    ctx.fillText(`Verification: ${certificate.verification_code}`, 600, 820);
  };

  const drawCertificate = (tmpl: any): Promise<void> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error('Canvas not available for template certificate');
        resolve();
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve();
        return;
      }

      canvas.width = tmpl.default_width || 1200;
      canvas.height = tmpl.default_height || 900;

      if (tmpl.template_image_url) {
        const img = new Image();
        // Only set crossOrigin for external URLs, not for data URLs (Base64)
        if (!tmpl.template_image_url.startsWith('data:')) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          drawTextOnCertificate(ctx, tmpl);
          resolve();
        };
        img.onerror = (e) => {
          console.error('Failed to load template image:', e);
          drawDefaultCertificate();
          resolve();
        };
        img.src = tmpl.template_image_url;
      } else {
        drawDefaultCertificate();
        resolve();
      }
    });
  };

  const drawTextOnCertificate = (ctx: CanvasRenderingContext2D, tmpl: any) => {
    const namePos = tmpl.name_position || { x: 600, y: 450, fontSize: 48, color: '#1e3a8a', fontFamily: 'serif' };
    const datePos = tmpl.date_position || { x: 600, y: 520, fontSize: 24, color: '#374151' };
    
    // Draw student name
    ctx.font = `${namePos.fontSize}px ${namePos.fontFamily || 'serif'}`;
    ctx.fillStyle = namePos.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(certificate.student_name, namePos.x, namePos.y);

    // Draw date
    ctx.font = `${datePos.fontSize}px serif`;
    ctx.fillStyle = datePos.color;
    const date = new Date(certificate.completion_date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    ctx.fillText(date, datePos.x, datePos.y);

    // Draw course name if position exists
    const courseNamePos = tmpl.course_name_position;
    if (courseNamePos) {
      ctx.font = `${courseNamePos.fontSize || 32}px ${courseNamePos.fontFamily || 'serif'}`;
      ctx.fillStyle = courseNamePos.color || '#1e3a8a';
      ctx.fillText(certificate.activity_name.split(' - ')[1] || '', courseNamePos.x, courseNamePos.y);
    }

    // Draw level title if position exists
    const levelTitlePos = tmpl.level_title_position;
    if (levelTitlePos) {
      ctx.font = `${levelTitlePos.fontSize || 28}px ${levelTitlePos.fontFamily || 'serif'}`;
      ctx.fillStyle = levelTitlePos.color || '#374151';
      ctx.fillText(certificate.activity_name.split(' - ')[0] || '', levelTitlePos.x, levelTitlePos.y);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificate.verification_code}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Certificate downloaded');
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/verify/${certificate.verification_code}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate: ${certificate.activity_name}`,
          text: `Check out my certificate for ${certificate.activity_name}`,
          url
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Certificate link copied to clipboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Certificate Preview</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative min-h-[450px]">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted rounded z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <canvas 
              ref={canvasRef} 
              className={cn("w-full border rounded", loading && "invisible")} 
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-1">
              <p className="text-sm font-medium">{certificate.activity_name}</p>
              <p className="text-xs text-muted-foreground">
                Verification Code: {certificate.verification_code}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownload} disabled={loading}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
