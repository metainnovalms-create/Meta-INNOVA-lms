import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Loader2, Star } from 'lucide-react';
import { PerformanceAppraisal } from '@/hooks/usePerformanceAppraisals';
import { format } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import { PerformanceAppraisalPDF } from './pdf/PerformanceAppraisalPDF';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appraisal: PerformanceAppraisal | null;
}

export function AppraisalViewDialog({ open, onOpenChange, appraisal }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!appraisal) return null;

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const blob = await pdf(<PerformanceAppraisalPDF appraisal={appraisal} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Performance_Appraisal_${appraisal.trainer_name.replace(/\s+/g, '_')}.pdf`;
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      draft: { variant: 'outline', label: 'Draft' },
      submitted: { variant: 'secondary', label: 'Submitted' },
      manager_reviewed: { variant: 'default', label: 'Manager Reviewed' },
      principal_reviewed: { variant: 'default', label: 'Principal Reviewed' },
      completed: { variant: 'default', label: 'Completed' }
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] print:max-w-none print:max-h-none print:h-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Performance Appraisal - {appraisal.trainer_name}
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={isDownloading}>
              {isDownloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Download PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4 print:h-auto print:overflow-visible">
          {/* Print Header */}
          <div className="hidden print:block text-center mb-6">
            <h1 className="text-xl font-bold">Annual Trainer Self-Appraisal Form</h1>
            <p className="text-sm text-muted-foreground">STEM Trainer / Senior STEM Trainer</p>
          </div>

          <div className="space-y-6">
            {/* Section 1: Trainer Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">1. Trainer Profile & Project Engagement Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {appraisal.trainer_name}</div>
                  <div><span className="font-medium">Employee ID:</span> {appraisal.employee_id}</div>
                  <div><span className="font-medium">Institution:</span> {appraisal.institution_name}</div>
                  <div><span className="font-medium">Status:</span> {getStatusBadge(appraisal.status)}</div>
                  <div className="col-span-2">
                    <span className="font-medium">Reporting Period:</span>{' '}
                    {format(new Date(appraisal.reporting_period_from), 'MMM dd, yyyy')} - {format(new Date(appraisal.reporting_period_to), 'MMM dd, yyyy')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Lab Domains */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2. Lab Domains Handled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {appraisal.lab_domains.map(domain => (
                    <Badge key={domain} variant="secondary">{domain}</Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Total Projects Mentored:</span> {appraisal.total_projects_mentored}</div>
                  <div><span className="font-medium">Total Instructional Hours:</span> {appraisal.total_instructional_hours}</div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Projects Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">3. Summary of Projects Mentored</CardTitle>
              </CardHeader>
              <CardContent>
                {appraisal.projects_summary && appraisal.projects_summary.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Project Title</th>
                        <th className="text-left p-2">Grade</th>
                        <th className="text-left p-2">Domain</th>
                        <th className="text-left p-2">Contest</th>
                        <th className="text-left p-2">Level</th>
                        <th className="text-left p-2">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appraisal.projects_summary.map(project => (
                        <tr key={project.id} className="border-b">
                          <td className="p-2">{project.project_title}</td>
                          <td className="p-2">{project.grade_level}</td>
                          <td className="p-2">{project.domain}</td>
                          <td className="p-2">{project.contest_name}</td>
                          <td className="p-2 capitalize">{project.level}</td>
                          <td className="p-2">{project.result}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-muted-foreground text-sm">No projects recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Section 4: Self-Reflection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">4. Self-Reflection and Contribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Key Contributions</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {appraisal.key_contributions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium text-sm mb-2">Innovations Introduced</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {appraisal.innovations_introduced.map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium text-sm mb-2">Student Mentorship Experience</h4>
                  <p className="text-sm">{appraisal.student_mentorship_experience}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium text-sm mb-2">Collaboration & Coordination</h4>
                  <p className="text-sm">{appraisal.collaboration_coordination}</p>
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Student Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">5. Student Feedback Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  {Object.entries({
                    concept_clarity: 'Concept Clarity',
                    responsiveness: 'Responsiveness',
                    mentorship_quality: 'Mentorship Quality',
                    contest_preparation: 'Contest Preparation',
                    overall_satisfaction: 'Overall Satisfaction'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="font-medium">{label}:</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        {appraisal.student_feedback[key as keyof typeof appraisal.student_feedback]}/5
                      </div>
                    </div>
                  ))}
                </div>
                {appraisal.student_comments_summary && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Comments Summary</h4>
                    <p className="text-sm">{appraisal.student_comments_summary}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 6: Forward Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">6. Forward Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Future Goals</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {appraisal.future_goals.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium text-sm mb-2">Planned Trainings</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {appraisal.planned_trainings.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium text-sm mb-2">Support Needed</h4>
                  <p className="text-sm">{appraisal.support_needed}</p>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            {(appraisal.manager_review || appraisal.principal_review || appraisal.hr_review) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Official Reviews & Sign-offs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {appraisal.manager_review && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium text-sm">Manager Review</h4>
                      <p className="text-xs text-muted-foreground">{appraisal.manager_review.reviewer_name} - {appraisal.manager_review.reviewer_designation}</p>
                      <p className="text-sm mt-2">{appraisal.manager_review.comments}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">{appraisal.manager_review.rating}/5</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(appraisal.manager_review.signature_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  )}
                  {appraisal.principal_review && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium text-sm">Principal Review</h4>
                      <p className="text-xs text-muted-foreground">{appraisal.principal_review.reviewer_name} - {appraisal.principal_review.reviewer_designation}</p>
                      <p className="text-sm mt-2">{appraisal.principal_review.comments}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">{appraisal.principal_review.rating}/5</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(appraisal.principal_review.signature_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}