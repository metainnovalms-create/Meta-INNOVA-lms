import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useOfficerByUserId } from '@/hooks/useOfficerProfile';
import { OfficerDailyAttendanceDetails } from '@/components/officer/OfficerDailyAttendanceDetails';
import { Loader2 } from 'lucide-react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Award,
  Code,
  Building2,
  Briefcase,
  CreditCard,
  Shield,
  Calendar,
  ChevronDown,
} from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  
  // Get officer data from database
  const { data: officer, isLoading, error } = useOfficerByUserId(user?.id);

  // Get current month
  const currentDate = new Date();
  const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  // Initialize selected month
  useEffect(() => {
    if (!selectedMonth && officer) {
      setSelectedMonth(currentMonthYear);
    }
  }, [officer, selectedMonth, currentMonthYear]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Safe array accessors for JSONB fields
  const qualifications = Array.isArray((officer as any)?.qualifications) ? (officer as any).qualifications : [];
  const certifications = Array.isArray((officer as any)?.certifications) ? (officer as any).certifications : [];
  const skills = Array.isArray((officer as any)?.skills) ? (officer as any).skills : [];
  const assignedInstitutions = Array.isArray(officer?.assigned_institutions) ? officer.assigned_institutions : [];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!officer) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Officer profile not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">View your personal and professional information</p>
        </div>

        {/* Profile Header Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <Avatar className="h-24 w-24">
                <AvatarImage src={officer.profile_photo_url || undefined} alt={officer.full_name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(officer.full_name)}
                </AvatarFallback>
              </Avatar>

              {/* Main Info */}
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-2xl font-bold">{officer.full_name}</h2>
                  <p className="text-muted-foreground">{officer.employee_id || 'No Employee ID'}</p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant={officer.status === 'active' ? 'default' : 'secondary'}>
                    {officer.status === 'active' ? 'Active' : officer.status}
                  </Badge>
                  {(officer as any).employment_type && (
                    <Badge variant="outline">{(officer as any).employment_type.replace('_', ' ').toUpperCase()}</Badge>
                  )}
                  {officer.department && (
                    <Badge variant="outline" className="gap-1">
                      <Building2 className="h-3 w-3" />
                      {officer.department}
                    </Badge>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-6 text-sm">
                  {(officer as any).join_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="font-medium">{new Date((officer as any).join_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{officer.email}</span>
                  </div>
                  {(officer as any).phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{(officer as any).phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(officer as any).date_of_birth && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{new Date((officer as any).date_of_birth).toLocaleDateString()}</p>
                  </div>
                  <Separator />
                </>
              )}
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </p>
                <p className="font-medium">{(officer as any).address || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Professional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Professional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Qualifications</p>
                {qualifications.length > 0 ? (
                  <ul className="space-y-1">
                    {qualifications.map((qual: string, idx: number) => (
                      <li key={idx} className="text-sm font-medium">• {qual}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No qualifications listed</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Certifications
                </p>
                {certifications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {certifications.map((cert: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No certifications listed</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Employment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{officer.employee_id || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{officer.department || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Designation</p>
                  <p className="font-medium capitalize">{officer.designation || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={officer.status === 'active' ? 'default' : 'secondary'}>
                    {officer.status}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Skills
                </p>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills listed</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Placeholder for layout balance */}
          <div className="hidden lg:block" />
        </div>

        {/* Full Width Cards */}
        <div className="space-y-6">
          {/* Daily Attendance Details */}
          {officer && selectedMonth && (
            <OfficerDailyAttendanceDetails
              officerId={officer.id}
              officerName={officer.full_name}
              month={selectedMonth}
            />
          )}

          {/* Assigned Institutions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Assigned Institutions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedInstitutions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {assignedInstitutions.map((inst, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm">
                      {inst}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No institutions assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Bank Details - Collapsible */}
          <Collapsible>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Bank Details
                  </CardTitle>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Bank details are managed by the management team. Contact HR for updates.
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Statutory Information - Collapsible */}
          <Collapsible>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Statutory Information
                  </CardTitle>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Statutory information (PF, ESI, PAN, etc.) is managed by the management team. Contact HR for details.
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>
    </Layout>
  );
}
