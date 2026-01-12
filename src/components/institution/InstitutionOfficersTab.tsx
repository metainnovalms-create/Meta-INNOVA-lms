import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, UserMinus, Mail, Phone, Calendar, BookOpen, Clock, Search, ExternalLink, Users } from 'lucide-react';
import { OfficerAssignment } from '@/types/institution';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface InstitutionOfficersTabProps {
  institutionId: string;
  institutionName: string;
  assignedOfficers: OfficerAssignment[];
  availableOfficers: OfficerAssignment[];
  onAssignOfficer: (officerId: string) => Promise<void>;
  onRemoveOfficer: (officerId: string) => Promise<void>;
}

export const InstitutionOfficersTab = ({
  institutionName,
  assignedOfficers,
  availableOfficers,
  onAssignOfficer,
  onRemoveOfficer
}: InstitutionOfficersTabProps) => {
  const navigate = useNavigate();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficers, setSelectedOfficers] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  const filteredAvailableOfficers = availableOfficers.filter(officer =>
    officer.officer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    officer.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    officer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async () => {
    if (selectedOfficers.length === 0) {
      toast.error('Please select at least one officer');
      return;
    }

    setIsAssigning(true);
    try {
      for (const officerId of selectedOfficers) {
        await onAssignOfficer(officerId);
      }
      toast.success(`Successfully assigned ${selectedOfficers.length} officer(s) to ${institutionName}`);
      setSelectedOfficers([]);
      setIsAssignDialogOpen(false);
      setSearchQuery('');
    } catch (error) {
      toast.error('Failed to assign officers');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemove = async (officerId: string, officerName: string) => {
    if (window.confirm(`Remove ${officerName} from ${institutionName}?`)) {
      try {
        await onRemoveOfficer(officerId);
        toast.success(`${officerName} removed from institution`);
      } catch (error) {
        toast.error('Failed to remove officer');
      }
    }
  };

  const toggleOfficerSelection = (officerId: string) => {
    setSelectedOfficers(prev =>
      prev.includes(officerId)
        ? prev.filter(id => id !== officerId)
        : [...prev, officerId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Innovation Officers</h3>
          <p className="text-sm text-muted-foreground">
            Manage innovation officers assigned to this institution
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {assignedOfficers.length} Assigned
          </Badge>
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assign Officers
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign Innovation Officers</DialogTitle>
                <DialogDescription>
                  Select officers to assign to {institutionName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, employee ID, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <ScrollArea className="h-[400px] border rounded-lg p-4">
                  {filteredAvailableOfficers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {availableOfficers.length === 0 
                        ? 'All officers are already assigned to this institution'
                        : 'No officers found matching your search'
                      }
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredAvailableOfficers.map((officer) => (
                        <div
                          key={officer.officer_id}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => toggleOfficerSelection(officer.officer_id)}
                        >
                          <Checkbox
                            checked={selectedOfficers.includes(officer.officer_id)}
                            onCheckedChange={() => toggleOfficerSelection(officer.officer_id)}
                          />
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={officer.avatar} />
                            <AvatarFallback>
                              {officer.officer_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">{officer.officer_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {officer.employee_id} • {officer.email}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {selectedOfficers.length} officer(s) selected
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAssignDialogOpen(false);
                        setSelectedOfficers([]);
                        setSearchQuery('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAssign}
                      disabled={selectedOfficers.length === 0 || isAssigning}
                    >
                      {isAssigning ? 'Assigning...' : `Assign ${selectedOfficers.length} Officer(s)`}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {assignedOfficers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Officers Assigned</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Assign innovation officers to manage courses and students at this institution
            </p>
            <Button onClick={() => setIsAssignDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Assign Your First Officer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assignedOfficers.map((officer) => (
            <Card key={officer.officer_id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={officer.avatar} />
                    <AvatarFallback className="text-lg">
                      {officer.officer_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{officer.officer_name}</CardTitle>
                    <CardDescription className="truncate">{officer.employee_id}</CardDescription>
                  </div>
                  <Badge variant={officer.status === 'active' ? 'default' : 'secondary'}>
                    {officer.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{officer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{officer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Assigned: {new Date(officer.assigned_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="text-sm font-medium">{officer.total_courses}</div>
                      <div className="text-xs text-muted-foreground">Courses</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="text-sm font-medium">{officer.total_teaching_hours}h</div>
                      <div className="text-xs text-muted-foreground">Teaching</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/system-admin/officers/${officer.officer_id}`)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleRemove(officer.officer_id, officer.officer_name)}
                  >
                    <UserMinus className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
