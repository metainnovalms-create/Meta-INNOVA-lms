import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2, Star, Check, X } from 'lucide-react';
import { HRRating } from '@/hooks/useHRRatings';
import { format } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import { HRRatingPDF } from './pdf/HRRatingPDF';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rating: HRRating | null;
}

export function HRRatingViewDialog({ open, onOpenChange, rating }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!rating) return null;

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const blob = await pdf(<HRRatingPDF rating={rating} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HR_Rating_${rating.trainer_name.replace(/\s+/g, '_')}_${rating.period}_${rating.year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'PDF downloaded successfully' });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ title: 'Failed to generate PDF', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  const projectRatings = rating.project_ratings || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] print:max-w-none print:max-h-none print:h-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            HR Star Rating - {rating.trainer_name}
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={isDownloading}>
              {isDownloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Download PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4 print:h-auto print:overflow-visible">
          {/* Print Header */}
          <div className="hidden print:block text-center mb-6">
            <h1 className="text-xl font-bold">Trainer Star Summary Sheet</h1>
            <p className="text-sm text-muted-foreground">Maintained by HR, shared quarterly with trainers</p>
          </div>

          <div className="space-y-6">
            {/* Header Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trainer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Trainer Name:</span> {rating.trainer_name}</div>
                  <div><span className="font-medium">Employee ID:</span> {rating.employee_id}</div>
                  <div><span className="font-medium">Period:</span> {rating.period} {rating.year}</div>
                  <div><span className="font-medium">Created:</span> {format(new Date(rating.created_at), 'MMM dd, yyyy')}</div>
                </div>
              </CardContent>
            </Card>

            {/* Project Ratings Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                {projectRatings.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Project Title</th>
                        <th className="text-left p-2">Competition Level</th>
                        <th className="text-left p-2">Result</th>
                        <th className="text-left p-2">Stars Earned</th>
                        <th className="text-left p-2">Verified by HR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectRatings.map(project => (
                        <tr key={project.id} className="border-b">
                          <td className="p-2 font-medium">{project.project_title}</td>
                          <td className="p-2">{project.competition_level}</td>
                          <td className="p-2">{project.result}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: project.stars_earned }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              ))}
                              {Array.from({ length: 5 - project.stars_earned }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 text-muted" />
                              ))}
                            </div>
                          </td>
                          <td className="p-2">
                            {project.verified_by_hr ? (
                              <Badge variant="default" className="bg-green-500">
                                <Check className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <X className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-muted-foreground text-sm">No project ratings recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Totals */}
            <Card className="bg-muted">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Total Stars This Quarter</p>
                    <div className="flex items-center justify-center gap-2">
                      <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                      <span className="text-4xl font-bold">{rating.total_stars_quarter}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Cumulative Stars This Year</p>
                    <div className="flex items-center justify-center gap-2">
                      <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                      <span className="text-4xl font-bold">{rating.cumulative_stars_year}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground print:mt-8">
              <p>Issued by: Human Resource Management (HRM), Meta-Innova Corporation</p>
              <p>Version 1.0 | Generated on {format(new Date(), 'MMMM dd, yyyy')}</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}