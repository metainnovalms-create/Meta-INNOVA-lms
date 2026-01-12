import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, Clock, DollarSign, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

export default function CareersPage() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['public-job-postings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Explore exciting career opportunities and be part of our mission to transform education through innovation.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Open Positions</h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading opportunities...</p>
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Open Positions</h3>
                <p className="text-muted-foreground">
                  We don't have any open positions at the moment. Please check back later!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{job.job_title}</CardTitle>
                        {job.department && (
                          <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <Building2 className="h-4 w-4" />
                            <span>{job.department}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {job.employment_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      {job.experience_level && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="capitalize">{job.experience_level} Level</span>
                        </div>
                      )}
                      {(job.salary_range_min || job.salary_range_max) && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>
                            ₹{job.salary_range_min?.toLocaleString() || '0'} - ₹{job.salary_range_max?.toLocaleString() || 'Negotiable'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {job.required_skills && job.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.required_skills.slice(0, 5).map((skill, i) => (
                          <Badge key={i} variant="outline">{skill}</Badge>
                        ))}
                        {job.required_skills.length > 5 && (
                          <Badge variant="outline">+{job.required_skills.length - 5} more</Badge>
                        )}
                      </div>
                    )}
                    
                    <Link to={`/careers/apply/${job.id}`}>
                      <Button className="w-full sm:w-auto">Apply Now</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
