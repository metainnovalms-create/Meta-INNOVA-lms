import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Briefcase, MapPin, Clock, Users, DollarSign,
  Edit, Pause, Play, Plus, Copy, ExternalLink
} from 'lucide-react';
import { useJobPosting, useJobApplications, useInterviewStages, useUpdateJobPosting } from '@/hooks/useHRManagement';
import { format } from 'date-fns';
import { CreateJobDialog } from '@/components/hr/jobs/CreateJobDialog';
import { ApplyJobDialog } from '@/components/hr/applications/ApplyJobDialog';
import { useToast } from '@/hooks/use-toast';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: job, isLoading } = useJobPosting(id!);
  const { data: applications } = useJobApplications(id);
  const { data: stages } = useInterviewStages(id!);
  const updateJob = useUpdateJobPosting();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);

  const publicApplicationUrl = `${window.location.origin}/careers/apply/${id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicApplicationUrl);
    toast({
      title: 'Link Copied!',
      description: 'Public application link copied to clipboard',
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="text-center py-12">Job not found</div>
      </Layout>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
      on_hold: 'bg-yellow-100 text-yellow-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getAppStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: 'bg-blue-100 text-blue-700',
      shortlisted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      in_interview: 'bg-yellow-100 text-yellow-700',
      selected: 'bg-purple-100 text-purple-700',
      offer_sent: 'bg-indigo-100 text-indigo-700',
      offer_accepted: 'bg-emerald-100 text-emerald-700',
      hired: 'bg-teal-100 text-teal-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const handleToggleStatus = () => {
    const newStatus = job.status === 'open' ? 'on_hold' : 'open';
    updateJob.mutate({ id: job.id, status: newStatus });
  };

  const applicationStats = {
    total: applications?.length || 0,
    shortlisted: applications?.filter(a => a.status === 'shortlisted').length || 0,
    interviewing: applications?.filter(a => a.status === 'in_interview').length || 0,
    selected: applications?.filter(a => ['selected', 'offer_sent', 'offer_accepted', 'hired'].includes(a.status)).length || 0,
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/system-admin/hr-management/jobs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{job.job_title}</h1>
              <Badge className={getStatusColor(job.status)}>
                {job.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {job.department && `${job.department} • `}
              {job.location && `${job.location} • `}
              Posted {format(new Date(job.created_at), 'MMM dd, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" onClick={handleToggleStatus}>
              {job.status === 'open' ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Put on Hold
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Reopen
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Public Link
            </Button>
            <Button variant="outline" onClick={() => setApplyDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Manually
            </Button>
            <Link to={`/careers/apply/${job.id}`} target="_blank">
              <Button variant="secondary">
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </Link>
          </div>
        </div>

        {/* Public Application Link */}
        {job.status === 'open' && (
          <Card className="bg-muted/50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Public Application Link:</span>
                  <code className="text-sm bg-background px-2 py-1 rounded">{publicApplicationUrl}</code>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{applicationStats.total}</p>
              <p className="text-sm text-muted-foreground">Total Applications</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{applicationStats.shortlisted}</p>
              <p className="text-sm text-muted-foreground">Shortlisted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{applicationStats.interviewing}</p>
              <p className="text-sm text-muted-foreground">In Interview</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{applicationStats.selected}</p>
              <p className="text-sm text-muted-foreground">Selected/Hired</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Job Details */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Employment Type</p>
                    <p className="font-medium capitalize">{job.employment_type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Openings</p>
                    <p className="font-medium">{job.number_of_openings}</p>
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
                  <CardTitle>Required Skills</CardTitle>
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

            {stages && stages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Interview Stages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stages.map((stage, i) => (
                      <div key={stage.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {i + 1}
                        </div>
                        <span>{stage.stage_name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Applications */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Applications ({applications?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {!applications || applications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No applications yet</p>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <div 
                        key={app.id} 
                        className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/system-admin/hr-management/applications/${app.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{app.candidate_name}</h4>
                            <p className="text-sm text-muted-foreground">{app.candidate_email}</p>
                            {app.current_designation && (
                              <p className="text-sm">
                                {app.current_designation} at {app.current_company}
                              </p>
                            )}
                          </div>
                          <Badge className={getAppStatusColor(app.status)}>
                            {app.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <CreateJobDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editJob={job}
      />

      <ApplyJobDialog
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        jobId={job.id}
      />
    </Layout>
  );
}
