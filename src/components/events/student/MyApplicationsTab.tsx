import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockEventApplications, mockActivityEvents } from '@/data/mockEventsData';
import { ApplicationStatusBadge } from '../ApplicationStatusBadge';
import { ApplicationDetailDialog } from './ApplicationDetailDialog';
import { Eye, Users } from 'lucide-react';
import { format } from 'date-fns';

export function MyApplicationsTab() {
  // Mock: Filter applications for current student
  const [applications] = useState(
    mockEventApplications.filter(app => 
      ['springfield-8-A-001', 'springfield-10-B-003', 'springfield-9-A-002'].includes(app.student_id)
    )
  );
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

  const getEventName = (eventId: string) => {
    return mockActivityEvents.find(e => e.id === eventId)?.title || 'Unknown Event';
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Shortlisted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.shortlisted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>You haven't applied to any events yet.</p>
              <p className="text-sm mt-2">Browse available events and submit your ideas!</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Idea Title</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">
                        {getEventName(application.event_id)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {application.idea_title}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(application.applied_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {application.is_team_application ? (
                          <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" />
                            Team
                          </Badge>
                        ) : (
                          <Badge variant="outline">Individual</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <ApplicationStatusBadge status={application.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedApplicationId(application.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Detail Dialog */}
      {selectedApplicationId && (
        <ApplicationDetailDialog
          applicationId={selectedApplicationId}
          open={!!selectedApplicationId}
          onOpenChange={(open) => !open && setSelectedApplicationId(null)}
        />
      )}
    </div>
  );
}
