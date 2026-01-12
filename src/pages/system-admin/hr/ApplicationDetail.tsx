import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, Mail, Phone, Building2, Calendar, FileText,
  User, Briefcase, Clock, DollarSign, CheckCircle, XCircle,
  MessageSquare, Plus, Download, Send, UserPlus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  useJobApplication, 
  useUpdateApplication,
  useCandidateInterviews,
  useInterviewStages,
  useCandidateOffers,
  useUpdateOffer,
  useSendOffer
} from '@/hooks/useHRManagement';
import { format } from 'date-fns';
import { ScheduleInterviewDialog } from '@/components/hr/interviews/ScheduleInterviewDialog';
import { CreateOfferDialog } from '@/components/hr/offers/CreateOfferDialog';
import { OnboardDialog } from '@/components/hr/onboarding/OnboardDialog';
import { ApplicationStatus } from '@/types/hr';

// Resume Download Button Component for private bucket
function ResumeDownloadButton({ resumeUrl, candidateName }: { resumeUrl: string; candidateName: string }) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Extract file path from the URL
      let filePath = '';
      if (resumeUrl.includes('/hr-documents/')) {
        filePath = resumeUrl.split('/hr-documents/').pop() || '';
      } else {
        filePath = resumeUrl;
      }

      if (!filePath) {
        throw new Error('Invalid resume URL');
      }

      // Create a signed URL for the private bucket (valid for 60 seconds)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('hr-documents')
        .createSignedUrl(filePath, 60);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw signedUrlError || new Error('Failed to generate download URL');
      }

      // Download using signed URL
      const response = await fetch(signedUrlData.signedUrl);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `${candidateName.replace(/\s+/g, '_')}_resume.pdf`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Download failed',
        description: 'Unable to download resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
      <Download className="h-4 w-4 mr-2" />
      {isDownloading ? 'Downloading...' : 'Download Resume'}
    </Button>
  );
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: application, isLoading } = useJobApplication(id!);
  const { data: interviews } = useCandidateInterviews(id);
  const { data: stages } = useInterviewStages(application?.job_id || '');
  const { data: offers } = useCandidateOffers(id);
  const updateApplication = useUpdateApplication();
  const updateOffer = useUpdateOffer();
  const sendOffer = useSendOffer();

  const [notes, setNotes] = useState('');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [onboardDialogOpen, setOnboardDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<typeof interviews extends (infer T)[] | undefined ? T : never | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<typeof offers extends (infer T)[] | undefined ? T : never | null>(null);

  // Get the active offer (most recent non-declined/expired)
  const activeOffer = offers?.find(o => ['draft', 'sent', 'accepted'].includes(o.status || ''));

  const handleMarkOfferSent = () => {
    if (activeOffer) {
      sendOffer.mutate({ 
        offerId: activeOffer.id, 
        applicationId: application.id 
      });
    }
  };

  const handleOfferAccepted = () => {
    if (activeOffer) {
      updateOffer.mutate({ id: activeOffer.id, status: 'accepted', responded_at: new Date().toISOString() });
      updateApplication.mutate({ id: application.id, status: 'offer_accepted' });
    }
  };

  const handleOfferDeclined = () => {
    if (activeOffer) {
      updateOffer.mutate({ id: activeOffer.id, status: 'declined', responded_at: new Date().toISOString() });
      updateApplication.mutate({ id: application.id, status: 'offer_declined' });
    }
  };

  const handleMarkHired = () => {
    updateApplication.mutate({ id: application.id, status: 'hired' });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  if (!application) {
    return (
      <Layout>
        <div className="text-center py-12">Application not found</div>
      </Layout>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: 'bg-blue-100 text-blue-700',
      shortlisted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      in_interview: 'bg-yellow-100 text-yellow-700',
      selected: 'bg-purple-100 text-purple-700',
      offer_sent: 'bg-indigo-100 text-indigo-700',
      offer_accepted: 'bg-emerald-100 text-emerald-700',
      offer_declined: 'bg-gray-100 text-gray-700',
      hired: 'bg-teal-100 text-teal-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const handleStatusChange = (status: ApplicationStatus) => {
    updateApplication.mutate({ id: application.id, status });
  };

  const handleSaveNotes = () => {
    updateApplication.mutate({ id: application.id, hr_notes: notes || application.hr_notes });
  };

  const sendInterviewEmail = (interview: typeof interviews extends (infer T)[] | undefined ? T : never) => {
    const subject = `Interview Scheduled - ${application.job?.job_title || 'Position'} at Metasage`;
    const body = `Dear ${application.candidate_name},

We are pleased to invite you for ${interview.stage?.stage_name || 'an interview'} for the position of ${application.job?.job_title || 'the role you applied for'}.

Interview Details:
- Date: ${interview.scheduled_date ? format(new Date(interview.scheduled_date), 'MMMM dd, yyyy') : 'To be confirmed'}
- Time: ${interview.scheduled_time || 'To be confirmed'}
- Type: ${interview.interview_type || 'To be confirmed'}
${interview.meeting_link ? `- Meeting Link: ${interview.meeting_link}` : ''}
${interview.location ? `- Location: ${interview.location}` : ''}
- Duration: ${interview.duration_minutes || 60} minutes
${interview.interviewer_names?.length ? `- Interviewer(s): ${interview.interviewer_names.join(', ')}` : ''}

Please confirm your availability by replying to this email.

Best regards,
HR Team
Metasage Alliance`;

    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(application.candidate_email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const sendOfferEmail = (offer: typeof offers extends (infer T)[] | undefined ? T : never) => {
    const refNumber = `AC/HR/${new Date().getFullYear()}/${offer.id.slice(0, 4).toUpperCase()}`;
    const currentDate = format(new Date(), 'MMMM dd, yyyy');
    
    const subject = `Offer Letter - ${offer.job_title} Position at Metasage Alliance`;
    const body = `OFFER LETTER

Ref: ${refNumber}
Date: ${currentDate}

To,
${application.candidate_name}
${application.candidate_email}

Dear ${application.candidate_name},

We are pleased to offer you the position of ${offer.job_title}${offer.department ? ` in the ${offer.department} department` : ''} at Metasage Alliance.

POSITION DETAILS:
- Position: ${offer.job_title}
${offer.department ? `- Department: ${offer.department}` : ''}
- Salary: ₹${offer.offered_salary?.toLocaleString()} per annum
- Probation Period: ${offer.probation_period_months || 6} months
- Joining Date: ${offer.joining_date ? format(new Date(offer.joining_date), 'MMMM dd, yyyy') : 'To be confirmed'}
${offer.benefits ? `

BENEFITS:
${offer.benefits}` : ''}

JOINING TIMELINE:
You are requested to confirm your acceptance and join the position within 30 days of receiving this offer letter. Failure to do so may lead to the offer being reconsidered or withdrawn.

We look forward to your dedication and performance-driven approach as part of our growing organization.

Warm regards,

HR Team
Metasage Alliance`;

    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(application.candidate_email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const statusFlow: ApplicationStatus[] = [
    'applied', 'shortlisted', 'in_interview', 'selected', 'offer_sent', 'offer_accepted', 'hired'
  ];
  const currentIndex = statusFlow.indexOf(application.status as ApplicationStatus);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/system-admin/hr-management/applications">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{application.candidate_name}</h1>
            <p className="text-muted-foreground">
              Applied for {application.job?.job_title || 'Unknown Position'}
            </p>
          </div>
          <Badge className={`${getStatusColor(application.status)} text-base px-4 py-1`}>
            {application.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Status Timeline */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {statusFlow.map((status, index) => (
                <div key={status} className="flex items-center">
                  <div className={`flex flex-col items-center ${index <= currentIndex ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index < currentIndex ? 'bg-primary text-primary-foreground' :
                      index === currentIndex ? 'bg-primary text-primary-foreground' :
                      'bg-muted'
                    }`}>
                      {index < currentIndex ? <CheckCircle className="h-5 w-5" /> : index + 1}
                    </div>
                    <span className="text-xs mt-1 capitalize">{status.replace('_', ' ')}</span>
                  </div>
                  {index < statusFlow.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 ${index < currentIndex ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Candidate Info */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{application.candidate_email}</p>
                    </div>
                  </div>
                  {application.candidate_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{application.candidate_phone}</p>
                      </div>
                    </div>
                  )}
                  {application.current_company && (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Current Company</p>
                        <p className="font-medium">{application.current_company}</p>
                      </div>
                    </div>
                  )}
                  {application.current_designation && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Current Designation</p>
                        <p className="font-medium">{application.current_designation}</p>
                      </div>
                    </div>
                  )}
                  {application.experience_years !== null && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Experience</p>
                        <p className="font-medium">{application.experience_years} years</p>
                      </div>
                    </div>
                  )}
                  {application.expected_salary && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Expected Salary</p>
                        <p className="font-medium">₹{application.expected_salary.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {application.notice_period_days && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Notice Period</p>
                        <p className="font-medium">{application.notice_period_days} days</p>
                      </div>
                    </div>
                  )}
                </div>

                {application.skills && application.skills.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {application.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {application.resume_url && (
                  <div>
                    <ResumeDownloadButton 
                      resumeUrl={application.resume_url} 
                      candidateName={application.candidate_name} 
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Interviews */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Interviews</CardTitle>
                {application.status !== 'rejected' && application.status !== 'hired' && (
                  <Button size="sm" onClick={() => {
                    setSelectedInterview(null);
                    setScheduleDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-1" />
                    Schedule Interview
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {!interviews || interviews.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">No interviews scheduled yet</p>
                ) : (
                  <div className="space-y-4">
                    {interviews.map((interview) => (
                      <div 
                        key={interview.id} 
                        className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSelectedInterview(interview);
                          setScheduleDialogOpen(true);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{interview.stage?.stage_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {interview.scheduled_date ? format(new Date(interview.scheduled_date), 'MMM dd, yyyy') : 'TBD'} 
                              {interview.scheduled_time ? ` at ${interview.scheduled_time}` : ''}
                            </p>
                            {interview.interviewer_names && (
                              <p className="text-sm">
                                Interviewers: {interview.interviewer_names.join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline">{interview.status}</Badge>
                            {interview.result && (
                              <Badge className={
                                interview.result === 'passed' ? 'bg-green-100 text-green-700' :
                                interview.result === 'failed' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }>
                                {interview.result}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Offers */}
            {(application.status === 'selected' || offers?.length) && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Offers</CardTitle>
                  {application.status === 'selected' && (!offers || offers.length === 0) && (
                    <Button size="sm" onClick={() => {
                      setSelectedOffer(null);
                      setOfferDialogOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-1" />
                      Create Offer
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {!offers || offers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6">No offers created yet</p>
                  ) : (
                    <div className="space-y-4">
                      {offers.map((offer) => (
                        <div 
                          key={offer.id} 
                          className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            setSelectedOffer(offer);
                            setOfferDialogOpen(true);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{offer.job_title}</h4>
                              <p className="text-sm text-muted-foreground">
                                Salary: ₹{offer.offered_salary?.toLocaleString()}
                              </p>
                              {offer.joining_date && (
                                <p className="text-sm">
                                  Start Date: {format(new Date(offer.joining_date), 'MMM dd, yyyy')}
                                </p>
                              )}
                            </div>
                            <Badge className={
                              offer.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              offer.status === 'declined' ? 'bg-red-100 text-red-700' :
                              offer.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              {offer.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {application.status === 'applied' && (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={() => handleStatusChange('shortlisted')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Shortlist
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-destructive" 
                      onClick={() => handleStatusChange('rejected')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                {application.status === 'shortlisted' && (
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setSelectedInterview(null);
                      setScheduleDialogOpen(true);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                )}
                {application.status === 'in_interview' && (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={() => handleStatusChange('selected')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Selected
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-destructive" 
                      onClick={() => handleStatusChange('rejected')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                {application.status === 'selected' && (!offers || offers.length === 0) && (
                  <Button 
                    className="w-full" 
                    onClick={() => setOfferDialogOpen(true)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Create Offer
                  </Button>
                )}
                {/* Selected with draft offer - Show "Mark Offer Sent" */}
                {application.status === 'selected' && activeOffer?.status === 'draft' && (
                  <Button 
                    className="w-full" 
                    onClick={handleMarkOfferSent}
                    disabled={sendOffer.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Mark Offer Sent
                  </Button>
                )}
                {/* Offer sent - Show Accept/Decline options */}
                {application.status === 'offer_sent' && activeOffer?.status === 'sent' && (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={handleOfferAccepted}
                      disabled={updateOffer.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Accepted
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full text-destructive" 
                      onClick={handleOfferDeclined}
                      disabled={updateOffer.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Mark Declined
                    </Button>
                  </>
                )}
                {/* Offer accepted - Show Hire button */}
                {application.status === 'offer_accepted' && (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={handleMarkHired}
                      disabled={updateApplication.isPending}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Mark as Hired
                    </Button>
                    {activeOffer && (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setOnboardDialogOpen(true)}
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        Start Onboarding
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* HR Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  HR Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea 
                  placeholder="Add notes about this candidate..."
                  value={notes || application.hr_notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleSaveNotes}
                >
                  Save Notes
                </Button>
              </CardContent>
            </Card>

            {/* Application Meta */}
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Applied On</span>
                  <span>{format(new Date(application.applied_at), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <span className="capitalize">{application.source.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{format(new Date(application.updated_at), 'MMM dd, yyyy')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Schedule Interview Dialog */}
      <ScheduleInterviewDialog 
        open={scheduleDialogOpen}
        onOpenChange={(open) => {
          setScheduleDialogOpen(open);
          if (!open) setSelectedInterview(null);
        }}
        applicationId={application.id}
        jobId={application.job_id || ''}
        stages={stages || []}
        candidateEmail={application.candidate_email}
        candidateName={application.candidate_name}
        jobTitle={application.job?.job_title}
        editInterview={selectedInterview}
      />

      {/* Create/Edit Offer Dialog */}
      <CreateOfferDialog 
        open={offerDialogOpen}
        onOpenChange={(open) => {
          setOfferDialogOpen(open);
          if (!open) setSelectedOffer(null);
        }}
        application={application}
        editOffer={selectedOffer}
      />

      {/* Onboard Dialog */}
      {activeOffer && (
        <OnboardDialog 
          open={onboardDialogOpen}
          onOpenChange={setOnboardDialogOpen}
          offer={activeOffer}
        />
      )}
    </Layout>
  );
}
