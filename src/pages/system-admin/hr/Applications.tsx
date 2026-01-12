import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Users, Filter, Eye, FileText, Mail, Phone,
  Building2, Briefcase, Calendar, ArrowLeft
} from 'lucide-react';
import { useJobApplications, useUpdateApplication } from '@/hooks/useHRManagement';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApplicationStatus } from '@/types/hr';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const APPLICATION_STATUSES: { value: ApplicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Applications' },
  { value: 'applied', label: 'Applied' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'in_interview', label: 'In Interview' },
  { value: 'selected', label: 'Selected' },
  { value: 'offer_sent', label: 'Offer Sent' },
  { value: 'offer_accepted', label: 'Offer Accepted' },
  { value: 'offer_declined', label: 'Offer Declined' },
  { value: 'hired', label: 'Hired' },
];

// Resume Button Component for private bucket
function ResumeButton({ resumeUrl }: { resumeUrl: string }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleViewResume = async () => {
    setIsLoading(true);
    try {
      let filePath = '';
      if (resumeUrl.includes('/hr-documents/')) {
        filePath = resumeUrl.split('/hr-documents/').pop() || '';
      } else {
        filePath = resumeUrl;
      }

      if (!filePath) {
        throw new Error('Invalid resume URL');
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('hr-documents')
        .createSignedUrl(filePath, 60);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw signedUrlError || new Error('Failed to generate URL');
      }

      window.open(signedUrlData.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to open resume:', error);
      toast({
        title: 'Failed to open resume',
        description: 'Unable to access resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleViewResume} disabled={isLoading}>
      <FileText className="h-4 w-4 mr-1" />
      {isLoading ? 'Loading...' : 'Resume'}
    </Button>
  );
}

export default function Applications() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';
  
  const { data: applications, isLoading } = useJobApplications();
  const updateApplication = useUpdateApplication();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const filteredApplications = applications?.filter(app => {
    const matchesSearch = 
      app.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.candidate_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job?.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || app.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  }) || [];

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

  const handleQuickAction = (id: string, status: ApplicationStatus) => {
    updateApplication.mutate({ id, status });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/system-admin/hr-management">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Applications</h1>
            <p className="text-muted-foreground">Review and manage candidate applications</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, email, or job title..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="job_portal">Job Portal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: applications?.length || 0 },
            { label: 'Applied', value: applications?.filter(a => a.status === 'applied').length || 0 },
            { label: 'Shortlisted', value: applications?.filter(a => a.status === 'shortlisted').length || 0 },
            { label: 'In Interview', value: applications?.filter(a => a.status === 'in_interview').length || 0 },
            { label: 'Selected', value: applications?.filter(a => a.status === 'selected').length || 0 },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Applications List */}
        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No applications found</h3>
              <p className="text-muted-foreground">Applications will appear here when candidates apply for jobs</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{app.candidate_name}</h3>
                        <Badge className={getStatusColor(app.status)}>
                          {app.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1" />
                          {app.job?.job_title || 'N/A'}
                        </span>
                        <span className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {app.candidate_email}
                        </span>
                        {app.candidate_phone && (
                          <span className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {app.candidate_phone}
                          </span>
                        )}
                        {app.current_company && (
                          <span className="flex items-center">
                            <Building2 className="h-4 w-4 mr-1" />
                            {app.current_company}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Applied {format(new Date(app.applied_at), 'MMM dd, yyyy')}
                        </span>
                      </div>

                      {app.skills && app.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {app.skills.slice(0, 5).map((skill, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {app.skills.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{app.skills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Quick Actions for screening */}
                      {app.status === 'applied' && (
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => handleQuickAction(app.id, 'shortlisted')}
                          >
                            Shortlist
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-destructive"
                            onClick={() => handleQuickAction(app.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {app.resume_url && (
                        <ResumeButton resumeUrl={app.resume_url} />
                      )}
                      <Link to={`/system-admin/hr-management/applications/${app.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
