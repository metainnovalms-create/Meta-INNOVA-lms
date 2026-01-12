import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Briefcase, MapPin, Clock, DollarSign, Building2, 
  ArrowLeft, Upload, CheckCircle, Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function JobApplicationPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    candidate_name: '',
    candidate_email: '',
    candidate_phone: '',
    experience_years: '',
    current_company: '',
    current_designation: '',
    expected_salary: '',
    notice_period_days: '',
    skills: '',
    cover_letter: '',
  });

  const { data: job, isLoading } = useQuery({
    queryKey: ['public-job-posting', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', jobId)
        .eq('status', 'open')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Resume file must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.candidate_name || !formData.candidate_email) {
      toast({
        title: 'Required fields missing',
        description: 'Please fill in your name and email',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let resumeUrl = '';
      
      // Upload resume if provided
      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `resumes/${jobId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('hr-documents')
          .upload(fileName, resumeFile);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('hr-documents')
          .getPublicUrl(fileName);
        
        resumeUrl = urlData.publicUrl;
      }

      // Submit application
      const skillsArray = formData.skills
        ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const { error } = await supabase.from('job_applications').insert({
        job_id: jobId,
        candidate_name: formData.candidate_name,
        candidate_email: formData.candidate_email,
        candidate_phone: formData.candidate_phone || null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        current_company: formData.current_company || null,
        current_designation: formData.current_designation || null,
        expected_salary: formData.expected_salary ? parseInt(formData.expected_salary) : null,
        notice_period_days: formData.notice_period_days ? parseInt(formData.notice_period_days) : null,
        skills: skillsArray.length > 0 ? skillsArray : null,
        cover_letter: formData.cover_letter || null,
        resume_url: resumeUrl || null,
        status: 'applied',
        source: 'career_portal',
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: 'Application Submitted!',
        description: 'Thank you for applying. We will review your application and get back to you.',
      });
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="text-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Position Not Available</h3>
            <p className="text-muted-foreground mb-4">
              This job posting is no longer accepting applications.
            </p>
            <Link to="/careers">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                View All Positions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Application Submitted!</h3>
            <p className="text-muted-foreground mb-6">
              Thank you for applying for {job.job_title}. We have received your application and will review it shortly.
            </p>
            <Link to="/careers">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                View More Positions
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <Link to="/careers" className="inline-flex items-center text-primary-foreground/80 hover:text-primary-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Positions
          </Link>
          <h1 className="text-3xl font-bold">{job.job_title}</h1>
          {job.department && (
            <div className="flex items-center gap-2 mt-2 text-primary-foreground/80">
              <Building2 className="h-4 w-4" />
              <span>{job.department}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Job Details Sidebar */}
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{job.location}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Employment Type</p>
                    <p className="font-medium capitalize">{job.employment_type.replace('_', ' ')}</p>
                  </div>
                </div>
                {job.experience_level && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Experience Level</p>
                      <p className="font-medium capitalize">{job.experience_level}</p>
                    </div>
                  </div>
                )}
                {(job.salary_range_min || job.salary_range_max) && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Salary Range</p>
                      <p className="font-medium">
                        ₹{job.salary_range_min?.toLocaleString() || '0'} - ₹{job.salary_range_max?.toLocaleString() || 'Negotiable'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {job.required_skills && job.required_skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Required Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.map((skill, i) => (
                      <Badge key={i} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {job.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Application Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Apply for this Position</CardTitle>
                <CardDescription>
                  Fill out the form below to submit your application. Fields marked with * are required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Info */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Personal Information</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="candidate_name">Full Name *</Label>
                        <Input
                          id="candidate_name"
                          name="candidate_name"
                          value={formData.candidate_name}
                          onChange={handleInputChange}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="candidate_email">Email *</Label>
                        <Input
                          id="candidate_email"
                          name="candidate_email"
                          type="email"
                          value={formData.candidate_email}
                          onChange={handleInputChange}
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="candidate_phone">Phone Number</Label>
                      <Input
                        id="candidate_phone"
                        name="candidate_phone"
                        value={formData.candidate_phone}
                        onChange={handleInputChange}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  {/* Professional Info */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Professional Information</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="experience_years">Years of Experience</Label>
                        <Input
                          id="experience_years"
                          name="experience_years"
                          type="number"
                          min="0"
                          value={formData.experience_years}
                          onChange={handleInputChange}
                          placeholder="5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notice_period_days">Notice Period (in days)</Label>
                        <Input
                          id="notice_period_days"
                          name="notice_period_days"
                          type="number"
                          min="0"
                          value={formData.notice_period_days}
                          onChange={handleInputChange}
                          placeholder="30"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="current_company">Current Company</Label>
                        <Input
                          id="current_company"
                          name="current_company"
                          value={formData.current_company}
                          onChange={handleInputChange}
                          placeholder="ABC Corp"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="current_designation">Current Designation</Label>
                        <Input
                          id="current_designation"
                          name="current_designation"
                          value={formData.current_designation}
                          onChange={handleInputChange}
                          placeholder="Senior Developer"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expected_salary">Expected Salary (Annual in ₹)</Label>
                      <Input
                        id="expected_salary"
                        name="expected_salary"
                        type="number"
                        value={formData.expected_salary}
                        onChange={handleInputChange}
                        placeholder="1200000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="skills">Skills (comma separated)</Label>
                      <Input
                        id="skills"
                        name="skills"
                        value={formData.skills}
                        onChange={handleInputChange}
                        placeholder="React, TypeScript, Node.js"
                      />
                    </div>
                  </div>

                  {/* Resume & Cover Letter */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Documents</h3>
                    <div className="space-y-2">
                      <Label htmlFor="resume">Resume (PDF, DOC - max 5MB)</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="resume"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="flex-1"
                        />
                        {resumeFile && (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            {resumeFile.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cover_letter">Cover Letter</Label>
                      <Textarea
                        id="cover_letter"
                        name="cover_letter"
                        value={formData.cover_letter}
                        onChange={handleInputChange}
                        placeholder="Tell us why you'd be a great fit for this role..."
                        rows={5}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} Metova Learning. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
