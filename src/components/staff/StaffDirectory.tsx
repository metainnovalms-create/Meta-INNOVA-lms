import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Users, Eye, Mail, Phone, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface MetaStaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  employee_id: string | null;
  designation: string | null;
  department: string | null;
  status: string | null;
  profile_photo_url: string | null;
  position_id: string | null;
  position_name: string | null;
  hourly_rate: number | null;
  join_date: string | null;
}

export default function StaffDirectory() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<MetaStaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMetaStaff();
  }, []);

  const fetchMetaStaff = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all profiles with position_id (meta staff)
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('id, name, email, phone, employee_id, designation, department, status, profile_photo_url, position_id, hourly_rate, join_date')
        .not('position_id', 'is', null)
        .order('name');

      if (error) throw error;

      // Fetch all positions to map names
      const { data: positionsData } = await supabase
        .from('positions')
        .select('id, display_name');

      const positionMap = new Map<string, string>();
      (positionsData || []).forEach((pos: any) => {
        positionMap.set(pos.id, pos.display_name);
      });

      const mappedStaff: MetaStaffMember[] = (profilesData || []).map((profile: any) => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        employee_id: profile.employee_id,
        designation: profile.designation,
        department: profile.department,
        status: profile.status || 'active',
        profile_photo_url: profile.profile_photo_url,
        position_id: profile.position_id,
        position_name: positionMap.get(profile.position_id) || 'Unknown Position',
        hourly_rate: profile.hourly_rate,
        join_date: profile.join_date,
      }));

      setStaff(mappedStaff);
    } catch (error) {
      console.error('Error fetching meta staff:', error);
      toast.error('Failed to load staff directory');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStaff = staff.filter(
    (member) =>
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      active: { variant: 'default', label: 'Active' },
      on_leave: { variant: 'secondary', label: 'On Leave' },
      terminated: { variant: 'destructive', label: 'Terminated' },
    };
    const statusConfig = statusMap[status || 'active'] || statusMap.active;
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 flex-1 max-w-sm" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Stats */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, position, or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary" className="gap-1">
          <Users className="h-3 w-3" />
          {staff.length} Staff Members
        </Badge>
      </div>

      {/* Staff Table */}
      <Card>
        <CardContent className="p-0">
          {filteredStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No staff members found matching your search' : 'No meta staff members yet'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Add users to positions in the Positions tab to see them here
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => (
                  <TableRow
                    key={member.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/system-admin/meta-staff/${member.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.profile_photo_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          {member.designation && (
                            <p className="text-xs text-muted-foreground">{member.designation}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span>{member.position_name}</span>
                      </div>
                      {member.department && (
                        <p className="text-xs text-muted-foreground mt-1">{member.department}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[180px]">{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {member.employee_id || '-'}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/system-admin/meta-staff/${member.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
